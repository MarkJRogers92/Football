// Browser-only save layout. Portable JSON remains a complete, inlined dynasty.
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
  const slotKey = (slot, i) => `${slot}:${i}`;

  function create({indexedDB = root.indexedDB, name = 'DynastyLabDB', slot = DEFAULT_SLOT} = {}) {
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
                             gameRef = null, gameAdditions = []} = {}) {
      if (archiveRef && !validRef(archiveRef)) return Promise.reject(new Error('Invalid archive reference.'));
      if (gameRef && !validRef(gameRef)) return Promise.reject(new Error('Invalid game archive reference.'));
      return transact(['saves', 'archives', 'games'], 'readwrite', (tx, done, fail) => {
        const saves = tx.objectStore('saves'), archives = tx.objectStore('archives'), games = tx.objectStore('games');
        const req = saves.get(slot);
        req.onsuccess = () => {
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
            saves.put(data, slot);
            done({revision: data.revision, archiveRef: ref, gameRef: gRef});
          } catch (e) { fail(e); }
        };
      });
    }
    return {load, readArchive, readGames, save};
  }
  const api = {create, revisionOf};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DynastyStorage = api;
})(typeof window === 'object' ? window : globalThis);
