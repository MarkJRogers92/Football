// Browser saves use IndexedDB. The desktop shell supplies the same narrow storage
// contract through a preload bridge, while portable JSON remains complete and inlined.
// IndexedDB requests are queued inside request callbacks (never across awaits).
(function(root){
  'use strict';
  const CHUNK_SIZE = 128;
  const revisionOf = d => d ? (d.revision || `legacy:${d.savedAt || ''}`) : null;
  const token = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join('-');

  // v0.9.49: every slot owns its own rows. Chunk keys are namespaced by slot, so one
  // dynasty can never read or clear another's archives — the old bare-index keys and the
  // store-wide clear() below made that a real hazard the moment a second slot existed.
  const DEFAULT_SLOT = 'main';
  const SLOT_IDS = [DEFAULT_SLOT, 'dynasty-2', 'dynasty-3'];
  const slotKey = (slot, i) => `${slot}:${i}`;
  const defaultLabel = id => `Dynasty ${SLOT_IDS.indexOf(id) + 1}`;
  const byteSize = value => {
    const text = JSON.stringify(value);
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length;
    return unescape(encodeURIComponent(text)).length;
  };

  function createBrowser({indexedDB = root.indexedDB, name = 'DynastyLabDB', slot = DEFAULT_SLOT} = {}) {
    if (typeof slot !== 'string' || !slot || /[:;]/.test(slot))
      throw new Error(`Invalid save slot "${slot}".`);
    function open() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 4);
        let cancelled = false;
        request.onblocked = () => {
          cancelled = true;
          reject(new Error('Close other Dynasty Lab tabs, then try again.'));
        };
        request.onupgradeneeded = () => {
          if (cancelled) { request.transaction.abort(); return; }
          const db = request.result;
          if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves');
          if (!db.objectStoreNames.contains('archives')) db.createObjectStore('archives');
          // v0.9.12: permanent box scores move out of the core row into their
          // own append-only chunks, so an ordinary save stops rewriting years
          // of history it never touched.
          if (!db.objectStoreNames.contains('games')) db.createObjectStore('games');
          // v0.9.49: slot summaries live apart from the dynasty itself, so a slot picker
          // can list programs, years and sizes without loading a whole save.
          if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
          // Chunks written before slots were bare indexes and all belonged to the default slot.
          if (request.transaction) migrateBareChunks(request.transaction, ['archives', 'games']);
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          if (cancelled) { db.close(); return; }
          db.onversionchange = () => db.close();
          resolve(db);
        };
      });
    }

    // Replacing a dynasty clears only this slot's chunks. The old code called clear() on the
    // whole store, which would have destroyed every other slot's history. Deletes are issued
    // for the known prior keys rather than driven by a cursor: a cursor is still walking the
    // store while the replacement puts are queued behind it, so it deletes the very rows just
    // written. clear() never had that problem because it is a single atomic request.
    function clearSlotChunks(store, slot, priorChunks) {
      for (let i = 0; i < (priorChunks || 0); i++) store.delete(slotKey(slot, i));
    }

    // Rewrites legacy numeric chunk keys as `main:<i>` in place. Runs inside the upgrade
    // transaction, so a failure aborts the version change and leaves the old layout intact.
    function migrateBareChunks(tx, stores) {
      for (const storeName of stores) {
        if (!tx.objectStoreNames.contains(storeName)) continue;
        const store = tx.objectStore(storeName);
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) return;
          if (typeof cursor.key === 'number') {
            store.put(cursor.value, slotKey(DEFAULT_SLOT, cursor.key));
            cursor.delete();
          }
          cursor.continue();
        };
      }
    }

    async function transact(stores, mode, work) {
      const db = await open();
      try {
        return await new Promise((resolve, reject) => {
          const tx = db.transaction(stores, mode);
          let result, error;
          const fail = e => { error = e; tx.abort(); };
          tx.oncomplete = () => resolve(result);
          tx.onabort = () => reject(error || tx.error || new Error('Save transaction was cancelled.'));
          // Abort owns rejection: a request error is not a successful commit.
          tx.onerror = () => {};
          try { work(tx, value => { result = value; }, fail); }
          catch (e) { fail(e); }
        });
      } finally { db.close(); }
    }

    function validRef(ref) {
      return ref && typeof ref.id === 'string' && ref.id.length > 0
        && Number.isSafeInteger(ref.count) && ref.count >= 0
        && Number.isSafeInteger(ref.chunks) && ref.chunks >= 0
        && ref.chunks <= ref.count && (ref.count === 0) === (ref.chunks === 0);
    }

    function load() {
      return transact(['saves'], 'readonly', (tx, done, fail) => {
        const req = tx.objectStore('saves').get(slot);
        req.onsuccess = () => {
          const d = req.result;
          if (d?.storageVersion && d.storageVersion !== 2 && d.storageVersion !== 3)
            return fail(new Error('This browser save needs a newer game version.'));
          if (d?.storageVersion >= 2 && (!validRef(d.archiveRef) || !d.revision))
            return fail(new Error('The saved archive reference is invalid. Use a complete JSON backup.'));
          if (d?.storageVersion === 3 && !validRef(d.gameRef))
            return fail(new Error('The saved game archive reference is invalid. Use a complete JSON backup.'));
          done(d);
        };
      });
    }

    // Slot summaries are intentionally separate from the save rows. The title screen can
    // list three careers without hydrating a league or either archive.
    function listSlots() {
      return transact(['saves', 'meta'], 'readonly', (tx, done) => {
        const saves = tx.objectStore('saves'), meta = tx.objectStore('meta');
        const rows = new Array(SLOT_IDS.length);
        let remaining = SLOT_IDS.length * 2;
        const found = SLOT_IDS.map(() => ({save: null, meta: null}));
        const finish = () => {
          if (--remaining) return;
          for (let i = 0; i < SLOT_IDS.length; i++) {
            const id = SLOT_IDS[i], saved = found[i].save, summary = found[i].meta;
            rows[i] = summary || (saved ? summaryFromSnapshot(id, saved, null) : {
              slot: id, label: defaultLabel(id), empty: true,
            });
          }
          done(rows);
        };
        SLOT_IDS.forEach((id, i) => {
          const s = saves.get(id), m = meta.get(id);
          s.onsuccess = () => { found[i].save = s.result || null; finish(); };
          m.onsuccess = () => { found[i].meta = m.result || null; finish(); };
        });
      });
    }

    function rename(label) {
      const clean = String(label || '').trim().replace(/\s+/g, ' ');
      if (!clean || clean.length > 40) return Promise.reject(new Error('Save slot names must be 1–40 characters.'));
      return transact(['meta'], 'readwrite', (tx, done) => {
        const store = tx.objectStore('meta'), req = store.get(slot);
        req.onsuccess = () => {
          const row = {...(req.result || {slot, empty: true}), slot, label: clean};
          store.put(row, slot);done(row);
        };
      });
    }

    function summaryFromSnapshot(id, snapshot, prior, details = {}) {
      const u = snapshot?.universe || {}, program = snapshot?.userTeam || 'Unknown program';
      const team = Array.isArray(u.teams) ? u.teams.find(t => t.name === program) : null;
      const {playerArchive, gameArchive, ...coreUniverse} = u;
      const coreBytes = byteSize({...snapshot, universe: coreUniverse});
      const archiveBytes = details.archiveBytes ?? prior?.archiveBytes ?? 0;
      const gameBytes = details.gameBytes ?? prior?.gameBytes ?? 0;
      return {
        slot: id, label: details.label || prior?.label || defaultLabel(id), empty: false,
        program, year: u.year, week: u.week, phase: u.phase,
        record: team ? `${team.w || 0}-${team.l || 0}` : null,
        version: snapshot?.version || null, savedAt: snapshot?.savedAt || null,
        checkpointType: details.checkpointType || 'manual',
        approximateBytes: coreBytes + archiveBytes + gameBytes,
        coreBytes, archiveBytes, gameBytes,
      };
    }

    function readArchive(ref) {
      if (!validRef(ref)) return Promise.reject(new Error('Invalid archive reference.'));
      return transact(['saves', 'archives'], 'readonly', (tx, done, fail) => {
        const req = tx.objectStore('saves').get(slot);
        req.onsuccess = () => {
          const current = req.result?.archiveRef;
          if (!current || current.id !== ref.id || current.count < ref.count || current.chunks < ref.chunks)
            return fail(new Error('The browser save was replaced in another tab. Load it again before opening history.'));
          const chunks = new Array(ref.chunks);
          let remaining = ref.chunks;
          if (!remaining) { done([]); return; }
          for (let i = 0; i < ref.chunks; i++) {
            const r = tx.objectStore('archives').get(slotKey(slot, i));
            r.onsuccess = () => {
              if (!Array.isArray(r.result) || !r.result.length || r.result.some(p => !p || typeof p !== 'object'))
                return fail(new Error('Archived careers are missing or damaged. Use a complete JSON backup.'));
              chunks[i] = r.result;
              if (--remaining === 0) {
                const rows = chunks.flat();
                if (rows.length !== ref.count) return fail(new Error('Archive count does not match the saved dynasty.'));
                done(rows);
              }
            };
          }
        };
      });
    }

    function readGames(ref) {
      if (!validRef(ref)) return Promise.reject(new Error('Invalid game archive reference.'));
      return transact(['saves', 'games'], 'readonly', (tx, done, fail) => {
        const req = tx.objectStore('saves').get(slot);
        req.onsuccess = () => {
          const current = req.result?.gameRef;
          if (!current || current.id !== ref.id || current.count < ref.count || current.chunks < ref.chunks)
            return fail(new Error('The browser save was replaced in another tab. Load it again before opening history.'));
          const chunks = new Array(ref.chunks);
          let remaining = ref.chunks;
          if (!remaining) { done([]); return; }
          for (let i = 0; i < ref.chunks; i++) {
            const r = tx.objectStore('games').get(slotKey(slot, i));
            r.onsuccess = () => {
              if (!Array.isArray(r.result) || !r.result.length || r.result.some(g => !g || typeof g !== 'object' || !g.id))
                return fail(new Error('Archived games are missing or damaged. Use a complete JSON backup.'));
              chunks[i] = r.result;
              if (--remaining === 0) {
                const rows = chunks.flat();
                if (rows.length !== ref.count) return fail(new Error('Game archive count does not match the saved dynasty.'));
                done(rows);
              }
            };
          }
        };
      });
    }

    // Archived careers are append-only. Ordinary saves write zero archive chunks.
    // A new/imported universe replaces both stores atomically; a loaded universe
    // must still match its last saved revision to avoid overwriting another tab.
    function save(snapshot, {expectedRevision = null, archiveRef = null, additions = [],
                             gameRef = null, gameAdditions = [], checkpointType = 'manual'} = {}) {
      if (archiveRef && !validRef(archiveRef)) return Promise.reject(new Error('Invalid archive reference.'));
      if (gameRef && !validRef(gameRef)) return Promise.reject(new Error('Invalid game archive reference.'));
      return transact(['saves', 'archives', 'games', 'meta'], 'readwrite', (tx, done, fail) => {
        const saves = tx.objectStore('saves'), archives = tx.objectStore('archives'), games = tx.objectStore('games'), meta = tx.objectStore('meta');
        const req = saves.get(slot);
        req.onsuccess = () => {
          const metaReq = meta.get(slot);
          metaReq.onsuccess = () => {
          try {
            if (expectedRevision !== null && revisionOf(req.result) !== expectedRevision)
              return fail(new Error('Another tab changed this browser save. Export this dynasty or reload before saving.'));
            if (archiveRef && (req.result?.archiveRef?.id !== archiveRef.id
              || req.result.archiveRef.count !== archiveRef.count || req.result.archiveRef.chunks !== archiveRef.chunks))
              return fail(new Error('The saved archive changed. Reload before saving.'));
            if (gameRef && (req.result?.gameRef?.id !== gameRef.id
              || req.result.gameRef.count !== gameRef.count || req.result.gameRef.chunks !== gameRef.chunks))
              return fail(new Error('The saved game archive changed. Reload before saving.'));
            let chunks = archiveRef?.chunks || 0;
            if (!archiveRef) clearSlotChunks(archives, slot, req.result?.archiveRef?.chunks);
            for (let i = 0; i < additions.length; i += CHUNK_SIZE)
              archives.put(additions.slice(i, i + CHUNK_SIZE), slotKey(slot, chunks++));
            const ref = {id: archiveRef?.id || token(), count: (archiveRef?.count || 0) + additions.length, chunks};
            let gameChunks = gameRef?.chunks || 0;
            if (!gameRef) clearSlotChunks(games, slot, req.result?.gameRef?.chunks);
            for (let i = 0; i < gameAdditions.length; i += CHUNK_SIZE)
              games.put(gameAdditions.slice(i, i + CHUNK_SIZE), slotKey(slot, gameChunks++));
            const gRef = {id: gameRef?.id || token(), count: (gameRef?.count || 0) + gameAdditions.length, chunks: gameChunks};
            const {playerArchive, gameArchive, ...core} = snapshot.universe;
            const data = {...snapshot, universe: core, storageVersion: 3, archiveRef: ref, gameRef: gRef, revision: token()};
            const priorMeta = metaReq.result || null;
            const archiveBytes = (archiveRef ? priorMeta?.archiveBytes || 0 : 0) + byteSize(additions);
            const gameBytes = (gameRef ? priorMeta?.gameBytes || 0 : 0) + byteSize(gameAdditions);
            const summary = summaryFromSnapshot(slot, snapshot, priorMeta, {archiveBytes, gameBytes, checkpointType});
            saves.put(data, slot);
            meta.put(summary, slot);
            done({revision: data.revision, archiveRef: ref, gameRef: gRef, meta: summary});
          } catch (e) { fail(e); }
          };
        };
      });
    }
    return {load, readArchive, readGames, save, listSlots, rename, slot};
  }

  const migrationPromises = new Map();
  const MIGRATION_ERROR = 'An older desktop save could not be migrated. Restart Dynasty Lab or import a complete JSON backup.';
  async function migrateLegacyDesktopSlot(bridge, slot) {
    if (!root.indexedDB) return;
    const nativeSlots = await bridge.listSlots();
    const legacyIndex = createBrowser({indexedDB: root.indexedDB});
    const legacySlots = await legacyIndex.listSlots();
    const nativeMeta = nativeSlots.find(row => row.slot === slot);
    const legacyMeta = legacySlots.find(row => row.slot === slot);
    if (!nativeMeta?.empty || !legacyMeta) return;
    if (legacyMeta.label && legacyMeta.label !== nativeMeta.label)
      await bridge.rename({slot, label: legacyMeta.label});
    if (legacyMeta.empty !== false) return;
    const legacy = createBrowser({indexedDB: root.indexedDB, slot});
    const saved = await legacy.load();
    if (!saved) return;
    const playerArchive = saved.storageVersion >= 2
      ? await legacy.readArchive(saved.archiveRef)
      : saved.universe?.playerArchive || [];
    const gameArchive = saved.storageVersion === 3
      ? await legacy.readGames(saved.gameRef)
      : saved.universe?.gameArchive || [];
    const {storageVersion, archiveRef, gameRef, revision, ...portable} = saved;
    portable.universe = {...(saved.universe || {}), playerArchive, gameArchive};
    await bridge.save({
      slot,
      snapshot: portable,
      options: {additions: playerArchive, gameAdditions: gameArchive, checkpointType: 'migration'},
    });
  }

  function ensureLegacyMigration(bridge, slot) {
    if (!migrationPromises.has(slot)) {
      const attempt = migrateLegacyDesktopSlot(bridge, slot).catch(() => {
        migrationPromises.delete(slot);
        throw new Error(MIGRATION_ERROR);
      });
      migrationPromises.set(slot, attempt);
    }
    return migrationPromises.get(slot);
  }

  async function listDesktopSlots(bridge) {
    const failed = new Set();
    for (const id of SLOT_IDS) {
      try { await ensureLegacyMigration(bridge, id); }
      catch { failed.add(id); }
    }
    const rows = await bridge.listSlots();
    return rows.map(row => failed.has(row.slot) && row.empty
      ? {...row, empty: false, migrationError: MIGRATION_ERROR}
      : row);
  }

  function createDesktop(bridge, slot) {
    if (typeof slot !== 'string' || !SLOT_IDS.includes(slot))
      throw new Error(`Invalid save slot "${slot}".`);
    const afterMigration = action => ensureLegacyMigration(bridge, slot).then(action);
    return {
      load: () => afterMigration(() => bridge.load({slot})),
      readArchive: ref => afterMigration(() => bridge.readArchive({slot, ref})),
      readGames: ref => afterMigration(() => bridge.readGames({slot, ref})),
      save: (snapshot, options = {}) => afterMigration(() => bridge.save({slot, snapshot, options})),
      listSlots: () => listDesktopSlots(bridge),
      rename: label => afterMigration(() => bridge.rename({slot, label})),
      slot,
    };
  }

  function create(options = {}) {
    const bridge = root.DynastyDesktopStorage;
    const forceBrowser = options.forceBrowser || Object.prototype.hasOwnProperty.call(options, 'indexedDB');
    if (bridge && !forceBrowser) return createDesktop(bridge, options.slot || DEFAULT_SLOT);
    return createBrowser(options);
  }

  const api = {
    create,
    createBrowser,
    revisionOf,
    SLOT_IDS,
    get kind() { return root.DynastyDesktopStorage ? 'desktop' : 'browser'; },
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DynastyStorage = api;
})(typeof window === 'object' ? window : globalThis);
