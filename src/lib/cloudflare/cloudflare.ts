import type Cloudflare from "cloudflare"
import { environment } from "../env/env"

export const CheckAvailableRecord = async (domain: string, cf: Cloudflare) => {
    const records = await cf.dns.records.list({ zone_id: environment.cfZoneId })
    for (const record of records.result) {
        if (record.name === domain) {
            return false
        }
    }
    return true
}

export const CreateRecord = async (domain: string, ip: string, cf: Cloudflare) => {
    return await cf.dns.records.create({ zone_id: environment.cfZoneId, name: domain, type: "A", content: ip })
}

export const GetCfDomain = async (cf: Cloudflare) => {
    const zone = await cf.zones.get({ zone_id: environment.cfZoneId })
    return zone.name
}