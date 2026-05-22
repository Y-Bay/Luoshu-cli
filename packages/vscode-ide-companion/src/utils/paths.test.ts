/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import {
  getGlobalQwenDir,
  getRuntimeBaseDir,
  resetEnvBootstrapForTesting,
} from './paths.js';

/**
 * Each test gets a clean temp homedir (no `.env` files), so the lazy
 * `bootstrapHomeEnvOverrides()` becomes a no-op unless the test explicitly
 * writes `.env` content into the mocked home. ESM bans spying on `os.homedir`,
 * so we redirect via the underlying `HOME` / `USERPROFILE` env vars.
 */
function withCleanHome() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qwen-paths-test-'));
  const realHome = fs.realpathSync(tempHome);
  const originalHomeEnv = process.env['HOME'];
  const originalUserProfile = process.env['USERPROFILE'];
  process.env['HOME'] = realHome;
  process.env['USERPROFILE'] = realHome;
  return {
    tempHome: realHome,
    cleanup: () => {
      if (originalHomeEnv !== undefined) {
        process.env['HOME'] = originalHomeEnv;
      } else {
        delete process.env['HOME'];
      }
      if (originalUserProfile !== undefined) {
        process.env['USERPROFILE'] = originalUserProfile;
      } else {
        delete process.env['USERPROFILE'];
      }
      fs.rmSync(realHome, { recursive: true, force: true });
    },
  };
}

describe('vscode-ide-companion paths – getGlobalQwenDir', () => {
  const originalEnv = process.env['LUOSHU_HOME'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
  });

  afterEach(() => {
    home.cleanup();
    if (originalEnv !== undefined) {
      process.env['LUOSHU_HOME'] = originalEnv;
    } else {
      delete process.env['LUOSHU_HOME'];
    }
  });

  it('defaults to ~/.qwen when LUOSHU_HOME is not set', () => {
    delete process.env['LUOSHU_HOME'];
    expect(getGlobalQwenDir()).toBe(path.join(home.tempHome, '.luoshu'));
  });

  it('uses LUOSHU_HOME when set to absolute path', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['LUOSHU_HOME'] = configDir;
    expect(getGlobalQwenDir()).toBe(configDir);
  });

  it('resolves relative LUOSHU_HOME against process.cwd', () => {
    process.env['LUOSHU_HOME'] = 'relative/config';
    expect(getGlobalQwenDir()).toBe(path.resolve('relative/config'));
  });

  it('expands tilde (~/x) in LUOSHU_HOME', () => {
    process.env['LUOSHU_HOME'] = '~/custom-qwen';
    expect(getGlobalQwenDir()).toBe(path.join(home.tempHome, 'custom-qwen'));
  });

  it('expands Windows-style tilde (~\\x) in LUOSHU_HOME', () => {
    process.env['LUOSHU_HOME'] = '~\\custom-qwen';
    expect(getGlobalQwenDir()).toBe(path.join(home.tempHome, 'custom-qwen'));
  });

  it('treats bare tilde (~) as home directory', () => {
    process.env['LUOSHU_HOME'] = '~';
    expect(getGlobalQwenDir()).toBe(home.tempHome);
  });
});

describe('vscode-ide-companion paths – getRuntimeBaseDir', () => {
  const originalHome = process.env['LUOSHU_HOME'];
  const originalRuntime = process.env['LUOSHU_RUNTIME_DIR'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
  });

  afterEach(() => {
    home.cleanup();
    if (originalHome !== undefined) {
      process.env['LUOSHU_HOME'] = originalHome;
    } else {
      delete process.env['LUOSHU_HOME'];
    }
    if (originalRuntime !== undefined) {
      process.env['LUOSHU_RUNTIME_DIR'] = originalRuntime;
    } else {
      delete process.env['LUOSHU_RUNTIME_DIR'];
    }
  });

  it('falls back to getGlobalQwenDir() when neither env var is set', () => {
    delete process.env['LUOSHU_HOME'];
    delete process.env['LUOSHU_RUNTIME_DIR'];
    expect(getRuntimeBaseDir()).toBe(getGlobalQwenDir());
  });

  it('uses LUOSHU_RUNTIME_DIR when set to absolute path', () => {
    delete process.env['LUOSHU_HOME'];
    const runtimeDir = path.resolve('/tmp/custom-runtime');
    process.env['LUOSHU_RUNTIME_DIR'] = runtimeDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });

  it('resolves relative LUOSHU_RUNTIME_DIR against process.cwd', () => {
    delete process.env['LUOSHU_HOME'];
    process.env['LUOSHU_RUNTIME_DIR'] = 'relative/runtime';
    expect(getRuntimeBaseDir()).toBe(path.resolve('relative/runtime'));
  });

  it('expands tilde (~/x) in LUOSHU_RUNTIME_DIR', () => {
    delete process.env['LUOSHU_HOME'];
    process.env['LUOSHU_RUNTIME_DIR'] = '~/custom-runtime';
    expect(getRuntimeBaseDir()).toBe(
      path.join(home.tempHome, 'custom-runtime'),
    );
  });

  it('falls back to LUOSHU_HOME when LUOSHU_RUNTIME_DIR is unset', () => {
    delete process.env['LUOSHU_RUNTIME_DIR'];
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['LUOSHU_HOME'] = configDir;
    expect(getRuntimeBaseDir()).toBe(configDir);
  });

  it('LUOSHU_RUNTIME_DIR takes priority over LUOSHU_HOME', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    const runtimeDir = path.resolve('/tmp/custom-runtime');
    process.env['LUOSHU_HOME'] = configDir;
    process.env['LUOSHU_RUNTIME_DIR'] = runtimeDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });
});

