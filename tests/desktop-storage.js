'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {test, beforeEach, afterEach} = require('node:test');
const {IDBFactory} = require('fake-indexeddb');
const {createDesktopStorage, SLOT_DIRS} = require('../desktop/storage.js');

let root;
let store;

const rows = (prefix, count) => Array.from({length: count}, (_, i) => ({id: `${prefix}-${i}`, name: `${prefix} ${i}`}));
const snapshot = (year = 2028, name = 'Chicago Metropolitan') => ({
  version: '0.11.9', savedAt: '2026-09-08T00:00:00.000Z', userTeam: name,
  universe: {year, week: 2, phase: 'regular', teams: [{id: 1, name, w: 3, l: 1}], recruits: [], schedule: []},
});

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'dynasty-lab-desktop-storage-'));
  store = createDesktopStorage({rootDir: root});
});

afterEach(async () => {
  await fs.rm(root, {recursive: true, force: true});
});

test('fresh slots list, rename, save, and load without exposing filesystem paths', async () => {
  let listed = await store.listSlots();
  assert.deepEqual(listed.map(row => row.slot), ['main', 'dynasty-2', 'dynasty-3']);
  assert.ok(listed.every(row => row.empty));
  const renamed = await store.rename({slot: 'dynasty-2', label: '  Rebuild   Career '});
  assert.equal(renamed.label, 'Rebuild Career');
  const saved = await store.save({slot: 'dynasty-2', snapshot: snapshot(2034, 'Great Lakes University'), options: {
    additions: rows('career', 3), gameAdditions: rows('game', 2), checkpointType: 'week',
  }});
  assert.ok(saved.revision);
  const loaded = await store.load({slot: 'dynasty-2'});
  assert.equal(loaded.universe.year, 2034);
  assert.equal(loaded.storageVersion, 3);
  listed = await store.listSlots();
  assert.equal(listed.find(row => row.slot === 'dynasty-2').label, 'Rebuild Career');
  assert.equal(listed.find(row => row.slot === 'dynasty-2').program, 'Great Lakes University');
  assert.equal(listed.find(row => row.slot === 'dynasty-2').checkpointType, 'week');
  assert.equal(Object.values(SLOT_DIRS).some(name => name.includes('..')), false);
});

test('lazy archive and game reads append without rewriting prior chunks', async () => {
  const first = await store.save({slot: 'main', snapshot: snapshot(), options: {
    additions: rows('career', 130), gameAdditions: rows('game', 129),
  }});
  assert.equal(first.archiveRef.chunks, 2);
  assert.equal(first.gameRef.chunks, 2);
  const second = await store.save({slot: 'main', snapshot: snapshot(2029), options: {
    expectedRevision: first.revision, archiveRef: first.archiveRef, gameRef: first.gameRef,
    additions: rows('career-next', 1), gameAdditions: rows('game-next', 1),
  }});
  assert.equal(second.archiveRef.id, first.archiveRef.id);
  assert.equal(second.archiveRef.chunks, 3);
  assert.equal((await store.readArchive({slot: 'main', ref: second.archiveRef})).length, 131);
  assert.equal((await store.readGames({slot: 'main', ref: second.gameRef})).length, 130);
  const history = path.join(root, 'Dynasty 1', 'history', first.archiveRef.id);
  const before = await fs.stat(path.join(history, '00000000.json'));
  assert.equal((await fs.readdir(history)).length, 3);
  assert.equal((await fs.stat(path.join(history, '00000000.json'))).mtimeMs, before.mtimeMs);
});

test('replacement isolates slot history and rejects obsolete lazy references', async () => {
  const old = await store.save({slot: 'main', snapshot: snapshot(), options: {additions: rows('old', 2)}});
  const fresh = await store.save({slot: 'main', snapshot: snapshot(2035), options: {additions: rows('fresh', 1)}});
  await store.save({slot: 'dynasty-2', snapshot: snapshot(2030, 'Great Lakes University'), options: {additions: rows('other', 2)}});
  assert.deepEqual((await store.readArchive({slot: 'main', ref: fresh.archiveRef})).map(row => row.id), ['fresh-0']);
  await assert.rejects(() => store.readArchive({slot: 'main', ref: old.archiveRef}), /replaced/i);
  const second = await store.load({slot: 'dynasty-2'});
  assert.deepEqual((await store.readArchive({slot: 'dynasty-2', ref: second.archiveRef})).map(row => row.id), ['other-0', 'other-1']);
});

