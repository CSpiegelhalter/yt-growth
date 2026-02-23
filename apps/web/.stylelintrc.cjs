module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-css-modules"],
  plugins: ["stylelint-order"],
  rules: {
    "declaration-no-important": true,
    "selector-max-id": 0,
    "selector-max-universal": 0,
    "selector-class-pattern": null,
    "order/properties-alphabetical-order": true,
    "custom-property-pattern": null,
    "keyframes-name-pattern": null,
    "value-keyword-case": ["lower", { ignoreProperties: ["composes"] }],
    "no-descending-specificity": null,
    "alpha-value-notation": null,
    "color-function-notation": null,
    "color-function-alias-notation": null,
    "media-feature-range-notation": null,
  },
};
