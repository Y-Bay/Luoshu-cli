# AGENTS.md

Guidance for AI agents working on this codebase. Human contributors: see
[CONTRIBUTING.md](./CONTRIBUTING.md) for build, dev, and PR workflow.

## What this is

Hanhai CLI — a terminal AI coding assistant, fork of qwen-code / gemini-cli,
configured to pair with the 瀚海 language model.

Monorepo layout:

- `packages/core` — agent runtime (tool scheduling, chat, memory, compression)
- `packages/cli` — TUI + entrypoint (`hanhai`)
- `packages/channels` — Telegram/WeiXin/DingTalk channel adapters
- `packages/acp-bridge` — ACP (Agent Client Protocol) primitives
- `packages/webui` + `packages/web-templates` — `/insight` rendering
- `packages/vscode-ide-companion` — VS Code extension
- `packages/sdk-typescript` — external programmatic SDK

## Hard conventions you MUST follow

- TypeScript strict (`noImplicitAny`, `strictNullChecks`). ESLint rule
  `@typescript-eslint/no-explicit-any` is `error` — do not paper over types
  with `any`.
- ESM only (`"type": "module"`). No CJS in source.
- Prettier: single quotes, semicolons, trailing commas, 2-space indent.
- Tests collocated: `foo.ts` → `foo.test.ts`, vitest.
- Conventional Commits (`feat(scope):`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `i18n:`, `style:`). End commit messages with the
  `Co-Authored-By:` trailer when applicable.
- Node.js ≥ 22.

## Do not touch

- `packages/core/vendor/` — platform ripgrep + tree-sitter binaries (loaded
  by `ripgrepUtils.ts` at runtime).
- `packages/*/dist/`, root `dist/` — build / bundle output (gitignored).
- Copyright headers — Apache 2.0 requires preserving upstream attribution.

## After-edit validation (smallest scope first)

```bash
# Run only the touched test files
npx vitest run packages/<pkg>/src/path/to/file.test.ts

# Snapshot updates when a test prints fixtures or full prompts
npx vitest run <path> --update
```

If you changed a locale file (`packages/cli/src/i18n/locales/*.js`):

```bash
npm run check-i18n
```

If you changed `settingsSchema.ts`:

```bash
npm run generate:settings-schema   # commit any resulting schema diff
```

For cross-package changes before declaring done:

```bash
# Avoids TS5055 stale-incremental errors on clean rebuilds
find packages -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete
rm -rf packages/*/dist packages/channels/*/dist
npm run build && npm run bundle
```

## Lessons learned (load-bearing tribal knowledge)

- `npm link` in this repo needs `--ignore-scripts` — the `prepare` hook
  re-runs build and triggers TS5055 on existing `dist/` outputs. Use
  `npm link --ignore-scripts`.
- The pre-commit hook (lint-staged) only operates on **staged** files; CI
  Lint runs over the **whole repo** plus `actionlint` / `shellcheck` /
  `yamllint` / `check-i18n` / settings-schema diff. Running `npm run lint`
  locally is not equivalent to CI Lint.
- Locale check (`check-i18n`) is **strict on extras**: any key in `zh.js` /
  `zh-TW.js` not present in `en.js` fails CI. Add the English key in
  `en.js` first (English key as value is fine).
- `core` is loaded by `cli` as a workspace package — when the bundled `cli.js`
  doesn't show a change you expect, the change probably needs to land in
  `packages/core` and a full rebuild, not just an `esbuild` re-bundle.

## Project directories (agent-relevant)

`.hanhai/` is the runtime config dir for end users. Within this repo,
historical artifacts may live under `.hanhai/`:

| Dir                       | Purpose                          |
| ------------------------- | -------------------------------- |
| `.hanhai/design/`         | Design docs for planned features |
| `.hanhai/e2e-tests/`      | E2E test plans and results       |
| `.hanhai/investigations/` | Debugging journals               |
