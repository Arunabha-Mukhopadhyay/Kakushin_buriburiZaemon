// prisma.config.ts — Prisma 7 config file
// Connection URL lives here, NOT in schema.prisma datasource block.
// See: https://pris.ly/d/config-datasource

import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config"; // must be imported before process.env is read

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
