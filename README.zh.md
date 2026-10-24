# dsh-reasoning-options

## DSH 0.2.1-rc.3

适配 DSH 0.2.1-rc.3，明确声明该预发布版本的 engines.dsh 与 peer 范围。宿主新增侧栏/会话「更多」导航菜单、修复新建会话丢失未发送草稿、DeepSeek API Key 路由改跟随官方 /models 模型列表；本插件使用的 settings 与 pi-ai 接口保持不变，原生推理设置保留自动补齐显式开启策略，也未使用任何被移除的宿主 API（`ctx.layout.entryVisibility`、`agentPresetNavigation`）。

## DSH 0.2.1-rc.2

适配 DSH 0.2.1-rc.2，明确声明该预发布版本的 engines.dsh 与 peer 范围。宿主新增 DeepSeek V4.1 Flash 1017 及 Search/Fetch API，本插件使用的接口保持不变。保留已有推理配置及自动补齐显式开启策略。

## DSH 0.2.1-rc.1

DSH 0.2.1-rc.1 已内置自定义模型推理档位编辑。自动补齐改为显式开启（`augmentReasoning` 默认 false），避免重新开启在原生模型设置中关闭的推理。已有档位和路由默认强度保留；OpenCode 会话头及带 revision 校验的路由 Default 辅助继续可用。旧宿主如需自动补齐，可在高级设置主动开启。

可选为自定义 pi-ai 模型补齐七档推理强度，保留 DSH 原生 **Default / 服务商默认**。Default 不发送推理强度参数；服务商仍可能按自身默认设置思考。

支持 DSH 0.2.0-rc.2 及后续 0.2.x 的 Web、Desktop。使用 Desktop 提供的 dsh 命令（应用 → 管理 dsh 命令）安装：

```sh
dsh plugin --profile desktop add dsh-reasoning-options@0.6.0
```

Web 使用 `--profile web`。安装更新后重启 DSH，在 **插件 → 已安装 → dsh-reasoning-options** 打开配置页。

## Default 与旧配置

新版不再自动写入路由的 `reasoning: high`。未配置默认强度的路由会显示 DSH 原生 Default，以及 off、minimal、low、medium、high、xhigh、max。不会把字符串 `default` 发给适配器或模型。

旧版本已经配置过路由强度时，在插件设置的路由下拉框选择 **Default（不注入推理强度）**。该操作通过带版本校验的 unset 清除对应路由的 reasoning，不修改其它路由。用户已有的默认强度不会在升级时自动删除。如果会话曾经显式选过强度，还需在会话模型菜单重新选择 Default。

保留自定义 reasoningEfforts 和显式 reasoningEfforts: false。显式七档是否被模型支持取决于服务商。

## 其它设置

- enabled：启用网关辅助，默认开启。
- augmentReasoning：自动补齐档位，默认关闭；主动开启后会覆盖原生编辑器关闭推理的操作。
- autoSessionHeader：为 HTTP(S) opencode.ai 及其子域补齐 x-opencode-session，默认开启。
- sessionHeaderValue：默认 dsh-session，保留已有 Header。
- pollIntervalMs：默认 30000 毫秒，0 关闭定期检查。

通过原生设置 API 写入，校验 revision、重试冲突，并在 HMR 事务外执行。中英文跟随 DSH 语言设置。运行 npm test 验证。
