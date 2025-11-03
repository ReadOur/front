export default {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react-refresh", "react-hooks", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  env: { browser: true, es2023: true, node: true },
  rules: {
    "prettier/prettier": "warn",
    "react-refresh/only-export-components": "off",
  },
};
