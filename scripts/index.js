// use requirejs to require the index controller file
requirejs(["IndexController", "Chart.bundle.min"], (IndexController, Chart) => {
  new IndexController(Chart);
});
