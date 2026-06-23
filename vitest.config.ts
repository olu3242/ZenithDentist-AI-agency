import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/agent-os/**/*.ts", "lib/automation/detectors.ts"]
    }
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "tests/agent-os/__mocks__/server-only.ts"),
      "@": path.resolve(__dirname, ".")
    }
  }
});
