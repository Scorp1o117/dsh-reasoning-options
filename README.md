# DSH Reasoning Options

简体中文 | [English](README.en.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的第三方模型路由提供 OpenCode 会话头、服务商默认值管理，以及**按需开启**的推理档位补齐。DSH 已提供原生推理档位编辑时，建议优先使用原生设置。

## 功能

- **OpenCode 会话头**：为缺少 `x-opencode-session` 的 `opencode.ai` 及其子域的 HTTP(S) 路由补齐请求头；已有请求头保留。
- **路由 Default**：可清除旧配置中指定的路由推理强度，恢复 DSH 的 **Default / 服务商默认**。
- **可选档位补齐**：开启 `augmentReasoning` 后，给缺少声明的自定义 pi-ai 模型补齐 `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。已有自定义声明和 `reasoningEfforts: false` 保留。

**Default 表示不发送推理强度参数，不等于关闭思考。** 本插件的默认 `off` 映射也不传强度值，实际行为由服务商决定。界面出现某个档位不代表模型或服务商一定支持它。

## 兼容性与安装

支持 DSH Web / Desktop；仓库声明兼容 `0.2.0-rc.2`、`0.2.1-rc.1` / `rc.2` / `rc.3` / `rc.4` / `rc.5` 和符合 `>=0.2.0-rc.2 <0.3.0` 的版本，预发布版本范围见 [package.json](package.json)。要求 Node.js `>=20.18`。

Desktop 先在 **应用 → 管理 dsh 命令** 安装桌面版 `dsh`：

```sh
dsh plugin --profile desktop add dsh-reasoning-options
```

Web 将 `desktop` 改为 `web`。安装后重启 DSH，打开 **插件 → 已安装 → dsh-reasoning-options**。也可通过 [Enhancement Suite](https://github.com/Scorp1o117/dsh-enhancement-suite) 安装。

## 配置

| 设置 | 默认值 | 作用 |
| --- | --- | --- |
| `enabled` | `true` | 启用网关辅助 |
| `augmentReasoning` | `false` | 为缺失声明的模型补齐档位；主动开启后，可能重新补上在原生编辑器中移除的声明 |
| `autoSessionHeader` | `true` | 为匹配的 OpenCode 路由补齐缺失的会话头 |
| `sessionHeaderValue` | `dsh-session` | 自动补齐时使用的会话头值 |
| `pollIntervalMs` | `30000` | 后备检查间隔，单位毫秒；`0` 关闭定期检查 |

### 从旧版恢复 Default

在插件配置页的路由下拉框选择 **Default（不注入推理强度）**，只清除对应路由的 `reasoning` 设置。升级不会自动删除已有路由强度。如果会话模型菜单曾单独选择强度，也要在那里重新选择 Default。

插件通过 DSH 设置接口写入并处理版本冲突；界面语言跟随 DSH。

## 开发与反馈

`npm test` 覆盖档位补齐、默认值保留、配置写入和本地化。更多信息：[npm](https://www.npmjs.com/package/dsh-reasoning-options) · [问题反馈](https://github.com/Scorp1o117/dsh-reasoning-options/issues) · [MIT License](LICENSE)。
