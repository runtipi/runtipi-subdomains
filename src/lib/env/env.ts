import { z } from 'zod';

const environmentSchema = z.object({
    CF_API_KEY: z.string(),
    CF_ZONE_ID: z.string(),
}).transform((data) => {
    return {
        cfToken: data.CF_API_KEY,
        cfZoneId: data.CF_ZONE_ID   
    }
});

export const environment = environmentSchema.parse(process.env);