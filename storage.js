// Browser-only save layout. Portable JSON remains a complete, inlined dynasty.
// IndexedDB requests are queued inside request callbacks (never across awaits).
(function(root){
  'use strict';
  const CHUNK_SIZE = 128;
  const revisionOf = d => d ? (d.revision || `legacy:${d.savedAt || ''}`) : null;
  const token = () => Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join('-');

  function create({indexedDB = root.indexedDB, name = 'DynastyLabDB'} = {}) {
    function open() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, 2);
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
        const req = tx.objectStore('saves').get('main');
        req.onsuccess = () => {
          const d = req.result;
          if (d?.storageVersion && d.storageVersion !== 2) return fail(new Error('This browser save needs a newer game version.'));
          if (d?.storageVersion === 2 && (!validRef(d.archiveRef) || !d.revision))
            return fail(new Error('The saved archive reference is invalid. Use a complete JSON backup.'));
          done(d);
        };
      });
    }

    function readArchive(ref) {
      if (!validRef(ref)) return Promise.reject(new Error('Invalid archive reference.'));
      return transact(['saves', 'archives'], 'readonly', (tx, done, fail) => {
        const req = tx.objectStore('saves').get('main');
        req.onsuccess = () => {
          const current = req.result?.archiveRef;
          if (!current || current.id !== ref.id || current.count < ref.count || current.chunks < ref.chunks)
            return fail(new Error('The browser save was replaced in another tab. Load it again before opening history.'));
          const chunks = new Array(ref.chunks);
          let remaining = ref.chunks;
          if (!remaining) { done([]); return; }
          for (let i = 0; i < ref.chunks; i++) {
            const r = tx.objectStore('archives').get(i);
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

    // Archived careers are append-only. Ordinary saves write zero archive chunks.
    // A new/imported universe replaces both stores atomically; a loaded universe
    // must still match its last saved revision to avoid overwriting another tab.
    function save(snapshot, {expectedRevision = null, archiveRef = null, additions = []} = {}) {
      if (archiveRef && !validRef(archiveRef)) return Promise.reject(new Error('Invalid archive reference.'));
      return transact(['saves', 'archives'], 'readwrite', (tx, done, fail) => {
        const saves = tx.objectStore('saves'), archives = tx.objectStore('archives');
        const req = saves.get('main');
        req.onsuccess = () => {
          try {
            if (expectedRevision !== null && revisionOf(req.result) !== expectedRevision)
              return fail(new Error('Another tab changed this browser save. Export this dynasty or reload before saving.'));
            if (archiveRef && (req.result?.archiveRef?.id !== archiveRef.id
              || req.result.archiveRef.count !== archiveRef.count || req.result.archiveRef.chunks !== archiveRef.chunks))
              return fail(new Error('The saved archive changed. Reload before saving.'));
            let chunks = archiveRef?.chunks || 0;
            if (!archiveRef) archives.clear();
            for (let i = 0; i < additions.length; i += CHUNK_SIZE)
              archives.put(additions.slice(i, i + CHUNK_SIZE), chunks++);
            const ref = {id: archiveRef?.id || token(), count: (archiveRef?.count || 0) + additions.length, chunks};
            const {playerArchive, ...core} = snapshot.universe;
            const data = {...snapshot, universe: core, storageVersion: 2, archiveRef: ref, revision: token()};
            saves.put(data, 'main');
            done({revision: data.revision, archiveRef: ref});
          } catch (e) { fail(e); }
        };
      });
    }
    return {load, readArchive, save};
  }
  const api = {create, revisionOf};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DynastyStorage = api;
})(typeof window === 'object' ? window : globalThis);
