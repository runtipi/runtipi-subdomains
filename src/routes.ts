import { Hono } from "hono";
import { newSchema } from "./lib/schemas/schemas";
import type Cloudflare from "cloudflare";
import { CheckAvailableRecord, CreateRecord, GetCfDomain } from "./lib/cloudflare/cloudflare";
import { v4 as uuidv4 } from 'uuid';
import { isIPInRangeOrPrivate } from "range_check";

const CreateRecords = async (internalIp: string, cf: Cloudflare) => {
    const baseDomain = await GetCfDomain(cf)
    const uuid = uuidv4()
    const record = `${uuid}.${baseDomain}`
    const recordWildcard = `*.${record}`
    if (await CheckAvailableRecord(record, cf) && await CheckAvailableRecord(recordWildcard, cf)) {
        await CreateRecord(record, internalIp, cf)
        await CreateRecord(recordWildcard, internalIp, cf)
        return { success: true, message: "Record created", data: { subdomain: record } }
    }
    return { success: false, message: "Record already exists", data: { subdomain: "" } }
}

export const setupRoutes = (app: Hono, cf: Cloudflare) => {
    app.get("healthcheck", (c) => c.json({ status: "ok" }))

    app.post("new", async (c) => {
        const bodyJson = await c.req.json()
        const parsedBody = await newSchema.safeParseAsync(bodyJson)
        if (parsedBody.error) {
            return c.json({ error: "Invalid input" }, 400)
        }
        if (!isIPInRangeOrPrivate(parsedBody.data.internalIp, { ranges: '100.64.0.0/10' })) {
            return c.json({ error: "Invalid IP" }, 400)
        }
        return c.json(await CreateRecords(parsedBody.data.internalIp, cf))
    })

    app.notFound((c) => c.json({ error: "Not found" }, 404))
}