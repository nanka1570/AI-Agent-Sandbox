import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // コンポーネントテストはファイル先頭の @vitest-environment jsdom で切替
    include: ["__tests__/unit/**/*.test.ts", "__tests__/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
