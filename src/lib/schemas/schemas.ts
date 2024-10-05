import { z } from "zod";

export const createSchema = z.object({
  internalIp: z.string(),
});
