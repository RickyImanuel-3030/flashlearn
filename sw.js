/**
 * FlashLearn HTML - Service Worker
 * Provides offline support and caching for PWA
 */

const CACHE_NAME = 'flashlearn-v142';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/data.js',
    './js/audio.js',
    './js/app.js',
    './js/pages/splash.js',
    './js/pages/home.js',
    './js/pages/flashlearn.js',
    './js/pages/flashcard.js',
    './js/pages/quiz.js',
    './assets/logo.png',
    './assets/app-icon.png',
    './assets/bgm.wav?v=3',
    './assets/card-flip.wav',
    './assets/card-swipe.wav',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './manifest.json'
];

// Install - Cache all essential assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app shell v2...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate - Clean up old caches immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Network first, fallback to cache for full offline PWA support
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});
