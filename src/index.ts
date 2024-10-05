import Cloudflare from "cloudflare";
import { logger } from "./lib/utils/logger";
import { setupRoutes } from "./routes";
import { environment } from "./lib/env/env";
import { Hono } from "hono";
import { RouteHelpers } from "./lib/helpers/route.helpers";
import { CreateContainer } from "./inversify.config";
import { TYPES } from "./lib/types/types";

const cf = new Cloudflare({ apiToken: environment.cfToken });

const app = new Hono().basePath("/api");

const container = CreateContainer(cf);

const routerHelpers = container.get<RouteHelpers>(TYPES.RouteHelpers);

setupRoutes(app, routerHelpers);

Bun.serve({ fetch: app.fetch, port: 3000 });

logger.info("Server started on port 3000");
