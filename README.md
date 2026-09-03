# dsh-reasoning-efforts

**GitHub**: [Scorp1o117/dsh-reasoning-efforts](https://github.com/Scorp1o117/dsh-reasoning-efforts) · **npm**: [dsh-reasoning-efforts](https://www.npmjs.com/package/dsh-reasoning-efforts) · [中文](README.zh.md)

A small DeepSeek Harness plugin that automatically adds a **reasoning-effort picker** to every pi-ai (third-party gateway) model.

## Why

dsh's built-in DeepSeek models show a reasoning-effort selector in the Web UI because the DeepSeek adapter declares reasoning capability for them. Models configured through `llm-pi-ai` (OpenCode Go, GOAT, Volcengine Ark, ...) **don't** — pi-ai only offers effort levels for models that explicitly declare `reasoningEfforts`, and hand-declared gateway models never do.

This plugin closes the gap by writing the declaration itself: it scans the `llm-pi-ai` namespace and, for every model without `reasoningEfforts`, applies a settings mutation that adds the full level set (off / minimal / low / medium / high / xhigh / max, OpenAI-compatible wire spellings) and sets a route-level `reasoning: high` default where missing. Writes go through dsh's native settings pipeline (schema-validated → persisted to settings.yaml → hot-applied), so the Web UI picker appears and the chosen effort really reaches the request — **no manual file editing**.

> The plugin only gives users a convenient way to pick. Which level a model actually supports is the user's call; the plugin does not judge model fitness.

## Install

```powershell
dsh plugin --profile web add dsh-reasoning-efforts
```

Or mount manually in a profile patch:

```yaml
- insert:
    - id: reasoning-efforts
      name: 'dsh-reasoning-efforts'
      config:
        enabled: true
```

## How it works

1. On boot, read the resolved `llm-pi-ai` namespace (registered by the pi-ai plugin).
2. For each model without `reasoningEfforts`, generate a `settings.mutate` op writing the full seven-level declaration at the exact path.
3. For provider routes without a `reasoning` default, add `reasoning: high`.
4. Writes are schema-validated by pi-ai, persisted, and hot-committed; dsh's native UI/request path takes over.
5. **Idempotent**: models that already declare efforts are untouched; a second scan is a no-op. Listens to `settings/updated`, so models added later are covered automatically.

## Config

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Set `false` to stop auto-patching |

> Want different defaults or wire values? After the patch they live in the `llm-pi-ai` section of `settings.yaml` — edit them freely; the plugin never overwrites existing declarations.

## Notes

- The plugin reads and mutates the `llm-pi-ai` namespace but does **not** own it (pi-ai registers it exclusively). All writes use the public `settings.mutate` API — equivalent to editing via the Web UI.
- Wire spellings are OpenAI-compatible (`low`/`medium`/`high`/...). Most OpenAI-compatible gateways accept them; if one expects its own spelling, adjust the values in settings.yaml.
