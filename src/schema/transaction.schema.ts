import { z } from "zod";

export const topUpSchema = z.object({
  accountId: z.string().uuid(),
  assetTypeId: z.string().uuid(),
  amount: z.number().positive(),
  referenceId: z.string().max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const bonusSchema = z.object({
  accountId: z.string().uuid(),
  assetTypeId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const spendSchema = z.object({
  accountId: z.string().uuid(),
  assetTypeId: z.string().uuid(),
  amount: z.number().positive(),
  referenceId: z.string().max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TopUpInput = z.infer<typeof topUpSchema>;
export type BonusInput = z.infer<typeof bonusSchema>;
export type SpendInput = z.infer<typeof spendSchema>;
