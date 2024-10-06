import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const subdomains = sqliteTable("subdomains", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  subdomain: text("subdomain"),
  tokenHash: text("tokenHash"),
});
