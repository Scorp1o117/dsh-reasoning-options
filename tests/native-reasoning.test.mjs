import assert from 'node:assert/strict';
import test from 'node:test';
import { Config, buildPatchedSection, reconcile } from '../index.js';

test('native model reasoning off stays off across repeated reconciliations', async () => {
  assert.equal(Config.dict.augmentReasoning.meta.default, false);
  const user = { providers: { gateway: { baseURL: 'https://example.test/v1',
    reasoning: 'high', models: [{ id: 'm' }, { id: 'disabled', reasoningEfforts: false },
      { id: 'custom', reasoningEfforts: { low: 'custom-low' } }] } } };
  assert.equal(buildPatchedSection(user), null);
  let writes = 0;
  const settings = { describe: () => [{ ns: 'llm-pi-ai', user, revision: 1 }], update: () => { writes++; } };
  await reconcile(settings); await reconcile(settings);
  assert.equal(writes, 0);
  assert.equal(user.providers.gateway.reasoning, 'high');
});

test('gateway headers still work without injecting reasoning or changing saved levels', () => {
  const user = { providers: { go: { baseURL: 'https://opencode.ai/zen/go/v1',
    models: [{ id: 'off' }, { id: 'custom', reasoningEfforts: { high: 'custom' } }] } } };
  const next = buildPatchedSection(user);
  assert.equal(next.providers.go.headers['x-opencode-session'], 'dsh-session');
  assert.deepEqual(next.providers.go.models, user.providers.go.models);
  assert.equal(next.providers.go.reasoning, undefined);
  assert.equal(buildPatchedSection(next), null);
});

test('explicit augmentation preserves disabled and custom models and route defaults', () => {
  const user = { providers: { gateway: { models: [{ id: 'm' },
    { id: 'off', reasoningEfforts: false }, { id: 'custom', reasoningEfforts: { high: 'custom' } }] } } };
  const next = buildPatchedSection(user, { augmentReasoning: true });
  assert.equal(next.providers.gateway.models[0].reasoningEfforts.high, 'high');
  assert.deepEqual(next.providers.gateway.models.slice(1), user.providers.gateway.models.slice(1));
  assert.equal(next.providers.gateway.reasoning, undefined);
});
