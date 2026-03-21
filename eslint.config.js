export default [
  {
    ignores: ["node_modules/", "public/images/"]
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        document: "readonly",
        fetch: "readonly",
        window: "readonly",
        setTimeout: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
];