test('stale revision is rejected and the last complete revision remains loadable', async () => {
  const first = await store.save({slot: 'main', snapshot: snapshot(), options: {additions: rows('first', 1)}});
  const second = await store.save({slot: 'main', snapshot: snapshot(2029), options: {
    expectedRevision: first.revision, archiveRef: first.archiveRef, additions: rows('second', 1),
  }});
  await assert.rejects(() => store.save({slot: 'main', snapshot: snapshot(9999), options: {
    expectedRevision: first.revision, archiveRef: first.archiveRef,
  }}), /another desktop save/i);
  assert.equal((await store.load({slot: 'main'})).universe.year, 2029);
  assert.equal((await store.readArchive({slot: 'main', ref: second.archiveRef})).length, 2);
});

test('a corrupt current dynasty recovers the newest valid backup', async () => {
  const first = await store.save({slot: 'main', snapshot: snapshot(2028), options: {additions: rows('first', 1)}});
  await store.save({slot: 'main', snapshot: snapshot(2029), options: {expectedRevision: first.revision, archiveRef: first.archiveRef}});
  const dynasty = path.join(root, 'Dynasty 1', 'dynasty.json');
  await fs.writeFile(dynasty, '{not-json', 'utf8');
  const recovered = await store.load({slot: 'main'});
  assert.equal(recovered.universe.year, 2028);
  assert.deepEqual((await store.readArchive({slot: 'main', ref: first.archiveRef})).map(row => row.id), ['first-0']);
  assert.doesNotReject(() => fs.readFile(dynasty, 'utf8').then(JSON.parse));
});

test('rolling backups retain only the five most recent committed wrappers', async () => {
  let prior = null;
  for (let year = 2028; year < 2035; year++) {
    const saved = await store.save({slot: 'main', snapshot: snapshot(year), options: {
      ...(prior ? {expectedRevision: prior.revision, archiveRef: prior.archiveRef} : {}),
    }});
    prior = saved;
  }
  const backups = await fs.readdir(path.join(root, 'Dynasty 1', 'backups'));
  assert.equal(backups.filter(name => name.endsWith('.json')).length, 5);
});

test('missing chunks fail closed instead of silently dropping history', async () => {
  const saved = await store.save({slot: 'main', snapshot: snapshot(), options: {additions: rows('missing', 130)}});
  const chunk = path.join(root, 'Dynasty 1', 'history', saved.archiveRef.id, '00000000.json');
  await fs.unlink(chunk);
  await assert.rejects(() => store.readArchive({slot: 'main', ref: saved.archiveRef}), /missing or damaged/i);
});

test('an interrupted commit can retry over its uncommitted chunk files', async () => {
  const base = await store.save({slot: 'main', snapshot: snapshot(), options: {
    additions: rows('base-career', 1), gameAdditions: rows('base-game', 1),
  }});
  let failCommit = true;
  const faultFs = {...fs, rename: async (from, to) => {
    if (failCommit && to.endsWith(`${path.sep}dynasty.json`)) {
      failCommit = false;
      const error = new Error('simulated interruption before commit');
      error.code = 'EIO';
      throw error;
    }
    return fs.rename(from, to);
  }};
  const interrupted = createDesktopStorage({rootDir: root, fsModule: faultFs});
  const payload = {slot: 'main', snapshot: snapshot(2029), options: {
    expectedRevision: base.revision, archiveRef: base.archiveRef, gameRef: base.gameRef,
    additions: rows('retry-career', 2), gameAdditions: rows('retry-game', 1),
  }};
  await assert.rejects(() => interrupted.save(payload), /simulated interruption/);
  const retried = await interrupted.save(payload);
  assert.deepEqual((await interrupted.readArchive({slot: 'main', ref: retried.archiveRef})).map(row => row.id),
    ['base-career-0', 'retry-career-0', 'retry-career-1']);
  assert.deepEqual((await interrupted.readGames({slot: 'main', ref: retried.gameRef})).map(row => row.id),
    ['base-game-0', 'retry-game-0']);
});

