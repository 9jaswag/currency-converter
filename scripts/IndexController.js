// export the IndexController using requirejs
define(function () {
  return IndexController;
});

class IndexController {
  constructor() {
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.register('service-worker.js').then((reg) => {
      console.log('service worker registered')
    }).catch((error) => {
      console.log('service worker registration failed', error)
    });
  }
}

