const path = require("path");

module.exports = {
  forbidden: [
    {
      name: "features-no-adapters",
      comment: "lib/features/ must NOT import from lib/adapters/",
      severity: "error",
      from: { path: "^apps/web/lib/features/" },
      to: { path: "^apps/web/lib/adapters/" },
    },
    {
      name: "features-no-components",
      comment: "lib/features/ must NOT import from components/ or app/",
      severity: "error",
      from: { path: "^apps/web/lib/features/" },
      to: { path: "^apps/web/(components|app)/" },
    },
    {
      name: "adapters-no-features",
      comment: "lib/adapters/ must NOT import from lib/features/",
      severity: "error",
      from: { path: "^apps/web/lib/adapters/" },
      to: { path: "^apps/web/lib/features/" },
    },
    {
      name: "adapters-no-components-or-app",
      comment: "lib/adapters/ must NOT import from components/ or app/",
      severity: "error",
      from: { path: "^apps/web/lib/adapters/" },
      to: { path: "^apps/web/(components|app)/" },
    },
    {
      name: "ports-pure-types",
      comment: "lib/ports/ must NOT import from features, adapters, or components",
      severity: "error",
      from: { path: "^apps/web/lib/ports/" },
      to: { path: "^apps/web/lib/(features|adapters)|^apps/web/components/" },
    },
    {
      name: "shared-leaf-layer",
      comment: "lib/shared/ must NOT import from features, adapters, or components",
      severity: "error",
      from: { path: "^apps/web/lib/shared/" },
      to: { path: "^apps/web/lib/(features|adapters)|^apps/web/components/" },
    },
    {
      name: "ui-no-adapters",
      comment: "components/ui/ must NOT import from lib/adapters/ or app/",
      severity: "error",
      from: { path: "^apps/web/components/ui/" },
      to: { path: "^apps/web/(lib/adapters|app)/" },
    },
  ],
  options: {
    tsConfig: { fileName: path.resolve(__dirname, "apps/web/tsconfig.depcruise.json") },
    doNotFollow: { path: "node_modules" },
    includeOnly: "^apps/web",
    reporterOptions: {
      dot: { theme: { graph: { rankdir: "LR" } } },
    },
  },
};