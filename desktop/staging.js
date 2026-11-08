'use strict';

// Large saves move through the preload bridge in several smaller messages. One bridge call carrying a couple of
// hundred megabytes (a long dynasty's whole archive, as on the first save of an imported or migrated save) takes
// many minutes, while the same rows in messages of a few megabytes take seconds. The renderer sends the archive
// rows first as `save({stage: 'add', ...})` messages, which are held here in memory only, and then makes the one
// save that uses them. A save is still all or nothing: staging writes nothing to disk, and an abandoned stage is
// dropped after a while. The bridge's exposed keys do not change; staging is a payload of the existing `save`.
const KINDS = ['additions', 'gameAdditions'];
const MAX_ROWS = 2000000;
const TTL_MS = 10 * 60 * 1000;
const MAX_BATCH_ROWS = 20000;

function createStagingArea({now = () => Date.now(), makeToken} = {}) {
  if (typeof makeToken !== 'function') throw new Error('A staging area needs a token generator.');
  const areas = new Map();

  function prune() {
    for (const [token, area] of areas) if (now() - area.touched > TTL_MS) areas.delete(token);
  }
  function find(token) {
    if (typeof token !== 'string' || !areas.has(token)) throw new Error('That staged save is no longer available. Save again.');
    return areas.get(token);
  }

  return {
    begin() {
      prune();
      const token = makeToken();
      areas.set(token, {additions: [], gameAdditions: [], core: new Map(), rows: 0, touched: now()});
      return {token};
    },
    add({token, kind, rows} = {}) {
      const area = find(token);
      if (!KINDS.includes(kind)) throw new Error('Unknown staged rows.');
      if (!Array.isArray(rows) || rows.length > MAX_BATCH_ROWS) throw new Error('Staged rows must be an array of reasonable size.');
      if (area.rows + rows.length > MAX_ROWS) { areas.delete(token); throw new Error('This save has too many archive rows to stage.'); }
      for (const row of rows) area[kind].push(row);
      area.rows += rows.length;
      area.touched = now();
      return {rows: area.rows};
    },
    // A piece of the core universe: part of an array (`array`) or a whole value (`value`) under a top-level key.
    addCore({token, key, array, value} = {}) {
      const area = find(token);
      if (typeof key !== 'string' || !key || key === '__proto__') throw new Error('Unknown staged core key.');
      if (array !== undefined) {
        if (!Array.isArray(array) || array.length > MAX_BATCH_ROWS) throw new Error('Staged core rows must be an array of reasonable size.');
        const target = area.core.get(key);
        if (target !== undefined && !Array.isArray(target)) throw new Error('A staged core key cannot be both a value and an array.');
        const list = target || [];
        for (const row of array) list.push(row);
        area.core.set(key, list);
      } else {
        if (area.core.has(key)) throw new Error('A staged core value was sent twice.');
        area.core.set(key, value);
      }
      if (area.core.size > 1000) { areas.delete(token); throw new Error('This save has too many core sections to stage.'); }
      area.touched = now();
      return {keys: area.core.size};
    },
    // The save uses the rows once and the stage is gone, whether or not that save succeeds.
    take(token) {
      const area = find(token);
      areas.delete(token);
      return {additions: area.additions, gameAdditions: area.gameAdditions, core: area.core};
    },
    discard(token) { areas.delete(token); },
    size() { prune(); return areas.size; },
  };
}

// The core universe arrives partly in the save message (small sections) and partly staged (large ones). Rebuilt in the
// order the renderer listed, so the stored core is the same as if it had been sent whole.
function assembleUniverse(remainder, staged, keys) {
  const universe = {}, has = (object, key) => object && Object.prototype.hasOwnProperty.call(object, key);
  for (const key of keys) {
    if (typeof key !== 'string' || key === '__proto__') throw new Error('Unknown staged core key.');
    if (staged.has(key)) universe[key] = staged.get(key);
    else if (has(remainder, key)) universe[key] = remainder[key];
  }
  return universe;
}

// The one place the save channel is interpreted: a staging step, a save that uses staged rows, or a plain save.
async function routeSave(store, staging, payload) {
  if (payload && payload.stage !== undefined) {
    if (payload.stage === 'begin') return staging.begin();
    if (payload.stage === 'add') return staging.add(payload);
    if (payload.stage === 'core') return staging.addCore(payload);
    if (payload.stage === 'discard') { staging.discard(payload.token); return {}; }
    throw new Error('Unknown staged save step.');
  }
  const options = payload && payload.options;
  if (options && options.stagedToken !== undefined) {
    const {stagedToken, universeKeys, ...rest} = options;
    const taken = staging.take(stagedToken);
    let snapshot = payload.snapshot;
    if (Array.isArray(universeKeys)) snapshot = {...snapshot, universe: assembleUniverse(snapshot && snapshot.universe, taken.core, universeKeys)};
    return store.save({...payload, snapshot, options: {...rest, additions: taken.additions, gameAdditions: taken.gameAdditions}});
  }
  return store.save(payload);
}

module.exports = {assembleUniverse, routeSave, createStagingArea, KINDS, MAX_ROWS, TTL_MS, MAX_BATCH_ROWS};
