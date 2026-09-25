# dsh-reasoning-options

**GitHub**: [Scorp1o117/dsh-reasoning-options](https://github.com/Scorp1o117/dsh-reasoning-options) · **npm**: [dsh-reasoning-options](https://www.npmjs.com/package/dsh-reasoning-options) · [English](README.md)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 **pi-ai 自定义模型（第三方网关）** 自动补上「推理强度」选择器，并**自动注入必需的网关路由 Header**（如 OpenCode Go 的 `x-opencode-session`）。

## 为什么需要它

1. **推理强度选框缺失**：dsh 自带的 DeepSeek 模型在 Web UI 里有推理强度选项（off / low / high / max …），因为 DeepSeek 适配器为模型声明了 reasoning 能力。但通过 `llm-pi-ai` 配置的第三方网关模型（OpenCode Go、GOAT、火山方舟等）**默认没有这个选项**——pi-ai 只给「显式声明了 `reasoningEfforts`」的模型提供档位 UI，手工在 profile patch（`cordis.patch.yml`）里声明的模型都不会声明它。
2. **OpenCode Go 网关兼容**：OpenCode Go 网关（`opencode.ai/zen/go/v1`）强制要求请求携带 `x-opencode-session` HTTP Header 用于请求分发与 Prompt Cache。缺少时会直接报错 `400: {"type":"MissingSessionID", ...}`。

本插件一并解决上述问题：扫描 `llm-pi-ai` 命名空间，给**每个没有 `reasoningEfforts` 的模型**写入全七档声明（off / minimal / low / medium / high / xhigh / max），给没设默认档位的 provider 加上 `reasoning: high`，并为 OpenCode Go provider 自动注入缺失的 `x-opencode-session` Header。写入走 dsh 原生 settings 管线（schema 校验 → 落盘 profile patch → 热生效）——**用户完全不用手动改文件**。

> 只负责「给用户一个更方便的选择入口」并保证网关连通性。具体选哪档、模型支不支持，由用户自己决定，插件不判断模型适配度。

## 兼容性（v0.3.0）

已验证 DSH `0.1.7-rc.1` 与 `0.1.7-rc.2`（npm `next`）；npm `latest` 是 `0.1.5-rc.3`。
插件通过 `settings.describe()` 读取配置，写入当前 Profile patch（`cordis.patch.yml`）。
旧宿主请使用插件旧版；alpha 版本继续标记 `unknown`。

> DSH `0.1.7-rc.2` 起 `settings.yaml` 已被废弃：首次启动时它会被改名成 `settings.yaml.imported`，各段内容导入 profile patch。因此本插件现在读写的都是 `cordis.patch.yml` 里 `llm-pi-ai` 那条的 `config`。

## 安装

```powershell
dsh plugin --profile web add dsh-reasoning-options
```

或手动在 profile patch 挂载：

```yaml
- insert:
    - id: reasoning-efforts
      name: 'dsh-reasoning-options'
      config:
        enabled: true
```

## 工作原理

1. 读取 `llm-pi-ai` 命名空间当前的**用户层**配置（`settings.describe()` 每次都会现读 profile patch 文件）。
2. 对每个 provider 的每个模型：若没有 `reasoningEfforts`，生成对应变更，写入全七档声明。
3. 对没设 `reasoning` 默认档的 provider 路由，补 `reasoning: high`。
4. 对 OpenCode Go provider（`baseURL` 包含 `opencode.ai`），若缺少 session header 则自动注入 `headers: { x-opencode-session: 'dsh-session' }`。
5. 所有写入经 pi-ai 自己的 schema 校验后持久化并热提交，dsh 原生 UI/请求链路随即生效。
6. **幂等 + 串行**：已有档位和已配置 Header 的项目不碰；补完后再扫描是空操作，不会反复写。同一时刻只跑一次扫描，多次触发不会互相抢配置文件锁。
7. **触发时机**：`settings/document-updated`（在 Web UI 里改模型）、`app-boot/config-reload`，以及每 `pollIntervalMs` 一次的兜底扫描。事件只置脏标记，真正的写入由插件自己的定时器上下文执行——因为 dsh 是在热重载事务**内部**发出设置变更事件的，而在该事务里再发起一次写入会被直接拒绝（`HMR transactions cannot be nested`）。

## 配置

| 字段 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | 设为 `false` 停止自动处理 |
| `autoSessionHeader` | `true` | 是否自动为 `opencode.ai` 网关注入 `x-opencode-session` |
| `sessionHeaderValue` | `'dsh-session'` | 自动注入的 `x-opencode-session` 默认值 |
| `pollIntervalMs` | `30000` | 兜底重扫周期（毫秒）；`0` 关闭轮询，只响应事件 |

> 想改默认档位或 wire 值？补丁写入后它们就在 `cordis.patch.yml` 的 `llm-pi-ai` 段里，可随时手动调整，插件不会覆盖已有声明。

## 注意事项

- 插件**读取并改写 `llm-pi-ai` 命名空间**，但**不拥有**它（pi-ai 独占注册）。所有写入都走公开的 `settings.update` API，与在 Web UI 手改等效。
- 数组是整体替换，所以插件每次写入都会重述它触碰到的 provider 的完整 `models` 列表；写入时带上读取到的 revision，若期间该命名空间被别处改过就冲突重试而不是覆盖并发编辑者。
- 插件写入的是 profile patch 中 `llm-pi-ai` 条目的 `config`，这一段会被整段重写（段内的 YAML 注释会丢失）。
- **手工编辑 `cordis.patch.yml` 新增模型后不必重启 dsh**：下一次轮询（默认 30 秒内）会补齐档位，并顺带让新模型热生效。把 `pollIntervalMs` 调小可缩短这个延迟。
- 档位 wire 值为 OpenAI 兼容风格（`low`/`medium`/`high`/…）。绝大多数 OpenAI 兼容网关接受；个别网关若只认自己的写法，可在 `cordis.patch.yml` 里把对应模型的档位值改成它的写法。
