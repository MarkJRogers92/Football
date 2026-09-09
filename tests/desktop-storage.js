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
  const payload = {slot: 'main', snapshot: snapshot(), options: {
    additions: rows('retry-career', 2), gameAdditions: rows('retry-game', 1),
  }};
  await assert.rejects(() => interrupted.save(payload), /simulated interruption/);
  const retried = await interrupted.save(payload);
  assert.deepEqual((await interrupted.readArchive({slot: 'main', ref: retried.archiveRef})).map(row => row.id),
    ['retry-career-0', 'retry-career-1']);
  assert.deepEqual((await interrupted.readGames({slot: 'main', ref: retried.gameRef})).map(row => row.id),
    ['retry-game-0']);
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
