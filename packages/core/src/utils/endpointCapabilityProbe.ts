/**
 * @license
 * Copyright 2026 Hanhai Team.
 * SPDX-License-Identifier: Apache-2.0
 */

// Endpoint capability probe — discover the actual context-window size that
// an OpenAI-compatible inference engine is configured to serve, instead of
// trusting hand-written `contextWindowSize` in settings.json that drifts
// from `-c <N>` on the server.
//
// Strategy: try three real-world endpoints in order, take the first success.
//   1. GET  <root>/v1/models           — vLLM exposes data[].max_model_len
//   2. GET  <root>/props               — llama.cpp exposes
//                                        default_generation_settings.n_ctx
//   3. POST <root>/api/show {name}     — Ollama exposes parameters num_ctx
//                                        or model_info.<family>.context_length
//
// Designed to be cheap (~1.5s per endpoint, 4s total budget), silent on
// failure (returns null source — caller falls back to existing logic),
// and cacheable so subsequent runs skip the network hop within TTL.

import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export type ProbeSource = 'v1-models' | 'llama-props' | 'ollama-show' | 'cache';

export interface ProbeResult {
  contextWindowSize?: number;
  source: ProbeSource | null;
  /** Endpoint URL that produced the result (for logging / debug). */
  endpoint?: string;
}

export interface ProbeOptions {
  baseUrl: string;
  apiKey?: string;
  modelId?: string;
  /** Per-endpoint network timeout. Default 1500ms. */
  timeoutMs?: number;
  /** Injected for tests. Defaults to globalThis.fetch. */
  fetcher?: typeof fetch;
  /**
   * Directory for the on-disk probe cache. Pass `null` to disable caching
   * entirely (useful in tests). Default: undefined = use disk default
   * (handled by caller — we don't pick a default here).
   */
  cacheDir?: string | null;
  /** Clock injection for TTL tests. Default Date.now. */
  now?: () => number;
  /** Cache time-to-live in milliseconds. Default 5 minutes. */
  cacheTtlMs?: number;
}

interface CacheEntry {
  contextWindowSize?: number;
  source: ProbeSource;
  endpoint?: string;
  timestamp: number;
}

interface CacheFile {
  version: 1;
  entries: Record<string, CacheEntry>;
}

const DEFAULT_TIMEOUT_MS = 1500;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_FILENAME = 'endpoint-capabilities.json';

// ---------------------------------------------------------------------------
// URL normalization
// ---------------------------------------------------------------------------

/**
 * Reduce a possibly-versioned baseUrl ("http://srv/v1") down to its root
 * ("http://srv") so we can build probe URLs that include their own path.
 */
function normalizeRoot(baseUrl: string): string {
  return baseUrl
    .replace(/\/+$/, '') // trim trailing slashes
    .replace(/\/v1$/, ''); // OpenAI-compat clients commonly append /v1 — strip
}

// ---------------------------------------------------------------------------
// Field extractors per engine
// ---------------------------------------------------------------------------

/**
 * vLLM populates `max_model_len` on each model entry in `/v1/models`.
 * Some other servers populate `context_length` or `n_ctx` instead — accept
 * any of those.
 */
function extractFromV1Models(
  data: unknown,
  modelId: string | undefined,
): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const rec = data as Record<string, unknown>;
  const list = rec['data'];
  if (!Array.isArray(list)) return undefined;

  // Prefer the entry whose id matches the requested model; fall back to first.
  const candidates = modelId
    ? [
        ...list.filter(
          (m) =>
            m &&
            typeof m === 'object' &&
            (m as Record<string, unknown>)['id'] === modelId,
        ),
        ...list,
      ]
    : list;

  for (const m of candidates) {
    if (!m || typeof m !== 'object') continue;
    const obj = m as Record<string, unknown>;
    for (const key of ['max_model_len', 'context_length', 'n_ctx']) {
      const v = obj[key];
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
    }
  }
  return undefined;
}

/** llama.cpp `/props` exposes default_generation_settings.n_ctx. */
function extractFromLlamaProps(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const rec = data as Record<string, unknown>;
  const settings = rec['default_generation_settings'];
  if (!settings || typeof settings !== 'object') return undefined;
  const v = (settings as Record<string, unknown>)['n_ctx'];
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  return undefined;
}

/**
 * Ollama `/api/show` returns `parameters` as a KEYWORD-VALUE TEXT BLOCK
 * (one per line). Real example:
 *     "num_ctx                        8192\nstop                           ...\n"
 * Fall back to model_info.<family>.context_length when num_ctx isn't set.
 */
