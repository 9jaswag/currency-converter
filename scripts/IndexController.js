// export the IndexController using requirejs
define(function (require) {
  // require the Converter class
  const Converter = require('./converter');
  return IndexController;
});

class IndexController {
  constructor() {
    this.registerServiceWorker();
    new Converter();
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

