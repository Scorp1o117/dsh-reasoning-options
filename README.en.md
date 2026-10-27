# DSH Reasoning Options

[简体中文](README.md) | English

Adds OpenCode session headers, provider-default management and **opt-in** reasoning-level augmentation for third-party model routes in [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). When DSH provides a native reasoning editor, prefer its native settings.

## Features

- **OpenCode session header:** adds a missing `x-opencode-session` header to HTTP(S) routes on `opencode.ai` and its subdomains, preserving existing headers.
- **Provider Default:** removes a previously configured route effort to restore DSH's **Default / Provider default**.
- **Optional levels:** when `augmentReasoning` is enabled, fills missing custom pi-ai model declarations with `off`, `minimal`, `low`, `medium`, `high`, `xhigh` and `max`. Existing custom declarations and `reasoningEfforts: false` are preserved.

**Default omits the reasoning-effort parameter; it does not necessarily disable thinking.** This plugin's default `off` mapping also omits the effort value, so the provider determines the behavior. A displayed level is not a guarantee that a model or provider supports it.

## Compatibility and installation

Supports DSH Web / Desktop. The repository declares compatibility with `0.2.0-rc.2`, `0.2.1-rc.1` / `rc.2` / `rc.3` and versions matching `>=0.2.0-rc.2 <0.3.0`; see [package.json](package.json) for the complete prerelease range. Node.js `>=20.18` is required.

For Desktop, install its `dsh` command through **Application → Manage dsh Command** first:

```sh
dsh plugin --profile desktop add dsh-reasoning-options
```

Replace `desktop` with `web` for Web. Restart DSH and open **Plugins → Installed → dsh-reasoning-options**. You can also install it through the [Enhancement Suite](https://github.com/Scorp1o117/dsh-enhancement-suite).

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `enabled` | `true` | Enable gateway helpers |
| `augmentReasoning` | `false` | Fill missing model declarations; when enabled, this can restore declarations removed in the native editor |
| `autoSessionHeader` | `true` | Add a missing session header to matching OpenCode routes |
| `sessionHeaderValue` | `dsh-session` | Value used for the added header |
| `pollIntervalMs` | `30000` | Fallback scan interval in milliseconds; `0` disables periodic scans |

### Restore Default after upgrading

Select **Default (omit reasoning effort)** in the plugin's provider dropdown to remove that route's `reasoning` setting only. Upgrading does not automatically erase configured route efforts. If a conversation has an explicit effort selected, choose Default again in its model menu.

Writes use the DSH settings API and handle revision conflicts. The interface follows the DSH language setting.

## Development and feedback

`npm test` covers augmentation, default preservation, configuration writes and localization. More: [npm](https://www.npmjs.com/package/dsh-reasoning-options) · [Issues](https://github.com/Scorp1o117/dsh-reasoning-options/issues) · [MIT License](LICENSE).
