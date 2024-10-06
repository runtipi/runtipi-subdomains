import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database("db.sqlite");

export const db = drizzle(sqlite, { schema: schema });
