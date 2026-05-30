/**
 * @license
 * Copyright 2026 Hanhai Team.
 * SPDX-License-Identifier: Apache-2.0
 */

// Pure decision function: given the user's explicit `contextWindowSize` and
// `contextWindowSizeForce` flag from settings, and the (possibly empty) probe
// result from `endpointCapabilityProbe`, decide the final value and whether
// to surface a startup warning to the user.
//
// Kept I/O-free so it can be unit-tested cheaply and so the integration glue
// in config.ts can compose it with probing however it likes.

import type { ProbeSource } from './endpointCapabilityProbe.js';

export interface ApplyContextWindowInput {
  /** Explicit `generationConfig.contextWindowSize` from settings (or undefined). */
  explicitValue?: number;
  /** Explicit `generationConfig.contextWindowSizeForce` from settings. */
  force?: boolean;
  /** Result from `probeEndpointCapabilities` (or undefined if probing was skipped). */
  probed?: {
    contextWindowSize?: number;
    source: ProbeSource | null;
    endpoint?: string;
  };
}

export interface ApplyContextWindowOutput {
  /** Final value to assign — undefined means "fall through to known table / default". */
  value?: number;
  /** User-facing warning to surface via the startup-warnings channel. */
  warning?: string;
}

export function applyContextWindowProbe(
  input: ApplyContextWindowInput,
): ApplyContextWindowOutput {
  // 1. Force opt-out: user explicitly said "trust my setting, don't probe".
  if (input.force) {
    return { value: input.explicitValue };
  }

  // 2. No probe data — explicit (or undefined) passes through unchanged.
  //    Done as one combined check so TS narrows `input.probed` to non-null
  //    in subsequent branches.
  if (!input.probed || input.probed.contextWindowSize === undefined) {
    return { value: input.explicitValue };
  }
  const probedValue = input.probed.contextWindowSize;

  // 3. Probe succeeded, user gave no explicit value → silent adoption.
  if (input.explicitValue === undefined) {
    return { value: probedValue };
  }

  // 4. Probe and explicit agree → silent.
  if (probedValue === input.explicitValue) {
    return { value: probedValue };
  }

  // 5. Probe and explicit disagree → probe wins, emit warning.
  const source = input.probed.source;
  const endpointSuffix = input.probed.endpoint
    ? ` (${input.probed.endpoint})`
    : '';
  return {
    value: probedValue,
    warning:
      `Context window mismatch: settings.json has \`contextWindowSize: ${input.explicitValue}\`, ` +
      `but the server reports ${probedValue} via ${source}${endpointSuffix}. ` +
      `Using ${probedValue} to avoid wasting capacity. ` +
      'Set `generationConfig.contextWindowSizeForce: true` if you want your settings value to win.',
  };
}
