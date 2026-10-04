import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../client.js', import.meta.url), 'utf8');
function mount(accepted) {
  let bundle, page, cursor = 0;
  const states = [], writes = [];
  let snapshot = { status: 'ready', writable: true, revision: 3,
    value: { enabled: true, autoSessionHeader: true, sessionHeaderValue: 'dsh-session', pollIntervalMs: 30000 } };
  const scope = {
    getSnapshot: () => snapshot, subscribe: () => () => {},
    async mutate(ops, revision) {
      writes.push({ ops: JSON.parse(JSON.stringify(ops)), revision });
      if (accepted) snapshot = { ...snapshot, revision: 4,
        value: { ...snapshot.value, ...Object.fromEntries(ops.map(op => [op.path[0], op.value])) } };
      return accepted;
    }
  };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat() }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    }, useEffect() {}
  };
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { bundle = value; } } } });
  bundle.factory(() => react).apply({ locale: { bind: () => key => key, register: () => () => {} },
    effect: fn => fn(), configForms: { get: () => scope },
    slots: { inject: (_name, fn) => fn(), register(_options, render) { page = render; return () => {}; } } });
  const element = page({ view: 'page' });
  return { render() { cursor = 0; return element.type(element.props); }, writes, snapshot: () => snapshot };
}
function find(tree, predicate) {
  if (tree && typeof tree === 'object' && predicate(tree)) return tree;
  for (const child of tree?.children ?? []) { const result = find(child, predicate); if (result) return result; }
}
const input = (tree, key) => find(find(tree, node => node.props.key === key), node => node.type === 'input');
const save = tree => find(tree, node => node.type === 'button');
const settle = () => new Promise(resolve => setImmediate(resolve));

test('reasoning form saves edited fields atomically with the observed revision', async () => {
  const ui = mount(true);
  input(ui.render(), 'enabled').props.onChange({ target: { checked: false } });
  input(ui.render(), 'pollIntervalMs').props.onChange({ target: { value: '45000' } });
  save(ui.render()).props.onClick(); await settle();
  assert.equal(ui.writes.length, 1); assert.equal(ui.writes[0].revision, 3);
  assert.deepEqual(ui.writes[0].ops, [
    { op: 'set', path: ['enabled'], value: false }, { op: 'set', path: ['pollIntervalMs'], value: 45000 }
  ]);
  assert.equal(ui.snapshot().value.enabled, false);
  assert.equal(ui.snapshot().value.sessionHeaderValue, 'dsh-session');
  assert.ok(find(ui.render(), node => node.props.role === 'status'));
  assert.equal(save(ui.render()).props.disabled, true, 'accepted draft is cleared');
});

test('a refused reasoning write keeps edits and shows an error instead of success', async () => {
  const ui = mount(false);
  input(ui.render(), 'sessionHeaderValue').props.onChange({ target: { value: 'new-session' } });
  save(ui.render()).props.onClick(); await settle();
  assert.equal(input(ui.render(), 'sessionHeaderValue').props.value, 'new-session');
  assert.equal(ui.snapshot().value.sessionHeaderValue, 'dsh-session');
  assert.ok(find(ui.render(), node => node.props.role === 'alert'));
  assert.equal(find(ui.render(), node => node.props.role === 'status'), undefined);
  assert.equal(save(ui.render()).props.disabled, false);
});

test('only the main switch is outside the collapsed advanced settings', () => {
  const ui = mount(true);
  const tree = ui.render();
  const advanced = find(tree, node => node.type === 'details');
  assert.ok(advanced);
  assert.equal(advanced.props.open, undefined);
  assert.equal(input(advanced, 'enabled'), undefined);
  assert.ok(input(advanced, 'sessionHeaderValue'));
  assert.ok(input(tree, 'enabled'));
});
