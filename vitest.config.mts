import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md
// (Vite 8 tsconfig yollarını kendisi çözer; vite-tsconfig-paths eklentisi gerekmez.)
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Next `server-only`'yi kendi derleyicisinde çözer; testte boş modül yeterli.
      "server-only": fileURLToPath(
        new URL(
          "./node_modules/next/dist/compiled/server-only/empty.js",
          import.meta.url,
        ),
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
