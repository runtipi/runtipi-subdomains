import { z } from "zod";

export const createSchema = z.object({
  internalIp: z.string(),
});

export const editSchema = z.object({
  name: z.string(),
  internalIp: z.string(),
  token: z.string(),
});

export const actionSchema = z.object({
  name: z.string(),
  token: z.string(),
});

export const configSchema = z.object({
  cloudflare: z.object({
    zoneId: z.string(),
    apiToken: z.string(),
  }),
  acme: z.object({
    accountUrl: z
      .string()
      .optional()
      .default("https://acme-v02.api.letsencrypt.org/directory"),
    accountKey: z.string(),
  }),
  server: z
    .object({
      port: z.number().optional().default(3000),
    })
    .optional()
    .default({
      port: 3000,
    }),
  jwt: z
    .object({
      enable: z.boolean(),
      secret: z.string(),
    })
    .optional()
    .default({
      enable: false,
      secret: "",
    }),
  rateLimit: z
    .object({
      enable: z.boolean().optional().default(true),
      apiLimit: z.number().optional().default(50),
      apiLimitExpiration: z.number().optional().default(60), // Minutes
      subdomainLimit: z.number().optional().default(5),
      subdomainLimitExpiration: z.number().optional().default(120), // Minutes
    })
    .optional()
    .default({
      enable: true,
      apiLimit: 50,
      apiLimitExpiration: 60, // Minutes
      subdomainLimit: 5,
      subdomainLimitExpiration: 120, // Minutes
    }),
  restricted: z
    .object({
      restrictedRecords: z.array(z.string()),
    })
    .optional()
    .default({
      restrictedRecords: [],
    }),
});

export const rateLimitSchema = z.object({
  requests: z.object({
    count: z.number(),
    expiration: z.number(),
  }),
  subdomains: z.object({
    count: z.number(),
    expiration: z.number(),
  }),
});

export type ConfigSchema = z.infer<typeof configSchema>;
