import { defineConfig } from "vitest/config";
import deno from "@deno/vite-plugin";

export default defineConfig({
  plugins: [deno()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
