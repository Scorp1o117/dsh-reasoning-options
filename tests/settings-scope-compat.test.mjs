import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');

test('manifest records verified DSH latest and next without claiming alpha', () => {
  const compatibility = manifest.dsh.compatibility;
  assert.equal(compatibility.dshReleases['0.1.5-rc.2'], 'compatible');
  assert.equal(compatibility.dshReleases['0.1.5-rc.3'], 'compatible');
  for (const version of ['0.1.6-alpha.1', '0.1.6-alpha.2', '0.1.7-alpha.1']) {
    assert.equal(compatibility.dshReleases[version], 'unknown');
  }
  assert.equal(compatibility.node, manifest.engines.node);
  assert.deepEqual(compatibility.profiles, ['web']);
});

test('peer deps cover dsh rc.7 through next without rc.6', () => {
  for (const [name, range] of Object.entries(manifest.peerDependencies)) {
    if (!name.startsWith('@deepseek-ai/')) continue;
    assert.match(range, /\^0\.1\.0-rc\.7/);
    assert.match(range, /\^0\.1\.1-rc\.1/);
    assert.doesNotMatch(range, /rc\.6/);
  }
});

test('index.js does not import removed dsh-settings module exports', () => {
  assert.doesNotMatch(source, /import\s*\{[^}]*installSettingsSection/);
  assert.doesNotMatch(source, /from "@deepseek-ai\/dsh-settings"/);
  // NS is a plain string (new namespace validation), not a branded factory.
  assert.match(source, /const NS = "reasoning-efforts"/);
});

test('target namespace + default level constants present', () => {
  assert.match(source, /const TARGET_NS = "llm-pi-ai"/);
  assert.match(source, /const DEFAULT_ROUTE_LEVEL = "high"/);
  for (const level of ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']) {
    assert.ok(source.includes(`"${level}"`) || source.includes(`${level}:`), `mentions level ${level}`);
  }
});
