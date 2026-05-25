import { describe, it, expect, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { getGlobalQwenDir, resolvePath } from './paths.js';

describe('channels/base paths – getGlobalQwenDir', () => {
  const originalEnv = process.env['HANHAI_HOME'];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['HANHAI_HOME'] = originalEnv;
    } else {
      delete process.env['HANHAI_HOME'];
    }
  });

  it('defaults to ~/.qwen when HANHAI_HOME is not set', () => {
    delete process.env['HANHAI_HOME'];
    expect(getGlobalQwenDir()).toBe(path.join(os.homedir(), '.hanhai'));
  });

  it('uses HANHAI_HOME when set to absolute path', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['HANHAI_HOME'] = configDir;
    expect(getGlobalQwenDir()).toBe(configDir);
  });

  it('resolves relative HANHAI_HOME against process.cwd', () => {
    process.env['HANHAI_HOME'] = 'relative/config';
    expect(getGlobalQwenDir()).toBe(path.resolve('relative/config'));
  });

  it('expands tilde (~/x) in HANHAI_HOME', () => {
    process.env['HANHAI_HOME'] = '~/custom-qwen';
    expect(getGlobalQwenDir()).toBe(path.join(os.homedir(), 'custom-qwen'));
  });

  it('expands Windows-style tilde (~\\x) in HANHAI_HOME', () => {
    process.env['HANHAI_HOME'] = '~\\custom-qwen';
    expect(getGlobalQwenDir()).toBe(path.join(os.homedir(), 'custom-qwen'));
  });

  it('treats bare tilde (~) as home directory', () => {
    process.env['HANHAI_HOME'] = '~';
    expect(getGlobalQwenDir()).toBe(os.homedir());
  });
});

describe('channels/base paths – resolvePath', () => {
  it('returns absolute paths unchanged', () => {
    const abs = path.resolve('/tmp/x');
    expect(resolvePath(abs)).toBe(abs);
  });

  it('expands bare tilde (~) to home directory', () => {
    expect(resolvePath('~')).toBe(os.homedir());
  });

  it('expands POSIX-style tilde (~/x)', () => {
    expect(resolvePath('~/xomo')).toBe(path.join(os.homedir(), 'xomo'));
  });

  it('expands Windows-style tilde (~\\x)', () => {
    expect(resolvePath('~\\xomo')).toBe(path.join(os.homedir(), 'xomo'));
  });

  it('resolves relative paths against process.cwd', () => {
    expect(resolvePath('relative/dir')).toBe(path.resolve('relative/dir'));
  });
});
