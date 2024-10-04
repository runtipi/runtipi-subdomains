import { z } from 'zod';

export const newSchema = z.object({
  internalIp: z.string(),
});