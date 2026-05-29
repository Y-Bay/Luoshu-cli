# Hanhai CLI

```
██╗  ██╗ █████╗ ███╗   ██╗██╗  ██╗ █████╗ ██╗
██║  ██║██╔══██╗████╗  ██║██║  ██║██╔══██╗██║
███████║███████║██╔██╗ ██║███████║███████║██║
██╔══██║██╔══██║██║╚██╗██║██╔══██║██╔══██║██║
██║  ██║██║  ██║██║ ╚████║██║  ██║██║  ██║██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
```

> **瀚海 (HANHAI)** — 知识如瀚海，闻而行之。配套瀚海大语言模型的终端 AI 编程助手。

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

## 定位

Hanhai CLI 是配套 **瀚海** 大语言模型的官方终端客户端。它不打算成为「又一个通用 AI 编程助手」——我们在四件事上下注：

- **自有模型 / 私有部署优先**。默认 OpenAI 兼容协议，自托管 `llama-server` / `vLLM` / `Ollama` / 内网 endpoint 是一等场景，全程可不依赖任何商业供应商账号。
- **中文体验一等公民**。TUI 文案、启动警告、loading 提示、bundled skill 描述均覆盖简中/繁中；不靠英文回退凑数。把中文当默认母语，不是「附带翻译」。
- **统一身份层**。内置 agent 身份机制，让模型始终以「瀚海智能编程助手」对外呈现，自然融入产品/企业的自有形象；同时不污染上游模型的真实能力。
- **协议开放**。TUI、ACP（stdio JSON-RPC）、HTTP daemon、IDE Companion 四个接入面同时存在，方便嵌入 GUI、IDE、自动化系统——agent 不必只活在终端里。

### 为什么基于 qwen-code / gemini-cli 改造

Agent runtime 的工具调度、流式渲染、上下文管理、approval 模型、worktree 隔离等底盘已经被多个团队打磨过一年多。我们选择**站在成熟工程之上做定向改造**，把团队精力投入到：瀚海模型的深度适配、中文交互打磨、协议层稳定化、领域定制空间——而不是重发明轮子。继承关系与具体修改详见 [HANHAI_NOTICE.md](./HANHAI_NOTICE.md)。

## 特性

- TUI 交互界面 + 数十个内置工具：文件读写、shell、git、code review、insight、subagent 等
- 多 provider 适配：OpenAI / Anthropic / DeepSeek / OpenRouter / Z.AI / ModelScope / 本地 llama-server 等任意 OpenAI 兼容 endpoint
- 项目级 `HANHAI.md` 作为 system prompt（类似 `CLAUDE.md` / `GEMINI.md`）
- 协议开放：ACP (Agent Client Protocol) + HTTP daemon，方便 GUI、IDE 扩展接入

## 安装

一键安装：

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Y-Bay/Hanhai-cli/main/install.sh)"
```

脚本会检查环境、拉代码到 `~/Hanhai-cli`、安装依赖、`npm link` 注册全局 `hanhai` 命令。可用 `HANHAI_INSTALL_DIR=/path` 自定义路径。

手动安装：

```bash
git clone https://github.com/Y-Bay/Hanhai-cli.git
cd Hanhai-cli
npm install
npm run bundle
npm link
```

需要 Node.js ≥ 22.0.0。装 Node 推荐 nvm：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.nvm/nvm.sh && nvm install 22
```

## 使用

```bash
hanhai                  # 启动交互式 TUI
hanhai "改一下这个 bug"  # 一次性 prompt（非交互）
hanhai --acp            # ACP 协议模式（stdio JSON-RPC）
hanhai serve            # HTTP daemon
hanhai --help           # 完整命令与参数
```

首次启动会让你选 provider 并填 API key。选 Custom Provider 可以接入任意 OpenAI 兼容服务（包括本地跑的 llama-server）。

## 配置

用户级配置在 `~/.hanhai/`，项目级配置在 `<project>/.hanhai/`，项目 system prompt 写在 `<project>/HANHAI.md`。环境变量与全部 CLI 参数见 `hanhai --help`。

## 协议接入

Hanhai CLI 同时是一个 agent runtime，可被 GUI 客户端、IDE 扩展、自动化脚本接入：

- **ACP**（Agent Client Protocol）— `hanhai --acp`，stdio JSON-RPC，已实现于 `packages/cli/src/acp-integration/`
- **HTTP Daemon**（实验性）— `hanhai serve --port 4170`，REST + SSE；loopback 免鉴权，非 loopback 需 `--token`
- **IDE Companion** — VSCode 扩展位于 `packages/vscode-ide-companion/`

## 规划

> 节奏跟着实际反馈调，欢迎在 Issues 区提需求。下面列出的是当前在路上的方向，不是已完成的特性。

**近期 · 瀚海模型深度适配**

- 针对瀚海模型的 system prompt 调优，识别并正确处理 reasoning (`<think>`) 输出与 tool-calling 协议差异
- Model capability registry：自动探测本地/私有端点的 context 上限、能力（vision / tools / reasoning）、最大输出长度，避免请求超长被截
- Long-context 利用率优化：减少初始系统提示 + 工具定义在小 context 端点上的占用

**中期 · 生态补齐**

- 瀚海 Docs 站建立（恢复 `/docs` 入口）
- `hanhai-code-action` GitHub Action 仓库（恢复 `/setup-github` 入口，提供瀚海品牌的 PR review / dispatch / issue triage workflows）
- IDE Companion 从 VSCode 扩展到 JetBrains，HTTP daemon 稳定化作为统一接入点

**长期 · 开放与领域化**

- 协议层（ACP / HTTP daemon）固化为下游 GUI、企业自动化、第三方客户端接入瀚海能力的标准入口
- 行业定制 Skill 与默认 prompt 模板（需求驱动）
- 与上游 qwen-code / gemini-cli 建立固定的同步节奏，使基础设施的 fix / 优化能持续回流，不让 fork 变成债务

---

基于 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 改造，遵循 Apache License 2.0。继承关系与改动说明见 [HANHAI_NOTICE.md](./HANHAI_NOTICE.md)。
