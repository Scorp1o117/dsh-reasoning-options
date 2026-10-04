# dsh-reasoning-options

## Configuration page (DSH 0.2.0-rc.2 and later)

Open **Plugins → Installed → dsh-reasoning-options** from the homepage sidebar to configure and save this plugin. The page uses the official `plugins.bundle.config` interface, without a duplicate entry in global Settings. Web and Desktop share the page. This version requires DSH 0.2.0-rc.2 or a later 0.2.x host; existing configuration is retained.

**GitHub**: [Scorp1o117/dsh-reasoning-options](https://github.com/Scorp1o117/dsh-reasoning-options) · **npm**: [dsh-reasoning-options](https://www.npmjs.com/package/dsh-reasoning-options) · [中文](README.zh.md)

A small DeepSeek Harness plugin that automatically adds a **reasoning-effort picker** to every pi-ai (third-party gateway) model, and **auto-injects required routing headers** (such as `x-opencode-session` for OpenCode Go).

## Why

1. **Reasoning Effort Selection**: dsh's built-in DeepSeek models show a reasoning-effort selector in the Web UI because the DeepSeek adapter declares reasoning capability for them. Models configured through `llm-pi-ai` (OpenCode Go, GOAT, Volcengine Ark, ...) **don't** — pi-ai only offers effort levels for models that explicitly declare `reasoningEfforts`, and hand-declared gateway models never do.
2. **OpenCode Go Compatibility**: OpenCode Go (`opencode.ai/zen/go/v1`) strictly requires an `x-opencode-session` HTTP header to route requests and manage prompt cache. Without it, requests fail with `400: {"type":"MissingSessionID", ...}`.

This plugin closes both gaps: it scans the `llm-pi-ai` namespace, adds the full level set (off / minimal / low / medium / high / xhigh / max) and default `reasoning: high` to models without declarations, and injects `x-opencode-session` into OpenCode Go provider headers if not already set. Writes go through DSH's native settings pipeline into the Profile patch.

> The plugin only gives users a convenient way to pick and ensures gateway requirements are satisfied. Which level a model actually supports is the user's call; the plugin does not judge model fitness.

## Desktop install

Use the Desktop-installed `dsh` command (Application → Manage dsh Command), or the app’s Plugins page. Then install into the Desktop profile:

```powershell
dsh plugin --profile desktop add dsh-reasoning-options@0.3.1
```

Restart the Desktop app to load the client bundle. Desktop keeps its profile under `$DSH_HOME/profiles/desktop`.


## Compatibility (v0.3.1)

Verified with DSH `0.1.7-rc.2` (Web) and `0.2.0-rc.2` (Desktop runtime) in isolated profiles. The Desktop app uses its own `desktop` profile. Other DSH prereleases remain unverified.

## Install

```powershell
dsh plugin --profile web add dsh-reasoning-options
```

Or mount manually in a profile patch:

```yaml
- insert:
    - id: reasoning-efforts
      name: 'dsh-reasoning-options'
      config:
        enabled: true
```

## How it works

1. Read the current **user layer** of the `llm-pi-ai` namespace (`settings.describe()` re-reads the profile patch from disk every time).
2. For each model without `reasoningEfforts`, generate a mutation writing the full seven-level declaration at the exact path.
3. For provider routes without a `reasoning` default, add `reasoning: high`.
4. For HTTP(S) OpenCode Go providers whose URL hostname is `opencode.ai` or a subdomain, auto-inject `x-opencode-session: dsh-session` into `headers` if missing. A mention in the path, query or username does not qualify; existing headers are preserved.
5. Writes are schema-validated by pi-ai, persisted, and hot-committed; dsh's native UI/request path takes over.
6. **Idempotent and serialized**: models and headers that are already declared are untouched, and a scan that finds nothing writes nothing. Only one pass runs at a time, so repeated triggers never contend for the settings file lock.
7. **When it runs**: on `settings/document-updated` (a model changed through the Web UI), on `app-boot/config-reload`, and as a fallback every `pollIntervalMs`. A trigger only flags the namespace; the write itself runs from this plugin's own timer context. dsh emits the settings event from *inside* the hot-reload transaction that is applying the change, and a write issued inside that transaction is refused outright (`HMR transactions cannot be nested`).

## Config

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Set `false` to stop auto-patching |
| `autoSessionHeader` | `true` | Auto-inject `x-opencode-session` for `opencode.ai` gateways |
| `sessionHeaderValue` | `'dsh-session'` | Value for injected `x-opencode-session` header |
| `pollIntervalMs` | `30000` | Fallback rescan period in ms; `0` disables polling |

> Want different defaults or wire values? After the patch they live in the `llm-pi-ai` entry of the active Profile patch — edit them freely; the plugin never overwrites existing declarations.

## Notes

- The plugin reads and mutates the `llm-pi-ai` namespace but does **not** own it (pi-ai registers it exclusively). All writes use the public `settings.update` API — equivalent to editing via the Web UI.
- Arrays are replaced wholesale, so every write restates the full `models` list of each provider it touches. Each write carries the revision it was planned from, so a namespace that moved in the meantime is re-read and re-planned instead of clobbering the concurrent editor.
- The plugin writes the `config` of the `llm-pi-ai` row in the profile patch, which is rewritten as a whole (YAML comments inside that row are lost).
- **Hand-editing `cordis.patch.yml` no longer needs a dsh restart**: the next poll (within 30s by default) adds the missing declarations and hot-applies the new models along the way. Lower `pollIntervalMs` to shorten the delay.
- Wire spellings are OpenAI-compatible (`low`/`medium`/`high`/...). Most OpenAI-compatible gateways accept them; if one expects its own spelling, adjust the values in the Profile patch.

The page configures reasoning augmentation, automatic session headers, session identity and polling interval through the existing Host configuration lifecycle.
