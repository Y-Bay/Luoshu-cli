/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import * as os from 'node:os';
import path from 'node:path';
import { canUseRipgrep } from '@qwen-code/qwen-code-core';
import { t } from '../i18n/index.js';

type WarningCheckOptions = {
  workspaceRoot: string;
  useRipgrep: boolean;
  useBuiltinRipgrep: boolean;
};

type WarningCheck = {
  id: string;
  check: (options: WarningCheckOptions) => Promise<string | null>;
};

// Individual warning checks
const homeDirectoryCheck: WarningCheck = {
  id: 'home-directory',
  check: async (options: WarningCheckOptions) => {
    try {
      const [workspaceRealPath, homeRealPath] = await Promise.all([
        fs.realpath(options.workspaceRoot),
        fs.realpath(os.homedir()),
      ]);

      if (workspaceRealPath === homeRealPath) {
        return t(
          'You are running Hanhai CLI in your home directory. It is recommended to run in a project-specific directory.',
        );
      }
      return null;
    } catch (_err: unknown) {
      return t(
        'Could not verify the current directory due to a file system error.',
      );
    }
  },
};

const rootDirectoryCheck: WarningCheck = {
  id: 'root-directory',
  check: async (options: WarningCheckOptions) => {
    try {
      const workspaceRealPath = await fs.realpath(options.workspaceRoot);
      const errorMessage = t(
        'Warning: You are running Hanhai CLI in the root directory. Your entire folder structure will be used for context. It is strongly recommended to run in a project-specific directory.',
      );

      // Check for Unix root directory
      if (path.dirname(workspaceRealPath) === workspaceRealPath) {
        return errorMessage;
      }

      return null;
    } catch (_err: unknown) {
      return t(
        'Could not verify the current directory due to a file system error.',
      );
    }
  },
};

const ripgrepAvailabilityCheck: WarningCheck = {
  id: 'ripgrep-availability',
  check: async (options: WarningCheckOptions) => {
    if (!options.useRipgrep) {
      return null;
    }

    try {
      const isAvailable = await canUseRipgrep(options.useBuiltinRipgrep);
      if (!isAvailable) {
        return t(
          'Ripgrep not available: Please install ripgrep globally to enable faster file content search. Falling back to built-in grep.',
        );
      }
      return null;
    } catch (error) {
      return t(
        'Ripgrep not available: {{error}}. Falling back to built-in grep.',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );
    }
  },
};

// All warning checks
const WARNING_CHECKS: readonly WarningCheck[] = [
  homeDirectoryCheck,
  rootDirectoryCheck,
  ripgrepAvailabilityCheck,
];

export async function getUserStartupWarnings(
  options: WarningCheckOptions,
): Promise<string[]> {
  const results = await Promise.all(
    WARNING_CHECKS.map((check) => check.check(options)),
  );
  return results.filter((msg) => msg !== null);
}
