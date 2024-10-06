import { z } from "zod";

export const createSchema = z.object({
  internalIp: z.string(),
});

export const editSchema = z.object({
  name: z.string(),
  internalIp: z.string(),
  token: z.string(),
});

export const deleteSchema = z.object({
  name: z.string(),
  token: z.string(),
});

export const configSchema = z.object({
  cloudflare: z.object({
    zoneId: z.string().length(32),
    apiToken: z.string().length(40),
  }),
  acme: z.object({
    accountUrl: z.string().length(57),
    accountKey: z.string().length(1708),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
