// ============================================================
// sw.js — Service Worker (cache-first for app shell)
// ============================================================

const CACHE_NAME = 'suishouji-v2';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/animations.css',
  './js/utils.js',
  './js/db.js',
  './js/state.js',
  './js/ai.js',
  './js/components/calendar-strip.js',
  './js/components/search-bar.js',
  './js/components/voice-recorder.js',
  './js/components/image-uploader.js',
  './js/components/note-card.js',
  './js/components/timeline.js',
  './js/components/tab-bar.js',
  './js/components/charts.js',
  './js/pages/home.js',
  './js/pages/memory-bank.js',
  './js/pages/profile.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});
