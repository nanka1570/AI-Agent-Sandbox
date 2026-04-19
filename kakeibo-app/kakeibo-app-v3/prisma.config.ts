import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Missing required environment variable: DIRECT_URL or DATABASE_URL");
}

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: { url },
});
