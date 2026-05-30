/**
 * @license
 * Copyright 2026 Hanhai Team.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import { probeEndpointCapabilities } from './endpointCapabilityProbe.js';

// ---------------------------------------------------------------------------
// Fixtures: real-world response shapes from each inference engine.
// ---------------------------------------------------------------------------

/** vLLM-style `/v1/models` — max_model_len on the model entry. */
const VLLM_V1_MODELS = {
  object: 'list',
  data: [
    {
      id: 'meta-llama/Llama-3.3-70B-Instruct',
      object: 'model',
      max_model_len: 131072,
    },
  ],
};

/** llama.cpp `/props` (subset of the real 10 KB response). */
const LLAMACPP_PROPS = {
  default_generation_settings: {
    n_ctx: 65536,
    params: { temperature: 1.0 },
  },
};

/** Ollama `POST /api/show` with `parameters` keyword-value text. */
const OLLAMA_SHOW = {
  modelfile: 'FROM llama3.3:70b\n',
  parameters:
    'num_ctx                        8192\nstop                           "<|eot_id|>"\n',
  template: '{{ .Prompt }}',
};

// Build a fetch double that returns specified responses per URL+method.
function makeFetcher(routes: Record<string, unknown>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    const key = `${method} ${url}`;
    if (key in routes) {
      const body = routes[key];
      if (body === '__NETWORK_ERROR__') throw new Error('ECONNREFUSED');
      if (body === '__TIMEOUT__') {
        // Never resolve — caller's AbortSignal will fire.
        return new Promise<Response>(() => {});
      }
      return new Response(JSON.stringify(body), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch;
}

describe('probeEndpointCapabilities', () => {
  it('extracts max_model_len from vLLM /v1/models', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': VLLM_V1_MODELS,
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv',
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBe(131072);
    expect(result.source).toBe('v1-models');
  });

  it('extracts n_ctx from llama.cpp /props when /v1/models has nothing useful', async () => {
    const fetcher = makeFetcher({
      // /v1/models returns OpenAI-shape with no ctx field
      'GET http://srv/v1/models': {
        object: 'list',
        data: [{ id: 'apex-q5', object: 'model' }],
      },
      'GET http://srv/props': LLAMACPP_PROPS,
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv',
      modelId: 'apex-q5',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBe(65536);
    expect(result.source).toBe('llama-props');
  });

  it('extracts num_ctx from Ollama /api/show when other endpoints miss', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': {
        object: 'list',
        data: [{ id: 'llama3.3:70b', object: 'model' }],
      },
      // /props 404
      'POST http://srv/api/show': OLLAMA_SHOW,
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv',
      modelId: 'llama3.3:70b',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBe(8192);
    expect(result.source).toBe('ollama-show');
  });

  it('returns null source when no endpoint has context info', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': {
        object: 'list',
        data: [{ id: 'mystery', object: 'model' }],
      },
      // No /props, no /api/show
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv',
      modelId: 'mystery',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBeUndefined();
    expect(result.source).toBeNull();
  });

  it('returns null source on network error (does not throw)', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': '__NETWORK_ERROR__',
      'GET http://srv/props': '__NETWORK_ERROR__',
      'POST http://srv/api/show': '__NETWORK_ERROR__',
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv',
      modelId: 'whatever',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBeUndefined();
    expect(result.source).toBeNull();
  });

  it('normalizes trailing slash in baseUrl', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': VLLM_V1_MODELS,
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv/',
      modelId: 'meta-llama/Llama-3.3-70B-Instruct',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBe(131072);
  });

  it('strips /v1 suffix from baseUrl when building probe URLs', async () => {
    const fetcher = makeFetcher({
      // /v1 stripped, so /props (not /v1/props)
      'GET http://srv/v1/models': {
        object: 'list',
        data: [{ id: 'apex', object: 'model' }],
      },
      'GET http://srv/props': LLAMACPP_PROPS,
    });

    const result = await probeEndpointCapabilities({
      baseUrl: 'http://srv/v1', // user wrote `/v1` in settings as is common
      modelId: 'apex',
      fetcher,
      cacheDir: null,
    });

    expect(result.contextWindowSize).toBe(65536);
    expect(result.source).toBe('llama-props');
  });

  it('reuses cache within TTL without calling fetch', async () => {
    const fetcher = makeFetcher({
      'GET http://srv/v1/models': VLLM_V1_MODELS,
    });
    const fetchSpy = vi.spyOn({ f: fetcher }, 'f');

    // We pass an in-memory mock for "cacheDir" by using a real temp dir.
    const os = await import('node:os');
    const path = await import('node:path');
    const fsp = await import('node:fs/promises');
    const cacheDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'probe-cache-'));

    try {
      const t0 = 1_700_000_000_000;
      const opts = {
        baseUrl: 'http://srv',
        modelId: 'meta-llama/Llama-3.3-70B-Instruct',
        fetcher,
        cacheDir,
        now: () => t0,
        cacheTtlMs: 5 * 60 * 1000,
      };

      const r1 = await probeEndpointCapabilities(opts);
      expect(r1.contextWindowSize).toBe(131072);
      expect(r1.source).toBe('v1-models');

      // Second call within TTL — should come from cache, no fetch.
      const r2 = await probeEndpointCapabilities({
        ...opts,
        fetcher: vi.fn(async () => {
          throw new Error('should not be called');
        }) as unknown as typeof fetch,
        now: () => t0 + 60_000, // 1 min later
      });
      expect(r2.contextWindowSize).toBe(131072);
      expect(r2.source).toBe('cache');
    } finally {
      await fsp.rm(cacheDir, { recursive: true, force: true });
    }
    fetchSpy.mockRestore();
  });

  it('re-probes after cache expires', async () => {
    const os = await import('node:os');
    const path = await import('node:path');
    const fsp = await import('node:fs/promises');
    const cacheDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'probe-cache-'));

    try {
      let callCount = 0;
      const fetcher = vi.fn(async () => {
        callCount++;
        return new Response(JSON.stringify(VLLM_V1_MODELS), { status: 200 });
      }) as unknown as typeof fetch;

      const t0 = 1_700_000_000_000;
      const r1 = await probeEndpointCapabilities({
        baseUrl: 'http://srv',
        modelId: 'meta-llama/Llama-3.3-70B-Instruct',
        fetcher,
        cacheDir,
        now: () => t0,
        cacheTtlMs: 5 * 60 * 1000,
      });
      expect(r1.contextWindowSize).toBe(131072);

      // 6 minutes later — cache expired
      const r2 = await probeEndpointCapabilities({
        baseUrl: 'http://srv',
        modelId: 'meta-llama/Llama-3.3-70B-Instruct',
        fetcher,
        cacheDir,
        now: () => t0 + 6 * 60 * 1000,
        cacheTtlMs: 5 * 60 * 1000,
      });
      expect(r2.contextWindowSize).toBe(131072);
      expect(r2.source).toBe('v1-models'); // re-probed, not cache
      expect(callCount).toBeGreaterThan(1);
    } finally {
      await fsp.rm(cacheDir, { recursive: true, force: true });
    }
  });
});
