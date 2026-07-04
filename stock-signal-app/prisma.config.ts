import path from "node:path";
import { defineConfig } from "prisma/config";

// ローカル SQLite。マイグレーションもこのファイルを直接参照する
// DATABASE_FILE はプロジェクトルートからの相対パス（E2E 用 DB の切り替えに使う）
const file = process.env.DATABASE_FILE ?? path.join("prisma", "dev.db");

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: { url: "file:" + path.join(__dirname, file) },
});
