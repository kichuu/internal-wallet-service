import { z } from "zod";

export const createAccountSchema = z.object({
  externalId: z.string().max(255).optional(),
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  assetTypeId: z.string().uuid(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
