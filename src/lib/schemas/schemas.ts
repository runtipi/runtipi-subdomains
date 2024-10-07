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

export const renewSchema = z.object({
  name: z.string(),
  token: z.string(),
});

export const configSchema = z.object({
  cloudflare: z.object({
    zoneId: z.string(),
    apiToken: z.string(),
  }),
  acme: z.object({
    accountUrl: z.string(),
    accountKey: z.string(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
