import Cloudflare from "cloudflare";
import { logger } from "./lib/utils/logger";
import { setupRoutes } from "./routes";
import { Hono } from "hono";
import { RouteHelpers } from "./lib/helpers/route.helpers";
import { CreateContainer } from "./inversify.config";
import { ContainerTypes } from "./lib/types/types";
import { AcmeHelpers } from "./lib/helpers/acme.helpers";
import { Config } from "./lib/config/config";

const config = new Config().getConfig();

const cf = new Cloudflare({ apiToken: config.cloudflare.apiToken });

const container = CreateContainer(cf, config);

const acme = container.get<AcmeHelpers>(ContainerTypes.AcmeHelpers);

const app = new Hono().basePath("/api");

const routerHelpers = container.get<RouteHelpers>(ContainerTypes.RouteHelpers);

setupRoutes(app, routerHelpers);

Bun.serve({ fetch: app.fetch, port: 3000 });

logger.info("Server started on port 3000");
