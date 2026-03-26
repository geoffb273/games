import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { parseEnum } from '@/utils/enumUtils';
import {
  isAlreadyExistsError,
  isForeignKeyViolationError,
  isNotFoundError,
} from '@/utils/errorUtils';

import {
  AdvertisementRewardType,
  type AdvertisementRewardVerification,
  type CreateAdvertisementRewardVerificationInput,
  type GetAdvertisementRewardVerificationInput,
} from '../resource/advertisementRewardVerification';

const ADVERTISEMENT_REWARD_VERIFICATION_SELECT = {
  id: true,
  uniqueKey: true,
  admobTransactionId: true,
  userId: true,
  puzzleId: true,
  expiresAt: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdvertisementRewardVerificationSelect;

/**
 * Persists a new advertisement reward verification (e.g. from a webhook after ad completion).
 *
 * @throws {AlreadyExistsError} if uniqueKey or admobTransactionId already exists
 * @throws {NotFoundError} if a referenced foreign key is invalid (e.g. reward type)
 */
export async function createAdvertisementRewardVerification({
  uniqueKey,
  admobTransactionId,
  userId,
  type,
  expiresAt,
  puzzleId,
}: CreateAdvertisementRewardVerificationInput): Promise<AdvertisementRewardVerification> {
  return prisma.advertisementRewardVerification
    .create({
      data: {
        uniqueKey,
        admobTransactionId,
        userId,
        type,
        expiresAt,
        puzzleId,
      },
      select: ADVERTISEMENT_REWARD_VERIFICATION_SELECT,
    })
    .then(mapToAdvertisementRewardVerification)
    .catch((error) => {
      if (isAlreadyExistsError(error)) {
        throw new AlreadyExistsError(
          'Advertisement reward verification already exists for this unique key or AdMob transaction',
        );
      }
      if (isForeignKeyViolationError(error)) {
        throw new NotFoundError('User, puzzle, or advertisement reward type was not found');
      }
      throw error;
    });
}

/**
 * Loads a verification by uniqueKey and validates it belongs to the user, matches type,
 * is not expired, and (for PUZZLE_HINT) matches puzzleId.
 *
 * @throws {NotFoundError} if missing, expired, or not associated with the user and type.
 * @throws {UnknownError} if the type is invalid.
 */
export async function getAdvertisementRewardVerification({
  uniqueKey,
  userId,
  type,
  puzzleId,
}: GetAdvertisementRewardVerificationInput): Promise<AdvertisementRewardVerification> {
  return prisma.advertisementRewardVerification
    .findUniqueOrThrow({
      where: { uniqueKey, userId, type, puzzleId, expiresAt: { gte: new Date() } },
      select: ADVERTISEMENT_REWARD_VERIFICATION_SELECT,
    })
    .then(mapToAdvertisementRewardVerification)
    .catch((error) => {
      if (isNotFoundError(error)) {
        throw new NotFoundError('Advertisement reward verification not found');
      }
      throw error;
    });
}

/**
 * Maps a Prisma advertisement reward verification to a domain advertisement reward verification.
 * @returns The domain advertisement reward verification.
 * @throws {UnknownError} if the type is invalid.
 */
function mapToAdvertisementRewardVerification({
  id,
  uniqueKey,
  admobTransactionId,
  userId,
  puzzleId,
  expiresAt,
  type,
  createdAt,
  updatedAt,
}: Prisma.AdvertisementRewardVerificationGetPayload<{
  select: typeof ADVERTISEMENT_REWARD_VERIFICATION_SELECT;
}>): AdvertisementRewardVerification {
  return {
    id,
    uniqueKey,
    admobTransactionId,
    userId,
    puzzleId,
    expiresAt,
    type: parseEnum(AdvertisementRewardType, type),
    createdAt,
    updatedAt,
  };
}
