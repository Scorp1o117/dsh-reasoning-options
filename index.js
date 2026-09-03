// dsh-reasoning-efforts — give every custom pi-ai model a reasoning-effort
// selector.
//
// dsh's own DeepSeek adapter advertises reasoning levels for its models, so
// the Web UI shows a reasoning-effort picker. The pi-ai adapter (third-party
// gateways configured under the `llm-pi-ai` settings namespace) only
// advertises levels for models that DECLARE `reasoningEfforts` in their
// profile; hand-declared gateway models (OpenCode Go, GOAT, Volcengine Ark,
// ...) therefore get no picker, and any explicit effort is rejected inside
// the adapter (`UNSUPPORTED_REASONING_EFFORT`).
//
// This plugin closes that gap by writing the declaration itself: it scans the
// resolved `llm-pi-ai` namespace and, for every model that does not already
// declare `reasoningEfforts`, applies a precise `settings.mutate` op that adds
// the full level set (off → max) with OpenAI-compatible wire spellings, plus a
// route-level `reasoning: high` default. The write goes through the normal
// settings pipeline (schema-validated by pi-ai, persisted to settings.yaml,
// hot-committed), so dsh's own machinery — UI picker, request dispatch — does
// the rest. No adapter internals are touched.
//
// Idempotent: models that already declare efforts are left alone, and a scan
// that finds nothing to do performs no write, so the settings/updated echo of
// our own mutate terminates immediately.
//
// Configuration (cordis.patch.yml `config`):
//   reasoning-efforts:
//     enabled: true   # set false to stop auto-patching
//
// No settings namespace is owned by this plugin; the `llm-pi-ai` namespace is
// read + mutated, never owned.

import z from "@deepseek-ai/schemastery";

/** Cordis plugin name. */
const name = "reasoning-efforts";
/** Services injected (settings is required; nothing else). */
const inject = ["settings"];
/** Settings namespace owned by this plugin. */
const NS = "reasoning-efforts";

/** The namespace whose models we augment (owned by dsh-llm-pi-ai). */
const TARGET_NS = "llm-pi-ai";

/** Route-level default reasoning level applied when a route declares none. */
const DEFAULT_ROUTE_LEVEL = "high";

/** All selectable levels, escalation order (matches pi-ai THINKING_LEVELS). */
const LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];

/** Default reasoningEfforts: OpenAI-compatible wire spellings. `off` is
 *  valueless (pi-ai sends no reasoning option — the gateway default applies,
 *  which for DeepSeek-style models is to think). */
const DEFAULT_EFFORTS = {
  off: null,
  minimal: "minimal",
  low: "low",
  medium: "medium",
  high: "high",
  xhigh: "xhigh",
  max: "max",
};

/** Runtime schema for the reasoning-efforts row. */
const Config = z.object({
  enabled: z.boolean().default(true),
});

/** True when a model profile already declares reasoningEfforts. */
function hasEfforts(model) {
  return model !== null && typeof model === "object" && model.reasoningEfforts !== undefined;
}

/**
 * Compute the mutate ops that would bring the target namespace's user section
 * up to date: add reasoningEfforts to every model that lacks it, and set a
 * route-level `reasoning` default where the route has none.
 *
 * @param {any} resolved - `ctx.settings.get("llm-pi-ai")` (schema-resolved).
 * @returns {Array<{op:'set', path:string[]}>} ops, possibly empty.
 */
export function computeOps(resolved) {
  if (!resolved || typeof resolved !== "object") return [];
  const providers = resolved.providers;
  if (!providers || typeof providers !== "object") return [];
  const ops = [];
  for (const [provider, profile] of Object.entries(providers)) {
    if (!profile || typeof profile !== "object") continue;
    // Route-level default reasoning level (only when the route sets none).
    if (profile.reasoning === undefined || profile.reasoning === null || profile.reasoning === "") {
      ops.push({ op: "set", path: ["providers", provider, "reasoning"], value: DEFAULT_ROUTE_LEVEL });
    }
    const models = profile.models;
    if (!Array.isArray(models)) continue;
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      if (!model || typeof model !== "object" || hasEfforts(model)) continue;
      if (model.reasoningEfforts === false) continue; // explicitly non-reasoning
      ops.push({
        op: "set",
        path: ["providers", provider, "models", String(i), "reasoningEfforts"],
        value: { ...DEFAULT_EFFORTS },
      });
    }
  }
  return ops;
}

/**
 * Scan-and-fix pass. Reads the resolved target namespace, computes the
 * missing-effort ops, and applies them through settings.mutate (validated by
 * pi-ai's own schema, persisted, committed). No-op when nothing is missing.
 */
export async function reconcile(settings, logger) {
  const resolved = settings.get(TARGET_NS);
  const ops = computeOps(resolved);
  if (ops.length === 0) return 0;
  try {
    await settings.mutate(TARGET_NS, ops);
    logger?.info?.(`[reasoning-efforts] patched ${ops.length} op(s) into ${TARGET_NS}`);
  } catch (error) {
    // A refused write (e.g. pi-ai schema rejection of one op) must not take
    // the plugin down; report and leave the namespace untouched.
    logger?.warn?.(`[reasoning-efforts] mutate failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  return ops.length;
}

/** Plugin entry. */
function apply(ctx, config) {
  const cfg = () => config;

  const settings = ctx.settings;
  if (!settings || typeof settings.mutate !== "function" || typeof settings.get !== "function") {
    ctx.logger.warn("[reasoning-efforts] settings service unavailable; plugin disabled");
    return;
  }

  const run = () => {
    if (cfg().enabled === false) return;
    // Defer: on first boot the target namespace may not be registered yet
    // (pi-ai plugin activation order). settings.get returns undefined then;
    // reconcile() no-ops on undefined, and the settings/updated listener
    // below re-runs the pass once llm-pi-ai appears.
    void reconcile(settings, ctx.logger);
  };

  // Re-run whenever the target namespace changes (model additions/edits, and
  // the echo of our own mutate — which terminates because the second scan
  // finds nothing to do).
  ctx.on("settings/updated", (changedNs) => {
    if (changedNs === TARGET_NS) run();
  });

  // Initial pass, deferred so the settings document has published. Retry a few
  // times with a backoff in case the pi-ai plugin (which owns llm-pi-ai)
  // registers later than us; each retry is a cheap no-op read once nothing is
  // missing.
  let attempts = 0;
  const MAX_ATTEMPTS = 10;
  const tick = () => {
    attempts += 1;
    run();
    if (attempts < MAX_ATTEMPTS) setTimeout(tick, 500 * attempts);
  };
  setTimeout(tick, 0);
}

export { Config, apply, inject, name };
