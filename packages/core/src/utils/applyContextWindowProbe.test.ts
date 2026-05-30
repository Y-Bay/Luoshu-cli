/**
 * @license
 * Copyright 2026 Hanhai Team.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { applyContextWindowProbe } from './applyContextWindowProbe.js';

describe('applyContextWindowProbe', () => {
  it('force=true returns the user value unchanged, no warning, no probe used', () => {
    const out = applyContextWindowProbe({
      explicitValue: 32768,
      force: true,
      probed: {
        contextWindowSize: 131072,
        source: 'llama-props',
        endpoint: 'http://srv/props',
      },
    });
    expect(out.value).toBe(32768);
    expect(out.warning).toBeUndefined();
  });

  it('force=true with no explicit value returns undefined (passes through)', () => {
    const out = applyContextWindowProbe({
      force: true,
      probed: { contextWindowSize: 131072, source: 'llama-props' },
    });
    expect(out.value).toBeUndefined();
    expect(out.warning).toBeUndefined();
  });

  it('no probe (source=null) returns explicit value unchanged', () => {
    const out = applyContextWindowProbe({
      explicitValue: 32768,
      probed: { source: null },
    });
    expect(out.value).toBe(32768);
    expect(out.warning).toBeUndefined();
  });

  it('no probe + no explicit returns undefined (fall through)', () => {
    const out = applyContextWindowProbe({});
    expect(out.value).toBeUndefined();
    expect(out.warning).toBeUndefined();
  });

  it('probe succeeds + no explicit returns probed value silently', () => {
    const out = applyContextWindowProbe({
      probed: {
        contextWindowSize: 131072,
        source: 'llama-props',
        endpoint: 'http://srv/props',
      },
    });
    expect(out.value).toBe(131072);
    expect(out.warning).toBeUndefined();
  });

  it('probe agrees with explicit value: silent, no warning', () => {
    const out = applyContextWindowProbe({
      explicitValue: 131072,
      probed: { contextWindowSize: 131072, source: 'llama-props' },
    });
    expect(out.value).toBe(131072);
    expect(out.warning).toBeUndefined();
  });

  it('probe disagrees with explicit: probe wins, emit warning with both values', () => {
    const out = applyContextWindowProbe({
      explicitValue: 32768,
      probed: {
        contextWindowSize: 131072,
        source: 'llama-props',
        endpoint: 'http://srv/props',
      },
    });
    expect(out.value).toBe(131072);
    expect(out.warning).toBeDefined();
    expect(out.warning).toContain('131072');
    expect(out.warning).toContain('32768');
    expect(out.warning).toContain('llama-props');
    // Should mention the escape hatch
    expect(out.warning).toContain('contextWindowSizeForce');
  });
});
