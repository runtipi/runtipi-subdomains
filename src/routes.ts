import { Hono } from "hono";
import {
  actionSchema,
  createSchema,
  editSchema,
  rateLimitSchema,
} from "./lib/schemas/schemas";
import { isIPInRangeOrPrivate } from "range_check";
import { RouteHelpers } from "./lib/helpers/route.helpers";
import { logger } from "./lib/utils/logger";
import { getConnInfo } from "hono/bun";
import type { CacheService } from "./lib/cache/cache.service";

export const setupRoutes = (
  app: Hono,
  routeHelpers: RouteHelpers,
  cacheService: CacheService,
) => {
  app.use(async (c, next) => {
    const info = getConnInfo(c);
    const rateLimitStatus = await routeHelpers.RateLimit(
      info.remote.address!.toString(),
    );

    if (rateLimitStatus.rateLimitError) {
      return c.json({ error: "Rate limit check error" }, 500);
    }

    if (rateLimitStatus.rateLimit) {
      return c.json({ error: "Rate limited" }, 429);
    }

    next();
  });

  app.get("healthcheck", (c) => c.json({ status: "ok" }));

  app.post("create", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await createSchema.safeParseAsync(bodyJson);

    logger.info("Validating body");

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    } else if (
      !isIPInRangeOrPrivate(parsedBody.data.internalIp, {
        ranges: "100.64.0.0/10",
      })
    ) {
      return c.json({ error: "Invalid IP" }, 400);
    }

    return c.json(await routeHelpers.CreateRecords(parsedBody.data.internalIp));
  });

  app.post("edit", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await editSchema.safeParseAsync(bodyJson);

    logger.info("Validating body");

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    } else if (
      !isIPInRangeOrPrivate(parsedBody.data.internalIp, {
        ranges: "100.64.0.0/10",
      })
    ) {
      return c.json({ error: "Invalid IP" }, 400);
    }

    return c.json(
      await routeHelpers.EditRecord(
        parsedBody.data.name,
        parsedBody.data.internalIp,
        parsedBody.data.token,
      ),
    );
  });

  app.post("delete", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await actionSchema.safeParseAsync(bodyJson);

    logger.info("Validating body");

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    }

    return c.json(
      await routeHelpers.DeleteRecord(
        parsedBody.data.name,
        parsedBody.data.token,
      ),
    );
  });

  app.post("renew", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await actionSchema.safeParseAsync(bodyJson);

    logger.info("Validating body");

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    }

    return c.json(
      await routeHelpers.Renew(parsedBody.data.name, parsedBody.data.token),
    );
  });

  app.post("get", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await actionSchema.safeParseAsync(bodyJson);

    logger.info("Validating body");

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    }

    return c.json(
      await routeHelpers.Get(parsedBody.data.name, parsedBody.data.token),
    );
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
};
