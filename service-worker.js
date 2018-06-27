const cacheName = 'currency-converter-v1';
const urlsToCache = [
  '/',
  '/style.css',
  '/scripts/require.js',
  '/scripts/index.js',
  '/scripts/converter.js',
  '/scripts/IndexController.js',
  'https://fonts.gstatic.com/s/muli/v11/7Auwp_0qiz-afTLGLQjUwkQ.woff2',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css',
  'https://free.currencyconverterapi.com/api/v5/currencies'
];

// install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(urlsToCache);
    })
  )
});

// listen for fetch events
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/'));
      return;
    }
  }

  if (requestUrl.origin === "https://free.currencyconverterapi.com") {
    console.log('calling outside')
    if (requestUrl.pathname.endsWith('currencies')) {
      event.respondWith(serveCurrencies(event.request));
      return;
    }

    if (requestUrl.pathname.endsWith('convert')) {
      console.log('gotten x rate')
      // event.respondWith(serveExchangeRate(event.request));
      // return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});

const serveCurrencies = (request) => {
  const storageUrl = "api/v5/currencies";

  return caches.open(cacheName).then((cache) => {
    return cache.match(storageUrl).then((response) => {
      let networkFetch = fetch(request).then((networkResponse) => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });

      return response || networkFetch;
    });
  });
}

const serveExchangeRate = (request) => {
  const storageUrl = "api/v5/currencies";

  return caches.open(cacheName).then((cache) => {
    return cache.match(storageUrl).then((response) => {
      let networkFetch = fetch(request).then((networkResponse) => {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
      console.log(response || networkFetch)

      return response || networkFetch;
    });
  });
}