test('one corrupt native slot does not block healthy slots from listing', async () => {
  await store.save({slot: 'main', snapshot: snapshot(), options: {additions: rows('healthy', 1)}});
  await store.save({slot: 'dynasty-2', snapshot: snapshot(2030, 'Great Lakes University')});
  await fs.writeFile(path.join(root, 'Dynasty 2', 'dynasty.json'), '{damaged', 'utf8');
  const listed = await store.listSlots();
  assert.equal(listed.find(row => row.slot === 'main').program, 'Chicago Metropolitan');
  const damaged = listed.find(row => row.slot === 'dynasty-2');
  assert.match(damaged.storageError, /damaged/i);
  assert.equal(damaged.empty, false, 'damaged slot cannot be mistaken for an empty replacement target');
  assert.equal(listed.find(row => row.slot === 'dynasty-3').empty, true);
});

test('a missing occupied save cannot be mistaken for an empty replacement slot', async () => {
  await store.save({slot: 'main', snapshot: snapshot()});
  const slotDir = path.join(root, 'Dynasty 1');
  await fs.unlink(path.join(slotDir, 'dynasty.json'));

  const listed = await store.listSlots();
  const damaged = listed.find(row => row.slot === 'main');
  assert.equal(damaged.empty, false);
  assert.match(damaged.storageError, /damaged/i);
  assert.equal(damaged.label, 'Dynasty 1');
});

// Soak defect D2: every new game-archive generation (the season compaction rewrite) used to stay
// on disk after the save stopped referencing it. Generations a retained backup still needs stay.
test('replaced archive generations are pruned once no committed save or backup references them', async () => {
  const gameDirs = () => fs.readdir(path.join(root, 'Dynasty 1', 'games'));
  const first = await store.save({slot: 'main', snapshot: snapshot(2028), options: {
    additions: rows('career', 2), gameAdditions: rows('season-2028', 3),
  }});
  let prior = first;
  const generations = [first.gameRef.id];
  // Seven compaction-style saves: each starts a new game generation (no gameRef passed).
  for (let year = 2029; year < 2036; year++) {
    prior = await store.save({slot: 'main', snapshot: snapshot(year), options: {
      expectedRevision: prior.revision, archiveRef: prior.archiveRef,
      gameAdditions: rows(`season-${year}`, 3),
    }});
    generations.push(prior.gameRef.id);
  }
  const kept = await gameDirs();
  // The committed generation plus the five generations the rolling backups point at.
  assert.deepEqual(new Set(kept), new Set(generations.slice(-6)));
  assert.ok(!kept.includes(first.gameRef.id), 'the oldest generation is gone');
  assert.deepEqual((await fs.readdir(path.join(root, 'Dynasty 1', 'history'))), [first.archiveRef.id],
    'the append-only career archive keeps its single generation');
  assert.deepEqual((await store.readGames({slot: 'main', ref: prior.gameRef})).map(row => row.id),
    ['season-2035-0', 'season-2035-1', 'season-2035-2']);
  // Recovery still works: corrupt the current save, and the newest backup's generation is intact.
  await fs.writeFile(path.join(root, 'Dynasty 1', 'dynasty.json'), '{not-json', 'utf8');
  const recovered = await store.load({slot: 'main'});
  assert.equal(recovered.universe.year, 2034);
  assert.deepEqual((await store.readGames({slot: 'main', ref: recovered.gameRef})).map(row => row.id),
    ['season-2034-0', 'season-2034-1', 'season-2034-2']);
});

