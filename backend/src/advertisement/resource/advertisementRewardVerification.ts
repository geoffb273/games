import { z } from 'zod';

export const AdvertisementRewardType = {
  PUZZLE_HINT: 'PUZZLE_HINT',
} as const;
export type AdvertisementRewardTypeValue =
  (typeof AdvertisementRewardType)[keyof typeof AdvertisementRewardType];

export type AdvertisementRewardVerification = {
  id: string;
  uniqueKey: string;
  admobTransactionId: string;
  userId: string;
  puzzleId: string | null;
  expiresAt: Date;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export const createAdvertisementRewardVerificationInputSchema = z
  .object({
    uniqueKey: z.string().min(1),
    admobTransactionId: z.string().min(1),
    userId: z.string().uuid(),
    type: z.string().min(1),
    expiresAt: z.date(),
    puzzleId: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === AdvertisementRewardType.PUZZLE_HINT) {
      if (data.puzzleId == null) {
        ctx.addIssue({
          code: 'custom',
          message: 'puzzleId is required when type is PUZZLE_HINT',
        });
      }
    } else if (data.puzzleId != null) {
      ctx.addIssue({
        code: 'custom',
        message: 'puzzleId must not be set for this reward type',
      });
    }
  });

export type CreateAdvertisementRewardVerificationInput = z.infer<
  typeof createAdvertisementRewardVerificationInputSchema
>;
