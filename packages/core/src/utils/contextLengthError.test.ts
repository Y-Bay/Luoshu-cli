/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  getContextLengthExceededInfo,
  isContextLengthExceededError,
} from './contextLengthError.js';

describe('contextLengthError', () => {
  it.each([
    "This model's maximum context length is 128000 tokens. However, your messages resulted in 135000 tokens.",
    'context_length_exceeded',
    'prompt is too long: 137500 tokens > 135000 maximum',
    'Range of input length should be [1, 30000]',
    'Input token length is too long',
    'The input token count (127234) exceeds the maximum number of tokens allowed (100000).',
    '{"error":{"code":"context_length_exceeded","message":"too many tokens in prompt"}}',
    // llama.cpp / llama-server 风格（实测来自 -c 8192 启动的本地服务报错）
    'request (20073 tokens) exceeds the available context size (8192 tokens)',
    'exceeds available context size',
    'input exceeds maximum context size of 8192',
    'try increasing it, exceeds the context size',
  ])('matches context overflow: %s', (message) => {
    expect(isContextLengthExceededError(new Error(message))).toBe(true);
  });

  it.each([
    'rate limit exceeded',
    'Throttling: TPM(1/1)',
    'connection timeout',
    'finishReason: MAX_TOKENS',
    'max_tokens',
    'Request failed: maximum schema depth exceeded',
    'Request contains an invalid argument',
    'context deadline exceeded',
    'deadline exceeded',
    'Request timeout after 60s. Try reducing input length or increasing timeout in config.',
    'connection timed out while waiting for response',
    // 防误伤：含 "exceeds" + "size" 但语义不同
    'file size exceeds the upload limit',
    'maximum response size exceeded',
  ])('does not match unrelated errors: %s', (message) => {
    expect(isContextLengthExceededError(new Error(message))).toBe(false);
  });

  it('parses llama.cpp parenthesized token counts', () => {
    const info = getContextLengthExceededInfo(
      new Error(
        'request (20073 tokens) exceeds the available context size (8192 tokens)',
      ),
    );

    expect(info.isExceeded).toBe(true);
    expect(info.actualTokens).toBe(20073);
    expect(info.limitTokens).toBe(8192);
  });

  it('parses prompt-too-long actual and limit token counts', () => {
    const info = getContextLengthExceededInfo(
      new Error('prompt is too long: 137500 tokens > 135000 maximum'),
    );

    expect(info.isExceeded).toBe(true);
    expect(info.actualTokens).toBe(137500);
    expect(info.limitTokens).toBe(135000);
  });

  it('parses OpenAI-style maximum context length token counts', () => {
    const info = getContextLengthExceededInfo(
      new Error(
        "This model's maximum context length is 128000 tokens. However, your messages resulted in 135000 tokens.",
      ),
    );

    expect(info.isExceeded).toBe(true);
    expect(info.actualTokens).toBe(135000);
    expect(info.limitTokens).toBe(128000);
  });

  it('parses maximum context length limits without actual token counts', () => {
    const info = getContextLengthExceededInfo(
      new Error("This model's maximum context length is 128000 tokens."),
    );

    expect(info.isExceeded).toBe(true);
    expect(info.actualTokens).toBeUndefined();
    expect(info.limitTokens).toBe(128000);
  });

  it('extracts nested JSON error messages from strings', () => {
    const info = getContextLengthExceededInfo(
      new Error(
        'HTTP 400 {"error":{"code":"context_length_exceeded","message":"prompt is too long: 137500 tokens > 135000 maximum"}}',
      ),
    );

    expect(info.isExceeded).toBe(true);
    expect(info.actualTokens).toBe(137500);
    expect(info.limitTokens).toBe(135000);
  });

  it('extracts nested error object messages', () => {
    const info = getContextLengthExceededInfo({
      status: 400,
      error: {
        code: 'BadRequest',
        message: 'Input token length is too long',
      },
    });

    expect(info.isExceeded).toBe(true);
    expect(info.message).toContain('Input token length is too long');
  });

  it('does not match object keys as context overflow text', () => {
    const info = getContextLengthExceededInfo({
      context: 'request body',
      detail: 'tokens are available',
      status: 'exceeded',
    });

    expect(info.isExceeded).toBe(false);
    expect(info.message).not.toContain('context');
    expect(info.message).toContain('tokens are available');
  });

  it('does not match broad token wording across separate fragments', () => {
    const info = getContextLengthExceededInfo({
      message: 'context window check',
      detail: 'tokens exceeded by policy wording',
    });

    expect(info.isExceeded).toBe(false);
  });
});
