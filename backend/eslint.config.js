const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["coverage/**", "reports/**", "node_modules/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.jest } },
  },
];
