import { Hono } from "hono";
import { actionSchema, createSchema, editSchema } from "./lib/schemas/schemas";
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

    return c.json(
      await routerHelpers.EditRecord(
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
      await routerHelpers.DeleteRecord(
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
      await routerHelpers.Renew(parsedBody.data.name, parsedBody.data.token),
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
      await routerHelpers.Get(parsedBody.data.name, parsedBody.data.token),
    );
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
};
