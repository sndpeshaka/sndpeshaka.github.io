// ==================== MEMBER SERVICE WORKER ====================
// Version: 1.0.0
// This service worker enables offline support and faster loading

const CACHE_VERSION = 'member-portal-v1.0.0';
const CACHE_NAME = CACHE_VERSION;

// Files to cache for offline use
const FILES_TO_CACHE = [
    // Core HTML files
    './member-dashboard.html',
    './member-login.html',
    './member-edit-home.html',
    
    // CSS files
    '../css/bootstrap.min.css',
    '../css/bootstrap-icons.min.css',
    '../css/select2.min.css',
    '../css/select2-bootstrap-5-theme.min.css',
    '../css/flatpickr.min.css',
    '../css/sweetalert2.min.css',
    '../css/dataTables.bootstrap5.min.css',
    
    // JS files
    '../js/jquery.min.js',
    '../js/bootstrap.bundle.min.js',
    '../js/select2.min.js',
    '../js/flatpickr.min.js',
    '../js/sweetalert2.all.min.js',
    '../js/jquery.dataTables.min.js',
    '../js/dataTables.bootstrap5.min.js',
    '../js/jspdf.umd.min.js',
    '../js/jspdf.plugin.autotable.min.js',
    
    // Icons
    '../images/favicon.svg',
    'icons/icon-72x72.png',
    'icons/icon-96x96.png',
    'icons/icon-128x128.png',
    'icons/icon-144x144.png',
    'icons/icon-152x152.png',
    'icons/icon-192x192.png',
    'icons/icon-384x384.png',
    'icons/icon-512x512.png',
    'icons/apple-touch-icon.png'
];

// Install event - cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching files...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Cache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Removing old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API requests
    if (event.request.url.includes('sheets.googleapis.com') || 
        event.request.url.includes('script.google.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached response if found
                if (cachedResponse) {
                    // Fetch in background to update cache
                    fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, networkResponse);
                                    });
                            }
                        })
                        .catch(() => {
                            // Network request failed, stale cache is fine
                        });
                    return cachedResponse;
                }
                
                // Not in cache - fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses
                        if (response && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Network request failed - fallback
                        return new Response('Network request failed', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Handle push notifications (optional)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Member Portal', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('./member-dashboard.html')
        );
    }
});

// Log service worker events
console.log('📱 Member Portal Service Worker loaded');