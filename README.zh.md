# dsh-reasoning-efforts

**GitHub**: [Scorp1o117/dsh-reasoning-efforts](https://github.com/Scorp1o117/dsh-reasoning-efforts) · **npm**: [dsh-reasoning-efforts](https://www.npmjs.com/package/dsh-reasoning-efforts) · [English](README.md)

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 **pi-ai 自定义模型（第三方网关）** 自动补上「推理强度」选择器的小插件。

## 为什么需要它

dsh 自带的 DeepSeek 模型在 Web UI 里有推理强度选项（off / low / high / max …），因为 DeepSeek 适配器为模型声明了 reasoning 能力。但通过 `llm-pi-ai` 配置的第三方网关模型（OpenCode Go、GOAT、火山方舟等）**默认没有这个选项**——pi-ai 只给「显式声明了 `reasoningEfforts`」的模型提供档位 UI，手工在 settings.yaml 里声明的模型都不会声明它。

本插件自动补齐这个声明：扫描 `llm-pi-ai` 命名空间，给**每个没有 `reasoningEfforts` 的模型**写入一份全七档声明（off / minimal / low / medium / high / xhigh / max，OpenAI 兼容 wire 值），并给没设默认档位的 provider 路由加上 `reasoning: high`。写入走 dsh 原生 settings 管线（schema 校验 → 落盘 settings.yaml → 热生效），之后 Web UI 就有档位可选、选完请求也会真的带上——**用户完全不用手动改文件**。

> 只负责「给用户一个更方便的选择入口」。具体选哪档、模型支不支持，由用户自己决定，插件不判断模型适配度。

## 安装

```powershell
dsh plugin --profile web add dsh-reasoning-efforts
```

或手动在 profile patch 挂载：

```yaml
- insert:
    - id: reasoning-efforts
      name: 'dsh-reasoning-efforts'
      config:
        enabled: true
```

## 工作原理

1. 启动后读取 `llm-pi-ai` 命名空间的 resolved 配置（pi-ai 插件已注册它）。
2. 对每个 provider 的每个模型：若没有 `reasoningEfforts`，生成一条 `settings.mutate` op，在精确路径写入全七档声明。
3. 对没设 `reasoning` 默认档的 provider 路由，补 `reasoning: high`。
4. 所有写入经 pi-ai 自己的 schema 校验后持久化并热提交，dsh 原生 UI/请求链路随即生效。
5. **幂等**：已有档位的模型不碰；补完后再扫描是空操作，不会反复写。监听 `settings/updated`，之后新加的模型也会自动覆盖。

## 配置

| 字段 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | 设为 `false` 停止自动补档 |

> 想改默认档位或 wire 值？补丁写入后它们就在 `settings.yaml` 的 `llm-pi-ai` 段里，可随时手动调整，插件不会覆盖已有声明。

## 注意事项

- 插件**读取并改写 `llm-pi-ai` 命名空间**，但**不拥有**它（pi-ai 独占注册）。所有写入都走公开的 `settings.mutate` API，与在 Web UI 手改等效。
- 档位 wire 值为 OpenAI 兼容风格（`low`/`medium`/`high`/…）。绝大多数 OpenAI 兼容网关接受；个别网关若只认自己的写法，可在 settings.yaml 里把对应模型的档位值改成它的写法。