describe('vscode-ide-companion paths – .env bootstrap', () => {
  const originalHome = process.env['LUOSHU_HOME'];
  const originalRuntime = process.env['LUOSHU_RUNTIME_DIR'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
    delete process.env['LUOSHU_HOME'];
    delete process.env['LUOSHU_RUNTIME_DIR'];
  });

  afterEach(() => {
    home.cleanup();
    if (originalHome !== undefined) {
      process.env['LUOSHU_HOME'] = originalHome;
    } else {
      delete process.env['LUOSHU_HOME'];
    }
    if (originalRuntime !== undefined) {
      process.env['LUOSHU_RUNTIME_DIR'] = originalRuntime;
    } else {
      delete process.env['LUOSHU_RUNTIME_DIR'];
    }
  });

  it('reads LUOSHU_HOME from <homedir>/.luoshu/.env', () => {
    const configDir = path.resolve('/tmp/from-qwen-dotenv');
    fs.mkdirSync(path.join(home.tempHome, '.luoshu'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.luoshu', '.env'),
      `LUOSHU_HOME=${configDir}\n`,
    );
    expect(getGlobalQwenDir()).toBe(configDir);
    expect(process.env['LUOSHU_HOME']).toBe(configDir);
  });

  it('reads LUOSHU_HOME from <homedir>/.env when ~/.luoshu/.env is absent', () => {
    const configDir = path.resolve('/tmp/from-home-dotenv');
    fs.writeFileSync(
      path.join(home.tempHome, '.env'),
      `LUOSHU_HOME=${configDir}\n`,
    );
    expect(getGlobalQwenDir()).toBe(configDir);
    expect(process.env['LUOSHU_HOME']).toBe(configDir);
  });

  it('process env wins over .env file', () => {
    const envDir = path.resolve('/tmp/from-process-env');
    const dotenvDir = path.resolve('/tmp/from-dotenv');
    process.env['LUOSHU_HOME'] = envDir;
    fs.mkdirSync(path.join(home.tempHome, '.luoshu'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.luoshu', '.env'),
      `LUOSHU_HOME=${dotenvDir}\n`,
    );
    expect(getGlobalQwenDir()).toBe(envDir);
  });

  it('reads LUOSHU_RUNTIME_DIR from <LUOSHU_HOME>/.env when LUOSHU_HOME is preset', () => {
    const configDir = path.join(home.tempHome, 'custom-qwen');
    const runtimeDir = path.resolve('/tmp/from-runtime-dotenv');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, '.env'),
      `LUOSHU_RUNTIME_DIR=${runtimeDir}\n`,
    );
    process.env['LUOSHU_HOME'] = configDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });

  it('does not read <homedir>/.env when LUOSHU_HOME is preset', () => {
    const configDir = path.resolve('/tmp/preset-qwen-home');
    process.env['LUOSHU_HOME'] = configDir;
    fs.writeFileSync(
      path.join(home.tempHome, '.env'),
      `LUOSHU_RUNTIME_DIR=/tmp/should-be-ignored\n`,
    );
    expect(getRuntimeBaseDir()).toBe(configDir);
    expect(process.env['LUOSHU_RUNTIME_DIR']).toBeUndefined();
  });

  it('reads LUOSHU_RUNTIME_DIR from <new LUOSHU_HOME>/.env after discovery via ~/.luoshu/.env', () => {
    const configDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'qwen-bootstrap-cfg-')),
    );
    const runtimeDir = path.resolve('/tmp/from-discovered-runtime');
    fs.mkdirSync(path.join(home.tempHome, '.luoshu'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.luoshu', '.env'),
      `LUOSHU_HOME=${configDir}\n`,
    );
    fs.writeFileSync(
      path.join(configDir, '.env'),
      `LUOSHU_RUNTIME_DIR=${runtimeDir}\n`,
    );
    try {
      expect(getRuntimeBaseDir()).toBe(runtimeDir);
      expect(process.env['LUOSHU_HOME']).toBe(configDir);
      expect(process.env['LUOSHU_RUNTIME_DIR']).toBe(runtimeDir);
    } finally {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });
});