test('backups written before refs were named still protect their generations', async () => {
  const first = await store.save({slot: 'main', snapshot: snapshot(2028), options: {gameAdditions: rows('old', 2)}});
  const second = await store.save({slot: 'main', snapshot: snapshot(2029), options: {
    expectedRevision: first.revision, archiveRef: first.archiveRef, gameAdditions: rows('new', 2),
  }});
  // Rename the backup to the legacy pattern and leave a true orphan from an abandoned attempt.
  const backups = path.join(root, 'Dynasty 1', 'backups');
  const [named] = await fs.readdir(backups);
  await fs.rename(path.join(backups, named), path.join(backups, named.replace(/\.g-.*$/, '.json')));
  await fs.mkdir(path.join(root, 'Dynasty 1', 'games', 'abandoned'), {recursive: true});
  await fs.writeFile(path.join(root, 'Dynasty 1', 'games', 'abandoned', '00000000.json'), '[]');
  await store.save({slot: 'main', snapshot: snapshot(2030), options: {
    expectedRevision: second.revision, archiveRef: second.archiveRef, gameRef: second.gameRef,
  }});
  const kept = new Set(await fs.readdir(path.join(root, 'Dynasty 1', 'games')));
  assert.ok(kept.has(first.gameRef.id), 'the legacy backup generation is retained');
  assert.ok(kept.has(second.gameRef.id), 'the committed generation is retained');
  assert.ok(!kept.has('abandoned'), 'the unreferenced orphan is removed');
});

// Soak defect D3: an oversized save is valid JSON; the message must say what is actually wrong.
test('an oversized save is reported as too large, not as invalid JSON', async () => {
  const big = snapshot();
  big.universe.padding = 'x'.repeat(256 * 1024 * 1024 + 16);
  await assert.rejects(() => store.save({slot: 'main', snapshot: big}), error => {
    assert.match(error.message, /256 MB desktop save limit/);
    assert.doesNotMatch(error.message, /not valid JSON/);
    return true;
  });
});

test('invalid slots, labels, refs, and renderer paths are rejected', async () => {
  await assert.rejects(() => store.load({slot: '../Dynasty 1'}), /Invalid save slot/);
  await assert.rejects(() => store.load({slot: 'main/../../elsewhere'}), /Invalid save slot/);
  await assert.rejects(() => store.rename({slot: 'main', label: ''}), /1–40/);
  await assert.rejects(() => store.rename({slot: 'main', label: 'x'.repeat(41)}), /1–40/);
  await assert.rejects(() => store.readArchive({slot: 'main', ref: {id: '../escape', count: 1, chunks: 1}}), /Invalid archive/);
  await assert.rejects(() => store.readArchive({slot: 'main', ref: {id: 'huge', count: 524289, chunks: 1}}), /Invalid archive/);
  await assert.rejects(() => store.save({slot: 'main', snapshot: snapshot(), options: {additions: [null]}}), /Invalid additions/);
  await assert.rejects(() => store.save({slot: 'main', snapshot: snapshot(), options: {gameAdditions: [{}]}}), /Archived games/);
  await assert.rejects(() => store.save({slot: 'main', snapshot: snapshot(), options: {checkpointType: {raw: true}}}), /checkpoint type/);
});

