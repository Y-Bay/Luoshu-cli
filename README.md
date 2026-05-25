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

---

基于 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 改造，遵循 Apache License 2.0。继承关系与改动说明见 [HANHAI_NOTICE.md](./HANHAI_NOTICE.md)。
