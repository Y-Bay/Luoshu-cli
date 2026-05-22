# Luoshu CLI

```
       ░░      ▓█▓░                        ▓▓▓▓   ░▒▒▒
       ▒██▓   ▒█████▒                      ▓▓██  ▒▒▓██▓
     ░░▓███▒▒▓██▓▓██▒                      █▓██▓▓░   ░
    ▓░   ▒▒▓███▒▒█▓░                    ░▓███████▓
    █▓▒  ░░░░▒▓███▓▒                  ░▓███▓▓██▓░
    ░▓█▓░    ▒█▓▒▒▓██▓▒░                   ▒▓██▒▒▒▒░
      ▓█░▒░▒█▓▒ ░▒▓▓▓█████▓▒            ░▓█████▓▒▒▒██▒
     ▒▒░▒█▓▒█▓▓███▓██▒▒▒▒▒▒▒░         ▒▓██▓▒▓█▓   ▒██▒
     ▒▒▓█░  ▓█▓░░░▓██░                ▓█▒░  ▒█▓▒▓██▓▒
     ▒██▒   ▒██▓▓███░                       ▓█▓▒▓▒░
      ▓█     ▒▓▒▒▒▒▒░                       ▓█▓
                                            ░▓▒
```

> **洛书 (LUOSHU) CLI** — 一款配套**洛书**大语言模型的终端 AI 智能体客户端。
> 基于 [QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) 改造而来，
> 后者基于 [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)。
> 三者皆遵循 Apache License 2.0。

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![Based on](https://img.shields.io/badge/based%20on-qwen--code%20%2F%20gemini--cli-orange.svg)](./LUOSHU_NOTICE.md)

---

## ✨ 特性

- **行楷书法 banner** —— "洛书" 二字以 macOS 系统行楷字体栅格化为块字符，搭配薄荷绿 → 莫兰迪深蓝的辐射状渐变（左上角辐射），符合中式审美
- **TUI 交互界面** —— 基于 Ink/React 的终端 UI，支持丰富的 slash 命令、文件操作、工具调用
- **多 Provider 支持** —— OpenAI / Anthropic / OpenRouter / DeepSeek / MiniMax / Z.AI / ModelScope 等 OpenAI 兼容 API；也支持自定义 endpoint
- **项目上下文** —— `LUOSHU.md` 文件作为项目级 system prompt（类似 `CLAUDE.md` / `GEMINI.md`）
- **工具生态** —— 内置 read/write file、shell、git、code review、insight、subagent 等几十个工具
- **协议开放** —— 提供 ACP (Agent Client Protocol) 和 HTTP daemon 接口，方便 GUI 客户端 / IDE 扩展接入

## 📦 安装

### 从源码安装（当前推荐）

```bash
git clone https://github.com/Y-Bay/Luoshu-cli.git
cd Luoshu-cli
npm install
npm run bundle
npm link        # 全局注册 luoshu 命令
```

> 需要 Node.js ≥ 22.0.0。

### 验证

```bash
which luoshu               # → 应指向 ~/.nvm/.../bin/luoshu
luoshu --version           # → 0.1.0
luoshu --help | head -5    # → Usage: luoshu [options] [command]
```

## 🚀 启动

直接运行：

```bash
luoshu
```

首次启动会进入 **Provider 选择**界面，选择一个 OpenAI 兼容 endpoint（推荐 Custom Provider 接入洛书模型），配好 API key 即可开始对话。

### SSH 场景下颜色问题

SSH 默认不透传 `COLORTERM` 环境变量，会导致 banner 渐变退化为色块。任选一种修复：

```bash
# 方式 1：每次启动强制真彩
FORCE_COLOR=3 luoshu

# 方式 2：在 ~/.zshrc 加 alias
echo 'alias luoshu="FORCE_COLOR=3 luoshu"' >> ~/.zshrc && source ~/.zshrc

# 方式 3：在远端 shell rc 设置
echo 'export COLORTERM=truecolor' >> ~/.zshrc
```

验证真彩是否工作：

```bash
printf '\x1b[38;2;255;100;0mTRUECOLOR\x1b[0m\n'   # 显示橙色 = 真彩支持
```

## 🗂️ 关键文件与目录

| 路径                              | 说明                                         |
| --------------------------------- | -------------------------------------------- |
| `~/.luoshu/settings.json`         | 用户级配置                                   |
| `~/.luoshu/extensions/`           | 用户级扩展                                   |
| `<project>/.luoshu/settings.json` | 项目级配置                                   |
| `<project>/.luoshu/worktrees/`    | 工具创建的 git worktree                      |
| `<project>/.luoshu/rules/`        | 项目级规则文件（用于 code review 等）        |
| `<project>/LUOSHU.md`             | 项目级 system prompt（最重要）               |
| `<project>/.luoshuignore`         | luoshu 工具忽略文件列表（类似 `.gitignore`） |

## ⚙️ 关键环境变量

| 变量                          | 默认           | 说明                         |
| ----------------------------- | -------------- | ---------------------------- |
| `LUOSHU_HOME`                 | `~/.luoshu`    | 配置根目录                   |
| `LUOSHU_RUNTIME_DIR`          | `$LUOSHU_HOME` | 运行时日志/状态目录          |
| `LUOSHU_DEBUG`                | `0`            | 启用 debug 日志              |
| `LUOSHU_LANG`                 | 系统语言       | UI 语言（zh / en / ja 等）   |
| `LUOSHU_MODEL`                | provider 默认  | 强制指定主模型               |
| `LUOSHU_EMBEDDING_MODEL`      | provider 默认  | 嵌入模型                     |
| `LUOSHU_MAX_TOOL_CONCURRENCY` | 4              | 并发工具调用上限             |
| `LUOSHU_IDE_SERVER_PORT`      | 自动分配       | IDE 集成端口                 |
| `FORCE_COLOR=3`               | -              | 强制 24-bit 真彩（SSH 场景） |
| `COLORTERM=truecolor`         | -              | 同上，受 ink 识别            |

完整 ~40 个 `LUOSHU_*` 变量可通过 `luoshu --help` 查询，或 grep 源码。

## 🔌 协议接口（用于第三方接入）

Luoshu CLI 不仅是 TUI，也是一个 agent runtime。可被 GUI 客户端、IDE 扩展、自动化脚本接入：

### 1. ACP (Agent Client Protocol)

stdio JSON-RPC 协议，已在 `packages/cli/src/acp-integration/` 实现。任意 ACP 兼容客户端都可调用：

```bash
luoshu --acp   # 启动 ACP server, stdin/stdout 走 JSON-RPC
```

### 2. HTTP Daemon (实验阶段)

```bash
luoshu serve --port 4170 --hostname 127.0.0.1
# 提供 RESTful + SSE 接口
# 默认 loopback 免鉴权；非 loopback 需要 --token 或 LUOSHU_SERVER_TOKEN
```

详见 `packages/cli/src/serve/`。

### 3. IDE Companion

VSCode 扩展位于 `packages/vscode-ide-companion/`（继承自 qwen-code，未深度改造，可作为 luoshu 接入参考）。

## 📜 协议与署名

本项目以 Apache License 2.0 发布，详见 [`LICENSE`](./LICENSE)。

继承关系与改动声明详见 [`LUOSHU_NOTICE.md`](./LUOSHU_NOTICE.md)：

- **原作**：[google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli) (Apache 2.0)
- **上游 fork**：[QwenLM/qwen-code](https://github.com/QwenLM/qwen-code) (Apache 2.0)
- **当前 fork**：Luoshu CLI（Y-Bay/Luoshu-cli, Apache 2.0）

所有上游 `Copyright Google LLC` / `Copyright Qwen Team` 注释依法保留；本项目改动的文件追加了 `Modifications copyright 2026 Luoshu Team` 标注。

## 🧭 项目状态

- ✅ 完整品牌化（命令名 / banner / 配置目录 / 环境变量）
- ✅ Provider 选择菜单清理（移除 Alibaba ModelStudio 入口）
- ✅ 行楷书法 banner + 莫兰迪辐射渐变
- ✅ 中文 i18n 全量更新
- ⏳ 洛书模型 API 对接（开发中）
- ⏳ GUI 客户端协议对接（规划中）
- ⏳ npm publish（待品牌定稿）

## 🙏 致谢

感谢 Google Gemini CLI 团队与 Qwen Code 团队的开源工作。Luoshu CLI 站在他们的肩膀上。
