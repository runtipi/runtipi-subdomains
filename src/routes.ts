import { Hono } from "hono";
import { createSchema } from "./lib/schemas/schemas";
import { isIPInRangeOrPrivate } from "range_check";
import type { RouteHelpers } from "./lib/helpers/route.helpers";

export const setupRoutes = (app: Hono, routerHelpers: RouteHelpers) => {
  app.get("healthcheck", (c) => c.json({ status: "ok" }));

  app.post("create", async (c) => {
    const bodyJson = await c.req.json();
    const parsedBody = await createSchema.safeParseAsync(bodyJson);
    if (parsedBody.error) {
      return c.json({ error: "Invalid input" }, 400);
    }
    if (
      !isIPInRangeOrPrivate(parsedBody.data.internalIp, {
        ranges: "100.64.0.0/10",
      })
    ) {
      return c.json({ error: "Invalid IP" }, 400);
    }
    return c.json(routerHelpers.CreateRecords(parsedBody.data.internalIp));
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));
};