test('per-slot serialization rejects one of two stale concurrent appends', async () => {
  const initial = await store.save({slot: 'main', snapshot: snapshot(), options: {additions: rows('base', 1)}});
  const options = {expectedRevision: initial.revision, archiveRef: initial.archiveRef};
  const results = await Promise.allSettled([
    store.save({slot: 'main', snapshot: snapshot(2029), options: {...options, additions: rows('a', 1)}}),
    store.save({slot: 'main', snapshot: snapshot(2030), options: {...options, additions: rows('b', 1)}}),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal((await store.load({slot: 'main'})).storageVersion, 3);
});

test('renderer adapter migrates the Milestone A IndexedDB save once and keeps the legacy copy', async () => {
  const modulePath = require.resolve('../storage.js');
  delete require.cache[modulePath];
  const indexedDB = new IDBFactory();
  const browserApi = require('../storage.js');
  const legacy = browserApi.create({indexedDB, slot: 'main'});
  await legacy.rename('Original Desktop Career');
  await legacy.save(snapshot(2032), {
    additions: rows('legacy-career', 2),
    gameAdditions: rows('legacy-game', 1),
  });

  const native = createDesktopStorage({rootDir: root});
  globalThis.indexedDB = indexedDB;
  globalThis.DynastyDesktopStorage = Object.freeze({
    load: payload => native.load(payload),
    readArchive: payload => native.readArchive(payload),
    readGames: payload => native.readGames(payload),
    save: payload => native.save(payload),
    listSlots: () => native.listSlots(),
    rename: payload => native.rename(payload),
  });
  delete require.cache[modulePath];
  try {
    const desktopApi = require('../storage.js');
    assert.equal(desktopApi.kind, 'desktop');
    const desktop = desktopApi.create({slot: 'main'});
    const loaded = await desktop.load();
    assert.equal(loaded.universe.year, 2032);
    assert.deepEqual((await desktop.readArchive(loaded.archiveRef)).map(row => row.id), ['legacy-career-0', 'legacy-career-1']);
    assert.deepEqual((await desktop.readGames(loaded.gameRef)).map(row => row.id), ['legacy-game-0']);
    assert.equal((await desktop.listSlots())[0].label, 'Original Desktop Career');
    assert.equal((await legacy.load()).universe.year, 2032, 'migration preserves the IndexedDB source copy');
  } finally {
    delete globalThis.DynastyDesktopStorage;
    delete globalThis.indexedDB;
    delete require.cache[modulePath];
  }
});

test('one failed legacy migration does not block other slots and is retried', async () => {
  const modulePath = require.resolve('../storage.js');
  delete require.cache[modulePath];
  const indexedDB = new IDBFactory();
  const browserApi = require('../storage.js');
  const legacyMain = browserApi.create({indexedDB, slot: 'main'});
  const legacySecond = browserApi.create({indexedDB, slot: 'dynasty-2'});
  await legacyMain.save(snapshot(2031), {additions: rows('main-career', 1)});
  await legacySecond.save(snapshot(2041, 'Great Lakes University'), {additions: rows('second-career', 1)});

  const native = createDesktopStorage({rootDir: root});
  let failMain = true;
  globalThis.indexedDB = indexedDB;
  globalThis.DynastyDesktopStorage = Object.freeze({
    load: payload => native.load(payload),
    readArchive: payload => native.readArchive(payload),
    readGames: payload => native.readGames(payload),
    save: payload => {
      if (failMain && payload.slot === 'main') {
        failMain = false;
        return Promise.reject(new Error('simulated disk error'));
      }
      return native.save(payload);
    },
    listSlots: () => native.listSlots(),
    rename: payload => native.rename(payload),
  });
  delete require.cache[modulePath];
  try {
    const desktopApi = require('../storage.js');
    const firstList = await desktopApi.create({slot: 'main'}).listSlots();
    assert.match(firstList[0].migrationError, /could not be migrated/i);
    assert.equal(firstList[0].empty, false, 'failed legacy slot is protected from replacement');
    assert.equal((await desktopApi.create({slot: 'dynasty-2'}).load()).universe.year, 2041,
      'unaffected slot remains usable');
    assert.equal((await desktopApi.create({slot: 'main'}).load()).universe.year, 2031,
      'failed slot retries on its next operation');
  } finally {
    delete globalThis.DynastyDesktopStorage;
    delete globalThis.indexedDB;
    delete require.cache[modulePath];
  }
});

// ---- v0.16: large saves are sent in small staged messages and committed once ----
const {createStagingArea, routeSave, MAX_BATCH_ROWS} = require('../desktop/staging.js');
const modulePath = require.resolve('../storage.js');

test('a staging area holds rows in memory until one save takes them, and forgets abandoned stages', () => {
  let clock = 0, n = 0;
  const area = createStagingArea({now: () => clock, makeToken: () => `t${++n}`});
  const {token} = area.begin();
  assert.deepEqual(area.add({token, kind: 'additions', rows: [{id: 'a'}, {id: 'b'}]}), {rows: 2});
  assert.deepEqual(area.add({token, kind: 'gameAdditions', rows: [{id: 'g'}]}), {rows: 3});
  assert.throws(() => area.add({token, kind: 'other', rows: []}), /Unknown staged rows/);
  assert.throws(() => area.add({token, kind: 'additions', rows: 'nope'}), /array/);
  assert.throws(() => area.add({token, kind: 'additions', rows: new Array(MAX_BATCH_ROWS + 1).fill({id: 'x'})}), /reasonable size/);
  assert.throws(() => area.add({token: 'missing', kind: 'additions', rows: []}), /no longer available/);
  const taken = area.take(token);
  assert.deepEqual(taken.additions.map(r => r.id), ['a', 'b']);
  assert.deepEqual(taken.gameAdditions.map(r => r.id), ['g']);
  assert.throws(() => area.take(token), /no longer available/, 'rows are used once');
  const stale = area.begin().token;
  clock += 11 * 60 * 1000;
  assert.equal(area.size(), 0, 'an abandoned stage is dropped');
  assert.throws(() => area.take(stale), /no longer available/);
  assert.throws(() => createStagingArea({}), /token generator/);
});

test('a big save goes through the real bridge path as small messages and lands exactly like a direct save', async () => {
  const messages = [];
  let n = 0;
  const makeStore = async name => createDesktopStorage({rootDir: await fs.mkdtemp(path.join(os.tmpdir(), `dynasty-lab-stage-${name}-`))});
  const direct = await makeStore('direct'), staged = await makeStore('staged');
  const staging = createStagingArea({makeToken: () => `tok${++n}`});
  // The same glue the main process uses, behind a bridge that records every message's size in rows.
  const bridge = Object.freeze({
    load: p => staged.load(p), readArchive: p => staged.readArchive(p), readGames: p => staged.readGames(p), listSlots: () => staged.listSlots(), rename: p => staged.rename(p),
    save: payload => { messages.push({stage: payload.stage || null, rows: (payload.rows?.length || 0) + (payload.options?.additions?.length || 0) + (payload.options?.gameAdditions?.length || 0)}); return routeSave(staged, staging, payload); },
  });
  globalThis.DynastyDesktopStorage = bridge;
  delete require.cache[modulePath];
  try {
    const api = require('../storage.js'), desktop = api.create({slot: 'main'});
    const careers = rows('career', 9000), games = rows('game', 4500), snap = snapshot(2046, 'Chicago Metropolitan');
    // A core with big sections: many small nested objects, like rosters and the event log, plus a big keyed object.
    Object.assign(snap.universe, {
      teams: Array.from({length: 120}, (_, t) => ({id: t + 1, name: `Team ${t}`, w: 3, l: 1, roster: Array.from({length: 300}, (_, p) => ({id: `p${t}-${p}`, stats: {a: 1, b: 2}, tags: ['x', 'y']}))})),
      events: Array.from({length: 7000}, (_, e) => ({id: e, type: 'EVT', meta: {n: e}})),
      draftHistory: Object.fromEntries(Array.from({length: 60}, (_, y) => [2030 + y, Array.from({length: 900}, (_, i) => ({pick: i}))])),
      nothing: undefined, flag: true, note: 'kept',
    });
    const saved = await desktop.save(snap, {additions: careers, gameAdditions: games, checkpointType: 'manual'});
    const expected = await direct.save({slot: 'main', snapshot: snap, options: {additions: careers, gameAdditions: games, checkpointType: 'manual'}});
    assert.deepEqual([saved.archiveRef.count, saved.archiveRef.chunks, saved.gameRef.count, saved.gameRef.chunks], [expected.archiveRef.count, expected.archiveRef.chunks, expected.gameRef.count, expected.gameRef.chunks]);
    const loaded = await desktop.load();
    assert.equal(loaded.universe.year, 2046);
    assert.deepEqual((await desktop.readArchive(loaded.archiveRef)).map(r => r.id), careers.map(r => r.id), 'every career, in order');
    assert.deepEqual((await desktop.readGames(loaded.gameRef)).map(r => r.id), games.map(r => r.id), 'every game, in order');
    assert.deepEqual(loaded.universe, (await direct.load({slot: 'main'})).universe, 'the stored core is exactly what a direct save stores, in the same key order');
    assert.deepEqual(Object.keys(loaded.universe), Object.keys((await direct.load({slot: 'main'})).universe));
    assert.ok(messages.filter(m => m.stage === 'core').length >= 3, 'the large core sections were staged in parts');
    assert.equal(messages.filter(m => m.stage === null).length, 1, 'one commit');
    assert.ok(messages.filter(m => m.stage === 'add').length >= 7, 'the rows arrived in several messages');
    assert.ok(Math.max(...messages.map(m => m.rows)) <= 2000, 'no message carries more than a small batch of rows');
    assert.equal(staging.size(), 0, 'the stage is gone after the save');

    // An ordinary autosave (a few thousand rows at most) goes straight through, unchanged.
    messages.length = 0;
    await desktop.save(snapshot(2046, 'Chicago Metropolitan'), {expectedRevision: saved.revision, archiveRef: saved.archiveRef, gameRef: saved.gameRef, additions: rows('next', 50), gameAdditions: rows('ngame', 20), checkpointType: 'week'});
    assert.deepEqual(messages.map(m => m.stage), [null], 'a small save is one message');
  } finally {
    delete globalThis.DynastyDesktopStorage;
    delete require.cache[modulePath];
  }
});

test('a staging failure discards the stage and writes nothing', async () => {
  let n = 0, calls = 0;
  const staging = createStagingArea({makeToken: () => `t${++n}`});
  const store = createDesktopStorage({rootDir: await fs.mkdtemp(path.join(os.tmpdir(), 'dynasty-lab-stage-fail-'))});
  globalThis.DynastyDesktopStorage = Object.freeze({
    load: p => store.load(p), readArchive: p => store.readArchive(p), readGames: p => store.readGames(p), listSlots: () => store.listSlots(), rename: p => store.rename(p),
    save: payload => { if (payload.stage === 'add' && ++calls === 3) return Promise.reject(new Error('the window closed')); return routeSave(store, staging, payload); },
  });
  delete require.cache[modulePath];
  try {
    const desktop = require('../storage.js').create({slot: 'main'});
    await assert.rejects(desktop.save(snapshot(2040, 'Great Lakes University'), {additions: rows('c', 9000), gameAdditions: [], checkpointType: 'manual'}), /window closed/);
    assert.equal(staging.size(), 0, 'the half-staged rows were dropped');
    assert.ok(!(await desktop.load()), 'nothing was committed');
    await assert.rejects(routeSave(store, staging, {slot: 'main', snapshot: snapshot(2040), options: {stagedToken: 'gone'}}), /no longer available/);
    await assert.rejects(routeSave(store, staging, {stage: 'frob'}), /Unknown staged save step/);
  } finally {
    delete globalThis.DynastyDesktopStorage;
    delete require.cache[modulePath];
  }
});

test('the core is cut into bounded parts, keeps every key in order, and leaves the archives to be saved separately', () => {
  const {planCoreParts} = require('../storage.js');
  const universe = {year: 2046, teams: Array.from({length: 30}, (_, t) => ({id: t, roster: Array.from({length: 100}, (_, p) => ({id: p, s: {a: 1}}))})),
    playerArchive: rows('x', 5), gameArchive: rows('g', 5), small: {a: [1, 2, 3]}, events: Array.from({length: 3000}, (_, i) => ({i})), map: {a: Array.from({length: 500}, (_, i) => ({i}))}, empty: []};
  const plan = planCoreParts(universe, 5000);
  assert.deepEqual(plan.keys, ['year', 'teams', 'small', 'events', 'map', 'empty'], 'every core key in its original order, without the archives');
  const countOf = v => { let n = 0; const walk = x => { if (x && typeof x === 'object') { n++; for (const k in x) walk(x[k]); } }; walk(v); return n; };
  for (const part of plan.parts) assert.ok(countOf(part.array ?? part.value) <= 5000 * 1.1 + 400, `a part stays small (${part.key})`);
  assert.ok(countOf(plan.remainder) <= 5000, 'the save message itself stays small');
  // Reassembled, it is the same core.
  let n = 0;
  const staging = createStagingArea({makeToken: () => `k${++n}`}), {token} = staging.begin();
  for (const part of plan.parts) staging.addCore({token, ...part});
  const {assembleUniverse} = require('../desktop/staging.js');
  const whole = assembleUniverse(plan.remainder, staging.take(token).core, plan.keys);
  const {playerArchive, gameArchive, ...expected} = universe;
  assert.deepEqual(whole, expected);
  assert.deepEqual(Object.keys(whole), Object.keys(expected));
  assert.throws(() => assembleUniverse({}, new Map(), ['__proto__']), /Unknown staged core key/);
  const again = createStagingArea({makeToken: () => 'z'}), t2 = again.begin().token;
  assert.throws(() => again.addCore({token: t2, key: '__proto__', value: 1}), /Unknown staged core key/);
  again.addCore({token: t2, key: 'v', value: 1});
  assert.throws(() => again.addCore({token: t2, key: 'v', value: 2}), /sent twice/);
  assert.throws(() => again.addCore({token: t2, key: 'v', array: []}), /both a value and an array/);
});
