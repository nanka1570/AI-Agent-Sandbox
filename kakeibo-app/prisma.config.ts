import { config } from "dotenv";
// .env.local を優先して読み込む（Supabase の認証情報）
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // マイグレーションは直接接続（DIRECT_URL）を使用
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"]!,
  },
});
