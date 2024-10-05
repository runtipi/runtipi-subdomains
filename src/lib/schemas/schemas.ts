import { record, z } from "zod";

export const createSchema = z.object({
  internalIp: z.string(),
});

export const editSchema = z.object({
  name: z.string(),
  internalIp: z.string(),
});

export const deleteSchema = z.object({
  name: z.string(),
});
