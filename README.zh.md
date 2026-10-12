# dsh-reasoning-options

为自定义 pi-ai 模型补齐七档推理强度，保留 DSH 原生 **Default / 服务商默认**。Default 不发送推理强度参数；服务商仍可能按自身默认设置思考。

支持 DSH 0.2.0-rc.2 及后续 0.2.x 的 Web、Desktop。使用 Desktop 提供的 dsh 命令（应用 → 管理 dsh 命令）安装：

```sh
dsh plugin --profile desktop add dsh-reasoning-options@0.5.0
```

Web 使用 `--profile web`。安装更新后重启 DSH，在 **插件 → 已安装 → dsh-reasoning-options** 打开配置页。

## Default 与旧配置

新版不再自动写入路由的 `reasoning: high`。未配置默认强度的路由会显示 DSH 原生 Default，以及 off、minimal、low、medium、high、xhigh、max。不会把字符串 `default` 发给适配器或模型。

旧版本已经配置过路由强度时，在插件设置的路由下拉框选择 **Default（不注入推理强度）**。该操作通过带版本校验的 unset 清除对应路由的 reasoning，不修改其它路由。用户已有的默认强度不会在升级时自动删除。如果会话曾经显式选过强度，还需在会话模型菜单重新选择 Default。

保留自定义 reasoningEfforts 和显式 reasoningEfforts: false。显式七档是否被模型支持取决于服务商。

## 其它设置

- enabled：自动补齐档位，默认开启。
- autoSessionHeader：为 HTTP(S) opencode.ai 及其子域补齐 x-opencode-session，默认开启。
- sessionHeaderValue：默认 dsh-session，保留已有 Header。
- pollIntervalMs：默认 30000 毫秒，0 关闭定期检查。

通过原生设置 API 写入，校验 revision、重试冲突，并在 HMR 事务外执行。中英文跟随 DSH 语言设置。运行 npm test 验证。
