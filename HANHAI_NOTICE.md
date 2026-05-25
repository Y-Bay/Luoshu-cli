# Hanhai CLI — Attribution & License Notice

This project (**Hanhai CLI**) is a derivative work based on:

- **qwen-code** — https://github.com/QwenLM/qwen-code (Apache License 2.0)
  - which in turn is a derivative of:
- **gemini-cli** — https://github.com/google-gemini/gemini-cli (Apache License 2.0)

Hanhai CLI is distributed under the same Apache License 2.0 — see [`LICENSE`](./LICENSE).

## Modifications

Per Apache 2.0 §4(b) (notice of changes), modifications introduced by the Hanhai Team
include (non-exhaustive, will be expanded as the project evolves):

- Renamed the CLI binary from `qwen` to `hanhai`.
- Replaced the QWEN ASCII startup banner with a HANHAI block-letter banner
  (`packages/cli/src/ui/components/AsciiArt.ts`).
- Replaced the default ">_ Qwen Code" header title with ">_ HANHAI"
  (`packages/cli/src/ui/components/Header.tsx`).
- Renamed the root npm package to `hanhai-cli` and the CLI workspace package
  to `@hanhai/cli`.

Files that have been modified carry a `Modifications copyright 2026 Hanhai Team` notice
in their license header in addition to the upstream Google/Qwen copyright.

## Trademarks

This notice does not grant rights to use the names, logos, or trademarks of Google,
Qwen, or Alibaba Cloud. References to "Qwen" or "Gemini" in source code or
documentation exist solely to describe the origin and lineage of this work, as
permitted by Apache 2.0 §4(d).
