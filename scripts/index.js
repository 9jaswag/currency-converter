// use requirejs to include the converter and index controller file
requirejs(["converter", "IndexController"], (undefined, IndexController) => {
  new IndexController()
});
