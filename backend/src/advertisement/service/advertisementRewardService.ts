import { type ZodError } from 'zod';

import { ValidationError } from '@/schema/errors';

import {
  createAdvertisementRewardVerification as createAdvertisementRewardVerificationDao,
  getAdvertisementRewardVerification as getAdvertisementRewardVerificationDao,
} from '../dao/advertisementRewardVerificationDao';
import {
  AdvertisementRewardType,
  type AdvertisementRewardVerification,
  createAdvertisementRewardVerificationInputSchema,
} from '../resource/advertisementRewardVerification';

/**
 * Validates input and creates an advertisement reward verification record.
 *
 * @throws {ValidationError} if the payload fails Zod validation
 */
export async function createAdvertisementRewardVerification(
  input: unknown,
): Promise<AdvertisementRewardVerification> {
  const parsed = createAdvertisementRewardVerificationInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(formatZodError(parsed.error));
  }
  return createAdvertisementRewardVerificationDao(parsed.data);
}

type GetAdvertisementRewardVerificationInput = {
  userId: string;
  uniqueKey: string;
  type: string;
  puzzleId?: string | null;
};

/**
 * Returns a usable verification for the given user and key, or rejects if invalid/expired.
 *
 * @throws {ValidationError} if type is PUZZLE_HINT and puzzleId is missing
 */
export async function getAdvertisementRewardVerification(
  input: GetAdvertisementRewardVerificationInput,
): Promise<AdvertisementRewardVerification> {
  const { userId, uniqueKey, type, puzzleId } = input;
  if (type === AdvertisementRewardType.PUZZLE_HINT && puzzleId == null) {
    throw new ValidationError('puzzleId is required when type is PUZZLE_HINT');
  }
  return getAdvertisementRewardVerificationDao({ userId, uniqueKey, type, puzzleId });
}

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => i.message).join('; ');
}
