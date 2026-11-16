import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations use Neon's DIRECT (non-pooled) connection.
// The running app uses the POOLED DATABASE_URL via the pg adapter (src/lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` needs no URL; migrate commands do.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
