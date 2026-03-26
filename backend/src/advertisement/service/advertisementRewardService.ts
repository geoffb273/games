import { ValidationError } from '@/schema/errors';

import {
  createAdvertisementRewardVerification as createAdvertisementRewardVerificationDao,
  getAdvertisementRewardVerification as getAdvertisementRewardVerificationDao,
} from '../dao/advertisementRewardVerificationDao';
import {
  AdvertisementRewardType,
  type AdvertisementRewardVerification,
  type CreateAdvertisementRewardVerificationInput,
  type GetAdvertisementRewardVerificationInput,
} from '../resource/advertisementRewardVerification';

/**
 * Validates input and creates an advertisement reward verification record.
 *
 * @throws {UnknownError} if the input type is invalid.
 * @throws {ValidationError} if type is PUZZLE_HINT and puzzleId is missing.
 */
export async function createAdvertisementRewardVerification(
  input: CreateAdvertisementRewardVerificationInput,
): Promise<AdvertisementRewardVerification> {
  if (input.type === AdvertisementRewardType.PUZZLE_HINT && input.puzzleId == null) {
    throw new ValidationError('puzzleId is required when type is PUZZLE_HINT');
  }
  return createAdvertisementRewardVerificationDao(input);
}

/**
 * Returns a usable verification for the given user and key, or rejects if invalid/expired.
 *
 * @throws {NotFoundError} if the verification is missing, expired, or not associated with the user and type.
 * @throws {UnknownError} if the type is invalid.
 * @throws {ValidationError} if type is PUZZLE_HINT and puzzleId is missing.
 */
export async function getAdvertisementRewardVerification({
  userId,
  uniqueKey,
  type,
  puzzleId,
}: GetAdvertisementRewardVerificationInput): Promise<AdvertisementRewardVerification> {
  if (type === AdvertisementRewardType.PUZZLE_HINT && puzzleId == null) {
    throw new ValidationError('puzzleId is required when type is PUZZLE_HINT');
  }
  return getAdvertisementRewardVerificationDao({ userId, uniqueKey, type, puzzleId });
}
