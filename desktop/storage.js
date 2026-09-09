'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const CHUNK_SIZE = 128;
const STORAGE_VERSION = 3;
const FORMAT_VERSION = 1;
const BACKUP_LIMIT = 5;
const MAX_JSON_BYTES = 256 * 1024 * 1024;
const SLOT_DIRS = Object.freeze({
  main: 'Dynasty 1',
  'dynasty-2': 'Dynasty 2',
  'dynasty-3': 'Dynasty 3',
});
const SLOT_IDS = Object.freeze(Object.keys(SLOT_DIRS));

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isPlainObject = value => isObject(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const defaultLabel = slot => `Dynasty ${SLOT_IDS.indexOf(slot) + 1}`;
const token = () => crypto.randomUUID().replace(/-/g, '');
const revisionOf = value => value ? (value.revision || `legacy:${value.savedAt || ''}`) : null;
const byteSize = value => Buffer.byteLength(JSON.stringify(value));

function invalid(message) {
  throw new Error(message);
}

function validateSlot(slot) {
  if (typeof slot !== 'string' || !Object.prototype.hasOwnProperty.call(SLOT_DIRS, slot))
    invalid(`Invalid save slot "${slot}".`);
  return slot;
}

function validateLabel(label) {
  const clean = String(label || '').trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 40)
    invalid('Save slot names must be 1–40 characters.');
  return clean;
}

function validateRef(ref, label = 'archive') {
  if (!isPlainObject(ref)
    || typeof ref.id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(ref.id)
    || !Number.isSafeInteger(ref.count) || ref.count < 0
    || !Number.isSafeInteger(ref.chunks) || ref.chunks < 0
    || ref.chunks > ref.count || (ref.count === 0) !== (ref.chunks === 0))
    invalid(`Invalid ${label} reference.`);
  return ref;
}

function validateChunkRows(rows, label, allowEmpty = false) {
  if (!Array.isArray(rows) || (!allowEmpty && !rows.length) || rows.length > CHUNK_SIZE
    || rows.some(row => !isPlainObject(row)
      || (label === 'Archived games' && (typeof row.id !== 'string' || !row.id))))
    invalid(`${label} are missing or damaged. Use a complete JSON backup.`);
}

function validateCore(core) {
  if (!isPlainObject(core)) invalid('Saved dynasty data is missing or damaged.');
  if (core.storageVersion > STORAGE_VERSION)
    invalid('This desktop save needs a newer game version.');
  if (core.storageVersion !== 2 && core.storageVersion !== STORAGE_VERSION)
    invalid('Saved dynasty data is missing or damaged.');
  if (!isPlainObject(core.universe)) invalid('Saved dynasty data is missing or damaged.');
  if (typeof core.userTeam !== 'string' || typeof core.version !== 'string'
    || typeof core.savedAt !== 'string') invalid('Saved dynasty data is missing or damaged.');
  if (!core.revision || typeof core.revision !== 'string')
    invalid('Saved dynasty data is missing or damaged.');
  validateRef(core.archiveRef, 'archive');
  if (core.storageVersion === STORAGE_VERSION) validateRef(core.gameRef, 'game archive');
  return core;
}

function validateWrapper(wrapper, slot) {
  if (!isPlainObject(wrapper) || wrapper.formatVersion !== FORMAT_VERSION || wrapper.slot !== slot
    || !isPlainObject(wrapper.meta) || wrapper.meta.slot !== slot || wrapper.meta.empty !== false)
    invalid('Saved dynasty data is missing or damaged.');
  validateCore(wrapper.core);
  return wrapper;
}

function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot) || !isPlainObject(snapshot.universe)
    || typeof snapshot.userTeam !== 'string' || typeof snapshot.version !== 'string'
    || typeof snapshot.savedAt !== 'string')
    invalid('Saved dynasty data is missing or damaged.');
  try {
    const bytes = byteSize(snapshot);
    if (bytes > MAX_JSON_BYTES) invalid('This dynasty save is too large for desktop storage.');
  } catch (error) {
    invalid(`Saved dynasty data is not valid JSON: ${error.message}`);
  }
  return snapshot;
}

function validateOptions(options = {}) {
  if (!isPlainObject(options)) invalid('Invalid desktop save options.');
  if (options.expectedRevision !== null && options.expectedRevision !== undefined
    && typeof options.expectedRevision !== 'string') invalid('Invalid save revision.');
  if (options.archiveRef !== null && options.archiveRef !== undefined)
    validateRef(options.archiveRef, 'archive');
  if (options.gameRef !== null && options.gameRef !== undefined)
    validateRef(options.gameRef, 'game archive');
  if (options.checkpointType !== undefined && (typeof options.checkpointType !== 'string'
    || !/^[A-Za-z0-9_-]{1,40}$/.test(options.checkpointType))) invalid('Invalid checkpoint type.');
  for (const [name, value] of [['additions', options.additions], ['gameAdditions', options.gameAdditions]]) {
    if (value !== undefined && (!Array.isArray(value) || value.some(row => !isPlainObject(row))))
      invalid(`Invalid ${name}.`);
  }
  return options;
}

