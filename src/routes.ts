import { Hono } from "hono";
import { createSchema, deleteSchema, editSchema } from "./lib/schemas/schemas";
import { isIPInRangeOrPrivate } from "range_check";
import type { RouteHelpers } from "./lib/helpers/route.helpers";
import { logger } from "./lib/utils/logger";

export const setupRoutes = (app: Hono, routerHelpers: RouteHelpers) => {
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

    logger.info("Creating record");

    return c.json(
      await routerHelpers.CreateRecords(parsedBody.data.internalIp),
    );
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

    logger.info("Editing record");

    return c.json(
      await routerHelpers.EditRecord(
        parsedBody.data.name,
        parsedBody.data.internalIp,
      ),
    );
  });

  app.post("delete", async (c) => {
    const bodyJson = await c.req.json();

    logger.info("Parsing body");

    const parsedBody = await deleteSchema.safeParseAsync(bodyJson);

    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    }

    logger.info("Deleting record");

    return c.json(await routerHelpers.DeleteRecord(parsedBody.data.name));
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
};
