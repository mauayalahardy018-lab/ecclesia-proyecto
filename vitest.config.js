import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/domain/*.js"],
      skipFull: false,
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 }
    }
  }
});
