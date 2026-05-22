/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modifications copyright 2026 Luoshu Team.
 * Modified: default context filename QWEN.md → LUOSHU.md; memory header brand renamed.
 */

export const DEFAULT_CONTEXT_FILENAME = 'LUOSHU.md';
export const AGENT_CONTEXT_FILENAME = 'AGENTS.md';
export const MEMORY_SECTION_HEADER = '## Luoshu Added Memories';

// Defaults to LUOSHU.md and AGENTS.md but can be overridden via setGeminiMdFilename.
// LUOSHU.md is first to keep the /init command's generated file consistent with branding.
let currentGeminiMdFilename: string | string[] = [
  DEFAULT_CONTEXT_FILENAME,
  AGENT_CONTEXT_FILENAME,
];

export function setGeminiMdFilename(newFilename: string | string[]): void {
  if (Array.isArray(newFilename)) {
    if (newFilename.length > 0) {
      currentGeminiMdFilename = newFilename.map((name) => name.trim());
    }
  } else if (newFilename && newFilename.trim() !== '') {
    currentGeminiMdFilename = newFilename.trim();
  }
}

export function getCurrentGeminiMdFilename(): string {
  if (Array.isArray(currentGeminiMdFilename)) {
    return currentGeminiMdFilename[0];
  }
  return currentGeminiMdFilename;
}

export function getAllGeminiMdFilenames(): string[] {
  if (Array.isArray(currentGeminiMdFilename)) {
    return currentGeminiMdFilename;
  }
  return [currentGeminiMdFilename];
}
