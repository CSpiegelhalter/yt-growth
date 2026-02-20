const path = require("path");

module.exports = {
  options: {
    tsConfig: { fileName: path.resolve(__dirname, "apps/web/tsconfig.depcruise.json") },
    doNotFollow: { path: "node_modules" },
    includeOnly: "^apps/web",
    reporterOptions: {
      dot: { theme: { graph: { rankdir: "LR" } } },
    },
  },
};