import Cloudflare from "cloudflare";
import { logger } from "./lib/utils/logger";
import { setupRoutes } from "./routes";
import { Hono } from "hono";
import { RouteHelpers } from "./lib/helpers/route.helpers";
import { CacheService } from "./lib/cache/cache.service";
import { CreateContainer } from "./inversify.config";
import { ContainerTypes } from "./lib/types/types";
import { Config } from "./lib/config/config";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./lib/db/db";

logger.info("Migrating database");

var migrationsPath = "./src/migrations";

if (process.env.NODE_ENV === "production") {
  migrationsPath = "/app/migrations";
}

migrate(db, { migrationsFolder: migrationsPath });

logger.info("Migrations completed");

logger.info("Initializing");

const config = new Config().getConfig();

const cf = new Cloudflare({ apiToken: config.cloudflare.apiToken });

const container = CreateContainer(cf, config, db);

const app = new Hono().basePath("/api");

const routerHelpers = container.get<RouteHelpers>(ContainerTypes.RouteHelpers);

const cacheService = container.get<CacheService>(ContainerTypes.Cache);

setupRoutes(app, routerHelpers, cacheService);

logger.info("Starting server");

var port = 3000;

if (process.env.NODE_ENV === "production") {
  port = 80;
}

Bun.serve({ fetch: app.fetch, port: port });

logger.info(`Server started on port ${port}`);
