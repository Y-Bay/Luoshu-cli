/**
 * @license
 * Copyright 2026 Hanhai Team.
 * SPDX-License-Identifier: Apache-2.0
 */

// `hanhai update`: self-update a source (git clone + npm link) installation.
//   git pull --ff-only origin main  →  npm install  →  npm run bundle
//
// Hanhai CLI is distributed from GitHub source rather than the npm registry,
// so the in-app update-notifier can't see new versions and `npm i -g` does not
// apply. This command performs the same steps install.sh does on re-run. For
// installs with no git checkout it prints how to update manually instead.

import type { CommandModule } from 'yargs';
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../utils/stdioHelpers.js';

const INSTALL_HINT =
  '  bash -c "$(curl -fsSL https://raw.githubusercontent.com/Y-Bay/Hanhai-cli/main/install.sh)"';

/** Walk up from the running binary to the Hanhai CLI git checkout root. */
function findInstallRoot(): string | null {
  let dir: string;
  try {
    dir = dirname(realpathSync(process.argv[1] ?? ''));
  } catch {
    dir = process.cwd();
  }
  for (let i = 0; i < 6; i++) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(join(dir, '.git')) && existsSync(pkgPath)) {
      try {
        const { name } = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
          name?: string;
        };
        if (name === 'hanhai-cli') return dir;
      } catch {
        // Unreadable package.json — keep walking up.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readVersion(root: string): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    ) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function runUpdate(): number {
  const root = findInstallRoot();
  if (!root) {
    writeStderrLine(
      'Could not locate a Hanhai CLI git checkout to update.\n' +
        'This command only updates source installs (git clone + npm link).\n' +
        'To (re)install or update, run:\n' +
        INSTALL_HINT,
    );
    return 1;
  }

  const before = readVersion(root);
  writeStdoutLine(`Updating Hanhai CLI at ${root} (current v${before})`);

  try {
    writeStdoutLine('\n[1/3] git pull --ff-only origin main');
    execFileSync('git', ['-C', root, 'pull', '--ff-only', 'origin', 'main'], {
      stdio: 'inherit',
    });
  } catch {
    writeStderrLine(
      `\ngit pull failed. If your checkout has diverged from main, resolve it ` +
        `manually (git -C ${root} status) and retry, or re-run the installer:\n` +
        INSTALL_HINT,
    );
    return 1;
  }

  try {
    writeStdoutLine('\n[2/3] npm install');
    execSync('npm install --no-audit --no-fund --progress=false', {
      cwd: root,
      stdio: 'inherit',
    });
  } catch {
    writeStderrLine('\nnpm install failed. See the output above.');
    return 1;
  }

  try {
    writeStdoutLine('\n[3/3] npm run bundle');
    execSync('npm run bundle', { cwd: root, stdio: 'inherit' });
  } catch {
    writeStderrLine('\nnpm run bundle failed. See the output above.');
    return 1;
  }

  const after = readVersion(root);
  writeStdoutLine(
    `\n✓ Hanhai CLI updated (v${before} → v${after}). ` +
      'Restart hanhai to use the new version.',
  );
  return 0;
}

export const updateCommand: CommandModule = {
  command: 'update',
  describe: 'Update Hanhai CLI to the latest version (git pull + rebuild)',
  builder: (yargs) => yargs.version(false),
  handler: () => {
    process.exit(runUpdate());
  },
};
