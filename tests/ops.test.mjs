// exercise buildPatchedSection against a representative llm-pi-ai user section
import assert from 'node:assert/strict'
import { buildPatchedSection } from '../index.js'

// Mirrors what settings.section('llm-pi-ai') returns: ONLY what the user
// wrote (no schema-default materialization).
const section = {
  providers: {
    opencodego: {
      displayName: 'OpenCodeGO',
      api: 'openai-responses',
      baseURL: 'https://opencode.ai/zen/go/v1',
      // no route reasoning -> plugin should add default high
      models: [
        { id: 'deepseek-v4-flash', name: 'deepseek-v4-flash', contextWindow: 1000000, maxTokens: 256000 }, // no efforts -> add
        { id: 'mimo-v2.5', name: 'mimo-v2.5', reasoningEfforts: { off: null, low: 'low', high: 'high' } }, // already has -> untouched
        { id: 'qwen3.8-flash', name: 'qwen3.8-flash', reasoningEfforts: false }, // explicit non-reasoning -> untouched
      ],
    },
    commandcode: {
      api: 'openai-completions',
      baseURL: 'https://api.commandcode.ai/provider/v1',
      reasoning: 'low', // already has default -> keep
      models: [{ id: 'deepseek/deepseek-v4-flash', name: 'DeepSeek V4 Flash' }],
    },
  },
}

const FULL = { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' }

const next = buildPatchedSection(section)
assert.ok(next !== null, 'a patch should be produced')
assert.ok(next !== section, 'should not mutate the input reference')
assert.equal(next.providers.opencodego.reasoning, 'high', 'route default high added')
assert.deepEqual(next.providers.opencodego.headers, { 'x-opencode-session': 'dsh-session' }, 'auto-injects x-opencode-session for opencode.ai')
assert.deepEqual(next.providers.opencodego.models[0].reasoningEfforts, FULL, 'model 0 gets full efforts')
assert.deepEqual(next.providers.opencodego.models[1], section.providers.opencodego.models[1], 'model 1 untouched')
assert.equal(next.providers.opencodego.models[1].reasoningEfforts.low, 'low', 'existing efforts preserved')
assert.equal(next.providers.opencodego.models[2].reasoningEfforts, false, 'explicit false untouched')
assert.equal(next.providers.commandcode.reasoning, 'low', 'existing route default preserved')
assert.equal(next.providers.commandcode.headers, undefined, 'non-opencode provider does not get session header')
assert.deepEqual(next.providers.commandcode.models[0].reasoningEfforts, FULL, 'commandcode model gets efforts')
assert.equal(next.providers.opencodego.displayName, 'OpenCodeGO', 'sibling fields preserved')

// unchanged input -> null (idempotent second pass)
assert.equal(buildPatchedSection(next), null, 'second pass is a no-op')

// test existing custom session header is preserved
const sectionWithCustomHeader = {
  providers: {
    opencodego: {
      baseURL: 'https://opencode.ai/zen/go/v1',
      headers: { 'x-opencode-session': 'my-custom-id', other: 'val' },
    },
  },
}
const nextCustom = buildPatchedSection(sectionWithCustomHeader)
assert.equal(nextCustom.providers.opencodego.headers['x-opencode-session'], 'my-custom-id', 'existing session header preserved')
assert.equal(nextCustom.providers.opencodego.headers.other, 'val', 'existing sibling headers preserved')

// test case-insensitive existing header detection
const sectionWithCaseVariant = {
  providers: {
    opencodego: {
      baseURL: 'https://opencode.ai/zen/go/v1',
      headers: { 'X-OpenCode-Session': 'case-test' },
      reasoning: 'high',
    },
  },
}
assert.equal(buildPatchedSection(sectionWithCaseVariant), null, 'case-insensitive existing header detected, no patch needed')

// test autoSessionHeader = false
const sectionDisabled = {
  providers: {
    opencodego: {
      baseURL: 'https://opencode.ai/zen/go/v1',
      reasoning: 'high',
    },
  },
}
assert.equal(buildPatchedSection(sectionDisabled, { autoSessionHeader: false }), null, 'autoSessionHeader: false suppresses header injection')

// test custom sessionHeaderValue
const sectionCustomVal = {
  providers: {
    opencodego: {
      baseURL: 'https://opencode.ai/zen/go/v1',
      reasoning: 'high',
    },
  },
}
const nextCustomVal = buildPatchedSection(sectionCustomVal, { sessionHeaderValue: 'custom-prefix-123' })
assert.deepEqual(nextCustomVal.providers.opencodego.headers, { 'x-opencode-session': 'custom-prefix-123' }, 'custom sessionHeaderValue respected')

console.log('ALL PASS')
