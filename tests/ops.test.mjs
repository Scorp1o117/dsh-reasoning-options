// temp: exercise computeOps against a representative llm-pi-ai resolved shape
import { computeOps } from '../index.js'

// Mirrors what ctx.settings.get("llm-pi-ai") returns after pi-ai's schema
// resolves the user section (models with defaults materialized).
const resolved = {
  providers: {
    opencodego: {
      displayName: 'OpenCodeGO',
      api: 'openai-responses',
      baseURL: 'https://opencode.ai/zen/go/v1',
      // no route reasoning -> plugin should set default high
      models: [
        { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', contextWindow: 1000000, maxTokens: 256000 }, // no efforts
        { id: 'mimo-v2.5', name: 'mimo-v2.5', reasoningEfforts: { off: null, low: 'low', high: 'high' } }, // already has -> skip
        { id: 'qwen3.8-flash', name: 'qwen3.8-flash', reasoningEfforts: false }, // explicit non-reasoning -> skip
      ],
    },
    commandcode: {
      api: 'openai-completions',
      baseURL: 'https://api.commandcode.ai/provider/v1',
      reasoning: 'low', // already has default -> keep
      models: [
        { id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash' },
      ],
    },
  },
}

const ops = computeOps(resolved)
console.log('ops:')
for (const op of ops) console.log(' ', JSON.stringify(op))
const expected = [
  { op: 'set', path: ['providers', 'opencodego', 'reasoning'], value: 'high' },
  { op: 'set', path: ['providers', 'opencodego', 'models', '0', 'reasoningEfforts'], value: { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' } },
  { op: 'set', path: ['providers', 'commandcode', 'models', '0', 'reasoningEfforts'], value: { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' } },
]
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b) }
let ok = true
if (ops.length !== expected.length) { console.log(`FAIL: expected ${expected.length} ops, got ${ops.length}`); ok = false }
else for (let i = 0; i < ops.length; i++) { if (!same(ops[i], expected[i])) { console.log(`FAIL op ${i}:`, JSON.stringify(ops[i]), '!=', JSON.stringify(expected[i])); ok = false } }
// Idempotence: running again on already-patched output yields zero ops
const patched = { providers: {} }
for (const [p, prof] of Object.entries(resolved.providers)) {
  patched.providers[p] = { ...prof, reasoning: prof.reasoning ?? 'high', models: prof.models.map((m) => m.reasoningEfforts !== undefined ? m : { ...m, reasoningEfforts: { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' } }) }
}
const again = computeOps(patched)
if (again.length !== 0) { console.log(`FAIL: second pass not idempotent, got ${again.length} ops`); ok = false }
console.log(ok ? 'ALL PASS' : 'FAILURES PRESENT')
process.exit(ok ? 0 : 1)
