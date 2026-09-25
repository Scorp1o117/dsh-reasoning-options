# dsh-reasoning-options

**GitHub**: [Scorp1o117/dsh-reasoning-options](https://github.com/Scorp1o117/dsh-reasoning-options) · **npm**: [dsh-reasoning-options](https://www.npmjs.com/package/dsh-reasoning-options) · [中文](README.zh.md)

A small DeepSeek Harness plugin that automatically adds a **reasoning-effort picker** to every pi-ai (third-party gateway) model, and **auto-injects required routing headers** (such as `x-opencode-session` for OpenCode Go).

## Why

1. **Reasoning Effort Selection**: dsh's built-in DeepSeek models show a reasoning-effort selector in the Web UI because the DeepSeek adapter declares reasoning capability for them. Models configured through `llm-pi-ai` (OpenCode Go, GOAT, Volcengine Ark, ...) **don't** — pi-ai only offers effort levels for models that explicitly declare `reasoningEfforts`, and hand-declared gateway models never do.
2. **OpenCode Go Compatibility**: OpenCode Go (`opencode.ai/zen/go/v1`) strictly requires an `x-opencode-session` HTTP header to route requests and manage prompt cache. Without it, requests fail with `400: {"type":"MissingSessionID", ...}`.

This plugin closes both gaps: it scans the `llm-pi-ai` namespace, adds the full level set (off / minimal / low / medium / high / xhigh / max) and default `reasoning: high` to models without declarations, and injects `x-opencode-session` into OpenCode Go provider headers if not already set. Writes go through DSH's native settings pipeline into the Profile patch.

> The plugin only gives users a convenient way to pick and ensures gateway requirements are satisfied. Which level a model actually supports is the user's call; the plugin does not judge model fitness.

## Compatibility (v0.2.3)

Tested with DSH `0.1.7-rc.1` and `0.1.7-rc.2` (`next`); npm `latest` is `0.1.5-rc.3`.
The plugin reads `settings.describe()` and writes the current Profile patch.
Older hosts require an older plugin release; alpha releases remain `unknown`.

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

1. On boot, read the resolved `llm-pi-ai` namespace (registered by the pi-ai plugin).
2. For each model without `reasoningEfforts`, generate a mutation writing the full seven-level declaration at the exact path.
3. For provider routes without a `reasoning` default, add `reasoning: high`.
4. For OpenCode Go providers (`baseURL` containing `opencode.ai`), auto-inject `x-opencode-session: dsh-session` into `headers` if missing.
5. Writes are schema-validated by pi-ai, persisted, and hot-committed; dsh's native UI/request path takes over.
6. **Idempotent**: models and headers that are already declared are untouched; a second scan is a no-op. Listens to `settings/document-updated`, so models or providers added later are covered automatically.

## Config

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Set `false` to stop auto-patching |
| `autoSessionHeader` | `true` | Auto-inject `x-opencode-session` for `opencode.ai` gateways |
| `sessionHeaderValue` | `'dsh-session'` | Value for injected `x-opencode-session` header |

> Want different defaults or wire values? After the patch they live in the `llm-pi-ai` entry of the active Profile patch — edit them freely; the plugin never overwrites existing declarations.

## Notes

- The plugin reads and mutates the `llm-pi-ai` namespace but does **not** own it (pi-ai registers it exclusively). All writes use the public `settings.mutate` API — equivalent to editing via the Web UI.
- Wire spellings are OpenAI-compatible (`low`/`medium`/`high`/...). Most OpenAI-compatible gateways accept them; if one expects its own spelling, adjust the values in the Profile patch.
