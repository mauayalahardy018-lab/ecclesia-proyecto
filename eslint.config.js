export default [
  {
    files: ["src/**/*.js", "tests/**/*.js", "scripts/**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { process: "readonly", console: "readonly", Buffer: "readonly", fetch: "readonly", AbortSignal: "readonly" } },
    rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_" }], "no-undef": "error", "no-constant-condition": "error" }
  }
];