function sameRef(a, b) {
  return !!a && !!b && a.id === b.id && a.count === b.count && a.chunks === b.chunks;
}

function jsonText(value) {
  let text;
  try { text = JSON.stringify(value); } catch (error) { invalid(`Saved dynasty data is not valid JSON: ${error.message}`); }
  if (Buffer.byteLength(text) > MAX_JSON_BYTES) invalid('This dynasty save is too large for desktop storage.');
  return text;
}

async function closeQuietly(handle) {
  try { await handle.close(); } catch {}
}

function createDesktopStorage({rootDir, fsModule = fs, cryptoModule = crypto, now = () => Date.now()} = {}) {
  if (typeof rootDir !== 'string' || !rootDir) invalid('Desktop storage requires a root directory.');
  const io = fsModule;
  const root = path.resolve(rootDir);
  const queues = new Map();
  let backupSequence = 0;
  const makeToken = () => cryptoModule.randomUUID().replace(/-/g, '');

  function slotInfo(slot) {
    validateSlot(slot);
    const dir = path.join(root, SLOT_DIRS[slot]);
    return {
      slot,
      dir,
      dynasty: path.join(dir, 'dynasty.json'),
      slotMeta: path.join(dir, 'slot.json'),
      backups: path.join(dir, 'backups'),
      history: path.join(dir, 'history'),
      games: path.join(dir, 'games'),
    };
  }

  async function ensureDir(dir) {
    await io.mkdir(dir, {recursive: true});
  }

  async function syncDirectory(dir) {
    // Directory fsync is supported on Unix. It is best-effort because Windows
    // does not permit opening a directory through every Node release.
    let handle;
    try { handle = await io.open(dir, 'r'); await handle.sync(); }
    catch {}
    finally { if (handle) await closeQuietly(handle); }
  }

  async function atomicWrite(file, value) {
    const text = typeof value === 'string' ? value : jsonText(value);
    const dir = path.dirname(file);
    await ensureDir(dir);
    const temporary = path.join(dir, `.${path.basename(file)}.tmp-${process.pid}-${makeToken()}`);
    let handle;
    try {
      handle = await io.open(temporary, 'wx', 0o600);
      await handle.writeFile(text, 'utf8');
      await handle.sync();
    } finally {
      if (handle) await closeQuietly(handle);
    }
    try {
      await io.rename(temporary, file);
    } catch (error) {
      // POSIX rename replaces atomically. Some Windows Node versions refuse
      // to replace an existing file; the recovery backup makes this fallback
      // recoverable even though the replacement itself has a small gap.
      if (!['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
      try { await io.unlink(file); } catch (unlinkError) { if (unlinkError.code !== 'ENOENT') throw error; }
      await io.rename(temporary, file);
    } finally {
      try { await io.unlink(temporary); } catch {}
    }
    await syncDirectory(dir);
  }

  async function readJson(file) {
    let text;
    try { text = await io.readFile(file, 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
    try { return JSON.parse(text); }
    catch { return null; }
  }

  async function writeNewJson(file, value) {
    if (await io.access(file).then(() => true).catch(() => false))
      invalid('Desktop history chunk already exists.');
    await atomicWrite(file, value);
  }

  async function readValidBackup(info) {
    let entries;
    try { entries = await io.readdir(info.backups, {withFileTypes: true}); }
    catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !/^backup-.+\.json$/.test(entry.name)) continue;
      const file = path.join(info.backups, entry.name);
      let stat;
      try { stat = await io.stat(file); } catch { continue; }
      files.push({file, mtimeMs: stat.mtimeMs, name: entry.name});
    }
    files.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name));
    for (const item of files) {
      const wrapper = await readJson(item.file);
      try {
        if (wrapper) return validateWrapper(wrapper, info.slot);
      } catch {}
    }
    return undefined;
  }

  async function recoverCommitted(info, current) {
    const backup = await readValidBackup(info);
    if (!backup) {
      if (current === undefined) return undefined;
      invalid('Saved dynasty data is missing or damaged.');
    }
    await atomicWrite(info.dynasty, backup);
    return backup;
  }

  async function readCommitted(info) {
    const current = await readJson(info.dynasty);
    if (current !== undefined) {
      try { return validateWrapper(current, info.slot); }
      catch { return recoverCommitted(info, current); }
    }
    return recoverCommitted(info, current);
  }

  async function readSlotMeta(info) {
    const value = await readJson(info.slotMeta);
    if (!value || value.formatVersion !== FORMAT_VERSION || value.slot !== info.slot) return null;
    try { return {slot: info.slot, label: validateLabel(value.label), empty: !!value.empty}; }
    catch { return null; }
  }

  function summaryFromSnapshot(slot, snapshot, prior, details = {}) {
    const u = snapshot.universe || {};
    const program = snapshot.userTeam || 'Unknown program';
    const team = Array.isArray(u.teams) ? u.teams.find(t => t && t.name === program) : null;
    const {playerArchive, gameArchive, ...coreUniverse} = u;
    const coreBytes = byteSize({...snapshot, universe: coreUniverse});
    const archiveBytes = details.archiveBytes ?? prior?.archiveBytes ?? 0;
    const gameBytes = details.gameBytes ?? prior?.gameBytes ?? 0;
    return {
      slot, label: details.label || prior?.label || defaultLabel(slot), empty: false,
      program, year: u.year, week: u.week, phase: u.phase,
      record: team ? `${team.w || 0}-${team.l || 0}` : null,
      version: snapshot.version || null, savedAt: snapshot.savedAt || null,
      checkpointType: details.checkpointType || 'manual',
      approximateBytes: coreBytes + archiveBytes + gameBytes,
      coreBytes, archiveBytes, gameBytes,
    };
  }

  async function enqueue(slot, work) {
    const prior = queues.get(slot) || Promise.resolve();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    queues.set(slot, gate);
    await prior;
    try { return await work(); }
    finally {
      release();
      if (queues.get(slot) === gate) queues.delete(slot);
    }
  }

  async function writeChunks(info, kind, id, start, additions) {
    if (!additions.length) return;
    const base = path.join(kind === 'archive' ? info.history : info.games, id);
    await ensureDir(base);
    for (let offset = 0; offset < additions.length; offset += CHUNK_SIZE) {
      const index = start + Math.floor(offset / CHUNK_SIZE);
      const file = path.join(base, `${String(index).padStart(8, '0')}.json`);
      validateChunkRows(additions.slice(offset, offset + CHUNK_SIZE), kind === 'archive' ? 'Archived careers' : 'Archived games');
      await writeNewJson(file, additions.slice(offset, offset + CHUNK_SIZE));
    }
  }

  async function backUp(info, wrapper) {
    if (!wrapper) return;
    const name = `backup-${now()}-${backupSequence++}-${makeToken()}.json`;
    await writeNewJson(path.join(info.backups, name), wrapper);
    let entries;
    try { entries = await io.readdir(info.backups, {withFileTypes: true}); }
    catch { return; }
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !/^backup-.+\.json$/.test(entry.name)) continue;
      const file = path.join(info.backups, entry.name);
      try { files.push({file, mtimeMs: (await io.stat(file)).mtimeMs, name: entry.name}); } catch {}
    }
    files.sort((a, b) => b.mtimeMs - a.mtimeMs || b.name.localeCompare(a.name));
    for (const item of files.slice(BACKUP_LIMIT)) { try { await io.unlink(item.file); } catch {} }
  }

  async function load({slot}) {
    validateSlot(slot);
    return enqueue(slot, async () => {
      const wrapper = await readCommitted(slotInfo(slot));
      return wrapper?.core;
    });
  }

  async function readHistory({slot, ref, kind}) {
    validateSlot(slot);
    validateRef(ref, kind === 'archive' ? 'archive' : 'game archive');
    return enqueue(slot, async () => {
      const info = slotInfo(slot);
      const wrapper = await readCommitted(info);
      const current = wrapper?.core?.[kind === 'archive' ? 'archiveRef' : 'gameRef'];
      if (!wrapper || !current || current.id !== ref.id || current.count < ref.count || current.chunks < ref.chunks)
        invalid(`The desktop save was replaced in another window. Load it again before opening history.`);
      const base = path.join(kind === 'archive' ? info.history : info.games, ref.id);
      const rows = [];
      for (let i = 0; i < ref.chunks; i++) {
        const file = path.join(base, `${String(i).padStart(8, '0')}.json`);
        const chunk = await readJson(file);
        try { validateChunkRows(chunk, kind === 'archive' ? 'Archived careers' : 'Archived games'); }
        catch { invalid(kind === 'archive' ? 'Archived careers are missing or damaged. Use a complete JSON backup.' : 'Archived games are missing or damaged. Use a complete JSON backup.'); }
        rows.push(...chunk);
      }
      if (rows.length !== ref.count) invalid(kind === 'archive' ? 'Archive count does not match the saved dynasty.' : 'Game archive count does not match the saved dynasty.');
      return rows;
    });
  }

  async function save({slot, snapshot, options = {}}) {
    validateSlot(slot);
    validateSnapshot(snapshot);
    validateOptions(options);
    const additions = options.additions || [];
    const gameAdditions = options.gameAdditions || [];
    return enqueue(slot, async () => {
      const info = slotInfo(slot);
      const priorWrapper = await readCommitted(info);
      const prior = priorWrapper?.core;
      const expected = options.expectedRevision ?? null;
      if (expected !== null && revisionOf(prior) !== expected)
        invalid('Another desktop save changed this dynasty. Export this dynasty or reload before saving.');
      const archiveRef = options.archiveRef ?? null;
      const gameRef = options.gameRef ?? null;
      if (archiveRef && (!prior || !sameRef(prior.archiveRef, archiveRef)))
        invalid('The saved archive changed. Reload before saving.');
      if (gameRef && (!prior || !sameRef(prior.gameRef, gameRef)))
        invalid('The saved game archive changed. Reload before saving.');

      const archiveId = archiveRef?.id || makeToken();
      const archiveStart = archiveRef?.chunks || 0;
      const nextArchiveRef = {id: archiveId, count: (archiveRef?.count || 0) + additions.length,
        chunks: archiveStart + Math.ceil(additions.length / CHUNK_SIZE)};
      const gameId = gameRef?.id || makeToken();
      const gameStart = gameRef?.chunks || 0;
      const nextGameRef = {id: gameId, count: (gameRef?.count || 0) + gameAdditions.length,
        chunks: gameStart + Math.ceil(gameAdditions.length / CHUNK_SIZE)};
      await writeChunks(info, 'archive', archiveId, archiveStart, additions);
      await writeChunks(info, 'game', gameId, gameStart, gameAdditions);

      const {playerArchive, gameArchive, ...coreUniverse} = snapshot.universe;
      const revision = makeToken();
      const core = {...snapshot, universe: coreUniverse, storageVersion: STORAGE_VERSION,
        archiveRef: nextArchiveRef, gameRef: nextGameRef, revision};
      validateCore(core);
      const priorMeta = priorWrapper?.meta;
      const slotMeta = await readSlotMeta(info);
      const meta = summaryFromSnapshot(slot, snapshot, priorMeta, {
        label: slotMeta?.label || priorMeta?.label || defaultLabel(slot),
        archiveBytes: archiveRef ? (priorMeta?.archiveBytes || 0) + byteSize(additions) : byteSize(additions),
        gameBytes: gameRef ? (priorMeta?.gameBytes || 0) + byteSize(gameAdditions) : byteSize(gameAdditions),
        checkpointType: options.checkpointType || 'manual',
      });
      const wrapper = {formatVersion: FORMAT_VERSION, slot, core, meta};
      await ensureDir(info.dir);
      await ensureDir(info.backups);
      await backUp(info, priorWrapper);
      await atomicWrite(info.dynasty, wrapper);
      await atomicWrite(info.slotMeta, {formatVersion: FORMAT_VERSION, slot,
        label: meta.label, empty: false});
      return {revision, archiveRef: nextArchiveRef, gameRef: nextGameRef, meta};
    });
  }

  async function listSlots() {
    return Promise.all(SLOT_IDS.map(slot => enqueue(slot, async () => {
      const info = slotInfo(slot);
      const wrapper = await readCommitted(info);
      const slotMeta = await readSlotMeta(info);
      if (!wrapper) return {slot, label: slotMeta?.label || defaultLabel(slot), empty: true};
      return {...wrapper.meta, slot, label: slotMeta?.label || wrapper.meta.label || defaultLabel(slot), empty: false};
    })));
  }

  async function rename({slot, label}) {
    validateSlot(slot);
    const clean = validateLabel(label);
    return enqueue(slot, async () => {
      const info = slotInfo(slot);
      const wrapper = await readCommitted(info);
      const row = {formatVersion: FORMAT_VERSION, slot, label: clean, empty: !wrapper};
      await atomicWrite(info.slotMeta, row);
      return row;
    });
  }

  return {
    load,
    readArchive: payload => readHistory({...payload, kind: 'archive'}),
    readGames: payload => readHistory({...payload, kind: 'game'}),
    save,
    listSlots,
    rename,
    slot: undefined,
  };
}

module.exports = {createDesktopStorage, CHUNK_SIZE, SLOT_IDS, SLOT_DIRS, FORMAT_VERSION, STORAGE_VERSION};
