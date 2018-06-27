// use requirejs to include the converter and index controller file
requirejs(["converter", "IndexController"], (converter, IndexController) => {
  new IndexController();
  converter();
});
