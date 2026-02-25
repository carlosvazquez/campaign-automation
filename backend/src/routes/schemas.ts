/** @file Zod validation schemas for campaign route request bodies and their inferred DTO types */

import { z } from 'zod';

/** Zod schema for validating POST /api/campaigns request bodies. */
export const CreateCampaignSchema = z.object({
  name: z.string().min(3).max(100),
  budget: z.number().positive().min(1),
  creativities: z.array(z.string().min(1)).min(1),
  audience: z
    .array(
      z.object({
        field: z.enum(['country', 'device', 'age_range']),
        value: z.string().min(1),
      }),
    )
    .min(1),
  rule: z.object({
    metric:   z.string().min(1),
    operator: z.enum(['<', '>', '=', '>=', '<=']),
    value:    z.number(),
    action:   z.enum(['pause', 'scale_up', 'alert']),
  }),
});

/** Validated and typed payload for creating a campaign. */
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>;

/** Zod schema for validating POST /api/campaigns/:id/simulate request bodies. */
export const SimulateInputSchema = z.object({
  metric: z.string().min(1),
  value:  z.number(),
});

/** Validated and typed payload for simulating a campaign rule. */
export type SimulateInputDto = z.infer<typeof SimulateInputSchema>;
