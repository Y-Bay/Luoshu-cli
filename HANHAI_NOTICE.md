# Luoshu CLI — Attribution & License Notice

This project (**Luoshu CLI**) is a derivative work based on:

- **qwen-code** — https://github.com/QwenLM/qwen-code (Apache License 2.0)
  - which in turn is a derivative of:
- **gemini-cli** — https://github.com/google-gemini/gemini-cli (Apache License 2.0)

Luoshu CLI is distributed under the same Apache License 2.0 — see [`LICENSE`](./LICENSE).

## Modifications

Per Apache 2.0 §4(b) (notice of changes), modifications introduced by the Luoshu Team
include (non-exhaustive, will be expanded as the project evolves):

- Renamed the CLI binary from `qwen` to `luoshu`.
- Replaced the QWEN ASCII startup banner with a LUOSHU block-letter banner
  (`packages/cli/src/ui/components/AsciiArt.ts`).
- Replaced the default ">_ Qwen Code" header title with ">_ LUOSHU"
  (`packages/cli/src/ui/components/Header.tsx`).
- Renamed the root npm package to `luoshu-cli` and the CLI workspace package
  to `@luoshu/cli`.

Files that have been modified carry a `Modifications copyright 2026 Luoshu Team` notice
in their license header in addition to the upstream Google/Qwen copyright.

## Trademarks

This notice does not grant rights to use the names, logos, or trademarks of Google,
Qwen, or Alibaba Cloud. References to "Qwen" or "Gemini" in source code or
documentation exist solely to describe the origin and lineage of this work, as
permitted by Apache 2.0 §4(d).
