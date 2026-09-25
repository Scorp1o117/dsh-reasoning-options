// The write must leave the transaction that flagged it, and a namespace that
// moved underneath a pass must be re-read rather than overwritten.
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import test from 'node:test';
import { apply, createScheduler, reconcile } from '../index.js'

const FULL = { off: null, minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sectionWith = (id) => ({ providers: { opencodego: { baseURL: 'https://opencode.ai/zen/go/v1', reasoning: 'high', models: [{ id, contextWindow: 1000 }] } } })

test('a flagged pass runs outside the transaction that flagged it', async () => {
  const transaction = new AsyncLocalStorage()
  let seen = 'never ran'
  const scheduler = createScheduler(() => { seen = transaction.getStore(); return 0 }, { tickMs: 1, pollMs: 0 })
  try {
    await transaction.run('hmr-transaction', async () => {
      scheduler.request()
      await sleep(30) // the tick fires while the transaction is still open
      assert.equal(seen, undefined, 'the pass must not inherit the writer transaction')
    })
  } finally {
    scheduler.dispose()
  }
})

test('passes are serialized and a request during a pass earns a follow-up', async () => {
  let live = 0
  let peak = 0
  let runs = 0
  const scheduler = createScheduler(async () => {
    live += 1
    peak = Math.max(peak, live)
    await sleep(10)
    runs += 1
    if (runs === 1) scheduler.request() // a trigger that lands mid-pass must not be lost
    live -= 1
  }, { tickMs: 1, pollMs: 0 })
  try {
    await sleep(60)
    assert.equal(peak, 1, 'never two passes at once')
    assert.ok(runs >= 2, `the mid-pass request re-ran the pass (got ${runs})`)
  } finally {
    scheduler.dispose()
  }
})

test('the poll rescans without any trigger, and dispose stops it', async () => {
  let runs = 0
  const scheduler = createScheduler(() => { runs += 1 }, { tickMs: 1, pollMs: 10 })
  await sleep(45)
  scheduler.dispose()
  const settled = runs
  assert.ok(settled >= 2, `pollMs forces repeated passes (got ${settled})`)
  await sleep(30)
  assert.equal(runs, settled, 'dispose() stops the schedule')
})

test('pollMs 0 keeps only the initial pass', async () => {
  let runs = 0
  const scheduler = createScheduler(() => { runs += 1 }, { tickMs: 1, pollMs: 0 })
  try {
    await sleep(40)
    assert.equal(runs, 1, 'one initial pass, no polling')
  } finally {
    scheduler.dispose()
  }
})

test('apply() keeps polling until its effect is disposed', async () => {
  // Cordis runs the callback passed to ctx.effect() immediately and disposes
  // whatever it RETURNS; returning nothing would clear the timer on the spot
  // and the plugin would silently stop scanning.
  const disposers = []
  let scans = 0
  const ctx = {
    settings: {
      describe: () => { scans += 1; return [] },
      update: async () => {},
    },
    logger: { warn: () => {}, info: () => {} },
    on: () => {},
    effect: (fn) => { disposers.push(fn()) },
  }
  apply(ctx, { enabled: true, pollIntervalMs: 100 })
  assert.equal(disposers.length, 1, 'one effect registered')
  assert.equal(typeof disposers[0], 'function', 'the effect returns its disposer')
  await sleep(2500)
  assert.ok(scans >= 2, `the schedule keeps scanning (got ${scans})`)
  disposers[0]()
  const settled = scans
  await sleep(1500)
  assert.equal(scans, settled, 'the disposer stops the schedule')
})

test('a write carries the revision it was planned from', async () => {
  let sent
  const settings = {
    describe: () => [{ ns: 'llm-pi-ai', revision: 7, user: sectionWith('mimo-v2.6-pro') }],
    update: async (ns, patch, revision) => { sent = { ns, patch, revision } },
  }
  assert.equal(await reconcile(settings, null), 1)
  assert.equal(sent.revision, 7, 'optimistic concurrency token passed through')
  assert.deepEqual(sent.patch.providers.opencodego.models[0].reasoningEfforts, FULL)
})

test('a namespace that moved mid-pass is re-read, not overwritten', async () => {
  // The pass plans from a section holding one model; by the time it writes, the
  // Web UI has saved a second model. A blind write would drop that model.
  let calls = 0
  const writes = []
  const settings = {
    describe: () => [{ ns: 'llm-pi-ai', revision: calls, user: sectionWith(calls === 0 ? 'mimo-v2.6-pro' : 'qwen3.8-flash') }],
    update: async (ns, patch, revision) => {
      calls += 1
      writes.push({ patch, revision })
      const conflict = new Error('settings namespace "llm-pi-ai" changed since it was read')
      conflict.name = 'SettingsConflictError'
      conflict.code = 'SETTINGS_CONFLICT'
      if (calls < 2) throw conflict
    },
  }
  assert.equal(await reconcile(settings, null), 1)
  assert.equal(writes.length, 2, 'conflict retried once with a fresh read')
  assert.equal(writes[0].revision, 0)
  assert.equal(writes[1].revision, 1, 'retry plans from the moved namespace')
  assert.equal(writes[1].patch.providers.opencodego.models[0].id, 'qwen3.8-flash', 'retry restates the current models')
})

test('a refused write is reported once and does not loop', async () => {
  const warnings = []
  let calls = 0
  const settings = {
    describe: () => [{ ns: 'llm-pi-ai', revision: 1, user: sectionWith('mimo-v2.6-pro') }],
    update: async () => { calls += 1; throw new Error('llm-pi-ai: provider "opencodego" cannot be served') },
  }
  const logger = { warn: (message) => warnings.push(message), info: () => {} }
  assert.equal(await reconcile(settings, logger), 0)
  assert.equal(calls, 1, 'no retry on a schema refusal')
  assert.match(warnings[0], /cannot be served/, 'refusal surfaced')
})

test('a missing target namespace is a silent no-op', async () => {
  let calls = 0
  const settings = { describe: () => [], update: async () => { calls += 1 } }
  assert.equal(await reconcile(settings, null), 0)
  assert.equal(calls, 0, 'nothing to read, nothing written')
})
