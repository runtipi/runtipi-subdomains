import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

var dbPath = "db.sqlite";

if (process.env.NODE_ENV === "production") {
  dbPath = "/data/db.sqlite";
}

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema: schema });
