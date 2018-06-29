// export the IndexController using requirejs
define(function (require) {
  // require the Converter class
  const Converter = require('./converter');
  return IndexController;
});

class IndexController {
  constructor(chart) {
    this.registerServiceWorker();
    this.converter = new Converter(chart);
  }

  registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('service-worker.js', { scope: '/currency-converter/' }).then((reg) => {
      console.log('service worker registered')
      this.converter.populateSelectFields();

      if (!navigator.serviceWorker.controller) return;

      if (reg.waiting) {
        this.updateReady(reg.waiting);
        return;
      }

      if (reg.installing) {
        this.trackInstalling(reg.installing);
        return;
      }

      reg.addEventListener('updatefound', () => {
        this.trackInstalling(reg.installing);
      });

    }).catch((error) => {
      console.log('service worker registration failed', error)
    });

    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }

  updateReady(worker) {
    const approveUpdate = confirm('New updates available');
    if (!approveUpdate) {
      return;
    }
    worker.postMessage({ action: 'skipWaiting' });
  }

  trackInstalling(worker) {
    worker.addEventListener('statechange', () => {
      if (worker.state == 'installed') {
        this.updateReady(worker);
      }
    });
  }
}

