// ============================================================
// db.js — IndexedDB wrapper
// ============================================================
window.App = window.App || {};

(function() {
  const App = window.App;
  const DB_NAME = 'suishouji-db';
  const DB_VERSION = 1;
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (event.oldVersion < 1) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
          notesStore.createIndex('byDate', 'createdAt', { unique: false });
          notesStore.createIndex('byType', 'type', { unique: false });
          notesStore.createIndex('byTitle', 'aiTitle', { unique: false });
          notesStore.createIndex('byTag', 'aiTags', { unique: false, multiEntry: true });
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
      request.onblocked = () => console.warn('IndexedDB blocked');
    });
    return dbPromise;
  }

  App.saveNote = async function(note) {
    const db = await openDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const record = { ...note, createdAt: note.createdAt || Date.now(), updatedAt: Date.now() };
    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  App.getAllNotes = async function(options = {}) {
    const db = await openDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const index = store.index('byDate');
    const { startDate, endDate, limit = 100, offset = 0 } = options;
    let range = null;
    if (startDate !== undefined && endDate !== undefined) {
      range = IDBKeyRange.bound(startDate, endDate);
    }
    const notes = [];
    let count = 0, skipped = 0;
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range, 'prev');
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) { resolve(notes); return; }
        if (skipped < offset) { skipped++; cursor.continue(); return; }
        notes.push(cursor.value);
        count++;
        if (count >= limit) { resolve(notes); return; }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  };

  App.getNotesByDate = async function(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return App.getAllNotes({ startDate: start.getTime(), endDate: end.getTime(), limit: 1000 });
  };

  App.searchNotes = async function(query, limit = 100) {
    if (!query || !query.trim()) return App.getAllNotes({ limit });
    const db = await openDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const index = store.index('byDate');
    const q = query.trim().toLowerCase();
    const results = [];
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor || results.length >= limit) { resolve(results); return; }
        const note = cursor.value;
        const searchable = [note.textContent || '', note.voiceTranscript || '', note.aiTitle || '', ...(note.aiTags || [])].join(' ').toLowerCase();
        if (searchable.includes(q)) results.push(note);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  };

  App.getNoteCounts = async function() {
    const db = await openDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const counts = { total: 0, text: 0, image: 0, voice: 0 };
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) { resolve(counts); return; }
        counts.total++;
        const type = cursor.value.type;
        if (counts[type] !== undefined) counts[type]++;
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  };

  App.deleteNote = async function(id) {
    const db = await openDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  App.getNoteById = async function(id) {
    const db = await openDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  App.getSetting = async function(key) {
    const db = await openDB();
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => reject(request.error);
    });
  };

  App.setSetting = async function(key, value) {
    const db = await openDB();
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  };

  App.getStorageUsage = async function() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return { usage: estimate.usage || 0, quota: estimate.quota || 0, percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0 };
    }
    return { usage: 0, quota: 0, percent: 0 };
  };

})();