function extractFromOllamaShow(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const rec = data as Record<string, unknown>;

  const params = rec['parameters'];
  if (typeof params === 'string') {
    const m = params.match(/^num_ctx\s+(\d+)/m);
    if (m) {
      const n = Number.parseInt(m[1]!, 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }

  const info = rec['model_info'];
  if (info && typeof info === 'object') {
    for (const [k, v] of Object.entries(info as Record<string, unknown>)) {
      if (k.endsWith('.context_length') && typeof v === 'number' && v > 0) {
        return v;
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  fetcher: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetcher(url, { ...init, signal: ctrl.signal });
    if (!resp.ok) return null;
    return resp;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function tryJsonGet<T = unknown>(
  fetcher: typeof fetch,
  url: string,
  apiKey: string | undefined,
  timeoutMs: number,
): Promise<T | null> {
  const headers: Record<string, string> = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const resp = await fetchWithTimeout(
    fetcher,
    url,
    { method: 'GET', headers },
    timeoutMs,
  );
  if (!resp) return null;
  try {
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

async function tryJsonPost<T = unknown>(
  fetcher: typeof fetch,
  url: string,
  apiKey: string | undefined,
  body: unknown,
  timeoutMs: number,
): Promise<T | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const resp = await fetchWithTimeout(
    fetcher,
    url,
    { method: 'POST', headers, body: JSON.stringify(body) },
    timeoutMs,
  );
  if (!resp) return null;
  try {
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

function cacheKey(baseUrl: string, modelId: string | undefined): string {
  return `${normalizeRoot(baseUrl)}|${modelId ?? ''}`;
}

async function readCache(cacheDir: string): Promise<CacheFile | null> {
  const file = path.join(cacheDir, CACHE_FILENAME);
  if (!existsSync(file)) return null;
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as CacheFile;
    if (parsed && parsed.version === 1 && parsed.entries) return parsed;
  } catch {
    // Corrupted cache — pretend it doesn't exist; will be overwritten on next write.
  }
  return null;
}

async function writeCache(cacheDir: string, file: CacheFile): Promise<void> {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    const dest = path.join(cacheDir, CACHE_FILENAME);
    await fs.writeFile(dest, JSON.stringify(file, null, 2), 'utf8');
  } catch {
    // Best-effort — cache write failure must not affect probe result.
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function probeEndpointCapabilities(
  opts: ProbeOptions,
): Promise<ProbeResult> {
  const fetcher = opts.fetcher ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = opts.now ?? Date.now;
  const cacheTtlMs = opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

  // ----- Cache lookup -----
  if (opts.cacheDir !== null && opts.cacheDir !== undefined) {
    const cache = await readCache(opts.cacheDir);
    if (cache) {
      const entry = cache.entries[cacheKey(opts.baseUrl, opts.modelId)];
      if (entry && now() - entry.timestamp < cacheTtlMs) {
        return {
          contextWindowSize: entry.contextWindowSize,
          source: 'cache',
          endpoint: entry.endpoint,
        };
      }
    }
  }

  const root = normalizeRoot(opts.baseUrl);

  // ----- 1. /v1/models (vLLM and OpenAI-compat with metadata) -----
  {
    const url = `${root}/v1/models`;
    const data = await tryJsonGet(fetcher, url, opts.apiKey, timeoutMs);
    const size = extractFromV1Models(data, opts.modelId);
    if (size !== undefined) {
      const result: ProbeResult = {
        contextWindowSize: size,
        source: 'v1-models',
        endpoint: url,
      };
      await persistResult(opts, now, result);
      return result;
    }
  }

  // ----- 2. /props (llama.cpp / llama-server) -----
  {
    const url = `${root}/props`;
    const data = await tryJsonGet(fetcher, url, opts.apiKey, timeoutMs);
    const size = extractFromLlamaProps(data);
    if (size !== undefined) {
      const result: ProbeResult = {
        contextWindowSize: size,
        source: 'llama-props',
        endpoint: url,
      };
      await persistResult(opts, now, result);
      return result;
    }
  }

  // ----- 3. POST /api/show (Ollama) -----
  if (opts.modelId) {
    const url = `${root}/api/show`;
    const data = await tryJsonPost(
      fetcher,
      url,
      opts.apiKey,
      { name: opts.modelId },
      timeoutMs,
    );
    const size = extractFromOllamaShow(data);
    if (size !== undefined) {
      const result: ProbeResult = {
        contextWindowSize: size,
        source: 'ollama-show',
        endpoint: url,
      };
      await persistResult(opts, now, result);
      return result;
    }
  }

  // ----- Nothing matched -----
  return { contextWindowSize: undefined, source: null };
}

async function persistResult(
  opts: ProbeOptions,
  now: () => number,
  result: ProbeResult,
): Promise<void> {
  if (opts.cacheDir === null || opts.cacheDir === undefined) return;
  if (result.source === null || result.source === 'cache') return;
  const existing = (await readCache(opts.cacheDir)) ?? {
    version: 1 as const,
    entries: {},
  };
  existing.entries[cacheKey(opts.baseUrl, opts.modelId)] = {
    contextWindowSize: result.contextWindowSize,
    source: result.source,
    endpoint: result.endpoint,
    timestamp: now(),
  };
  await writeCache(opts.cacheDir, existing);
}
