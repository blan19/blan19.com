import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // CLI (db push) uses the direct, non-pooled connection
    url: process.env.POSTGRES_URL_NON_POOLING,
  },
});
