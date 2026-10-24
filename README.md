# dsh-reasoning-options

## DSH 0.2.1-rc.3

Supports DSH 0.2.1-rc.3, including explicit prerelease engines.dsh and peer ranges. This host update adds More navigation menus, keeps unsent drafts on New Session, and follows the official /models listing on the DeepSeek API-key route; the settings and pi-ai interfaces used here remain unchanged, the native reasoning settings keep the opt-in augmentation policy, and no removed host API (`ctx.layout.entryVisibility`, `agentPresetNavigation`) was in use.

## DSH 0.2.1-rc.2

Supports DSH 0.2.1-rc.2, including explicit prerelease engines.dsh and peer ranges. This host update adds DeepSeek V4.1 Flash 1017 and Search/Fetch APIs; the plugin APIs used here remain unchanged. Existing reasoning settings and the opt-in augmentation policy are preserved.

## DSH 0.2.1-rc.1

DSH 0.2.1-rc.1 includes a native editor for custom-model reasoning levels. Automatic augmentation is now opt-in (`augmentReasoning: false` by default), so turning reasoning off in Models stays off. Existing declarations and provider defaults are retained. OpenCode headers and the revision-checked provider Default helper remain available. On older hosts, opt in to augmentation to restore automatic filling.

Optionally adds seven explicit reasoning levels to custom pi-ai models while retaining DSH's native **Default / Provider default** choice. Default sends no reasoning effort; it does not turn thinking off at the provider.

Requires DSH 0.2.0-rc.2 or later 0.2.x, on Web and Desktop. Install with the Desktop-provided dsh command (Application → Manage dsh Command):

```sh
dsh plugin --profile desktop add dsh-reasoning-options@0.6.0
```

Use `--profile web` for Web. Restart DSH after package changes. Open **Plugins → Installed → dsh-reasoning-options** to configure it.

## Default and existing configurations

The plugin no longer inserts `reasoning: high` on provider routes. New routes without a configured effort show DSH's native Default choice alongside off, minimal, low, medium, high, xhigh and max. The literal string `default` is never sent to pi-ai or the provider.

For routes configured by an older plugin version, choose **Default (omit reasoning effort)** in this plugin's provider dropdown. This removes only that route's `reasoning` setting using a revision-checked unset. Existing configured route defaults are preserved until you change them. If a conversation has an explicit effort selected, select Default again in the conversation's model menu. Default omits effort; the provider may still think according to its own defaults.

Existing custom effort declarations and `reasoningEfforts: false` are retained. The plugin does not promise that every model supports every explicit level.

## Other settings

- `enabled` (true): enable gateway helpers.
- `augmentReasoning` (false): opt in to filling missing declarations; this overrides turning reasoning off in the native editor.
- `autoSessionHeader` (true): add a missing x-opencode-session header for HTTP(S) opencode.ai and its subdomains.
- `sessionHeaderValue` (dsh-session): header value; existing headers are preserved.
- `pollIntervalMs` (30000): fallback rescan interval; 0 disables periodic rescans.

Writes use the public settings API, preserve namespace revisions, retry conflicts and run outside HMR transactions. Existing unrelated providers, models and headers are retained. Chinese and English follow the DSH language setting.

## Validation

`npm test` covers declaration reconciliation, preserved route defaults, revision conflicts, HMR scheduling, configuration writes and localization.
