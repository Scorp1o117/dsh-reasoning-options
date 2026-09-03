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
// This plugin closes that gap by writing the declaration itself: it reads the
// `llm-pi-ai` user section and, for every model that does not already declare
// `reasoningEfforts`, writes back the same section with the full level set
// (off → max) added, plus a route-level `reasoning: high` default where a
// route declares none. The write goes through the normal settings pipeline
// (schema-validated by pi-ai, persisted to settings.yaml, hot-committed), so
// dsh's own machinery — UI picker, request dispatch — does the rest. No
// adapter internals are touched.
//
// NOTE on arrays: dsh-settings `mutate` path ops and `update` merge both
// replace arrays wholesale, so we must always restate the full `models` array
// for a provider we touch. We therefore build the next user section from the
// CURRENT USER section (not the schema-resolved view, which would bake in
// defaults) and `update()` it as one patch.
//
// Idempotent: models that already declare efforts are left alone, and a scan
// that finds nothing to do performs no write, so the settings/updated echo of
// our own update terminates immediately.
//
// Configuration (cordis.patch.yml `config`):
//   reasoning-efforts:
//     enabled: true   # set false to stop auto-patching
//
// No settings namespace is owned by this plugin; the `llm-pi-ai` namespace is
// read + updated, never owned.

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

import z from "@deepseek-ai/schemastery";

/** Runtime schema for the reasoning-efforts row. */
const Config = z.object({
  enabled: z.boolean().default(true),
});

/** True when a model profile already declares reasoningEfforts. */
function hasEfforts(model) {
  return model !== null && typeof model === "object" && model.reasoningEfforts !== undefined;
}

/**
 * Build the next `llm-pi-ai` user section with missing reasoning declarations
 * added. Pure: returns a NEW object (or the SAME reference when nothing would
 * change), never mutates `section`.
 *
 * @param {any} section - the raw USER section (`settings.section("llm-pi-ai")`).
 * @returns {object|null} the complete next section when a change is needed,
 *   or `null` when everything already declares reasoning.
 */
export function buildPatchedSection(section) {
  if (!section || typeof section !== "object") return null;
  const providers = section.providers;
  if (!providers || typeof providers !== "object") return null;
  let changed = false;
  const nextProviders = {};
  for (const [provider, profile] of Object.entries(providers)) {
    if (!profile || typeof profile !== "object") {
      nextProviders[provider] = profile;
      continue;
    }
    const nextProfile = { ...profile };
    // Route-level default reasoning level (only when the route sets none).
    if (nextProfile.reasoning === undefined || nextProfile.reasoning === null || nextProfile.reasoning === "") {
      nextProfile.reasoning = DEFAULT_ROUTE_LEVEL;
      changed = true;
    }
    const models = nextProfile.models;
    if (Array.isArray(models)) {
      const nextModels = models.map((model) => {
        if (!model || typeof model !== "object" || hasEfforts(model)) return model;
        if (model.reasoningEfforts === false) return model; // explicitly non-reasoning
        changed = true;
        return { ...model, reasoningEfforts: { ...DEFAULT_EFFORTS } };
      });
      nextProfile.models = nextModels;
    }
    nextProviders[provider] = nextProfile;
  }
  if (!changed) return null;
  return { ...section, providers: nextProviders };
}

/**
 * Scan-and-fix pass. Reads the raw llm-pi-ai user section, builds the patched
 * section, and applies it through settings.update (schema-validated by pi-ai,
 * persisted, committed). No-op when nothing is missing.
 */
export async function reconcile(settings, logger) {
  const section = settings.section(TARGET_NS);
  const next = buildPatchedSection(section);
  if (next === null) return 0;
  try {
    await settings.update(TARGET_NS, next);
    logger?.info?.(`[reasoning-efforts] patched reasoning declarations into ${TARGET_NS}`);
    return 1;
  } catch (error) {
    // A refused write (e.g. pi-ai schema rejection) must not take the plugin
    // down; report and leave the namespace untouched.
    logger?.warn?.(`[reasoning-efforts] update failed: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/** Plugin entry. */
function apply(ctx, config) {
  const cfg = () => config;

  const settings = ctx.settings;
  if (!settings || typeof settings.update !== "function" || typeof settings.section !== "function") {
    ctx.logger.warn("[reasoning-efforts] settings service unavailable; plugin disabled");
    return;
  }

  const run = () => {
    if (cfg().enabled === false) return;
    // Defer: on first boot the target namespace may not be registered yet
    // (pi-ai plugin activation order). settings.section returns undefined
    // then; reconcile() no-ops on undefined, and the settings/updated
    // listener below re-runs the pass once llm-pi-ai appears.
    void reconcile(settings, ctx.logger);
  };

  // Re-run whenever the target namespace changes (model additions/edits, and
  // the echo of our own update — which terminates because the second scan
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
