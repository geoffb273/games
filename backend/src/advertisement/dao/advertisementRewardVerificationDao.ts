import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import {
  isAlreadyExistsError,
  isForeignKeyViolationError,
  isNotFoundError,
} from '@/utils/errorUtils';

import {
  AdvertisementRewardType,
  type AdvertisementRewardVerification,
  type CreateAdvertisementRewardVerificationInput,
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

function mapToAdvertisementRewardVerification(
  row: Prisma.AdvertisementRewardVerificationGetPayload<{
    select: typeof ADVERTISEMENT_REWARD_VERIFICATION_SELECT;
  }>,
): AdvertisementRewardVerification {
  return {
    id: row.id,
    uniqueKey: row.uniqueKey,
    admobTransactionId: row.admobTransactionId,
    userId: row.userId,
    puzzleId: row.puzzleId,
    expiresAt: row.expiresAt,
    type: row.type,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Persists a new advertisement reward verification (e.g. from a webhook after ad completion).
 *
 * @throws {AlreadyExistsError} if uniqueKey or admobTransactionId already exists
 * @throws {NotFoundError} if a referenced foreign key is invalid (e.g. reward type)
 */
export async function createAdvertisementRewardVerification(
  input: CreateAdvertisementRewardVerificationInput,
): Promise<AdvertisementRewardVerification> {
  const { uniqueKey, admobTransactionId, userId, type, expiresAt, puzzleId } = input;

  return prisma.advertisementRewardVerification
    .create({
      data: {
        uniqueKey,
        admobTransactionId,
        userId,
        type,
        expiresAt,
        puzzleId: puzzleId ?? null,
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

type GetAdvertisementRewardVerificationDaoInput = {
  uniqueKey: string;
  userId: string;
  type: string;
  puzzleId?: string | null;
};

/**
 * Loads a verification by uniqueKey and validates it belongs to the user, matches type,
 * is not expired, and (for PUZZLE_HINT) matches puzzleId.
 *
 * @throws {NotFoundError} if missing, expired, or authorization/context checks fail
 */
export async function getAdvertisementRewardVerification({
  uniqueKey,
  userId,
  type,
  puzzleId,
}: GetAdvertisementRewardVerificationDaoInput): Promise<AdvertisementRewardVerification> {
  return prisma.advertisementRewardVerification
    .findUniqueOrThrow({
      where: { uniqueKey },
      select: ADVERTISEMENT_REWARD_VERIFICATION_SELECT,
    })
    .then((row) => {
      if (row.userId !== userId) {
        throw new NotFoundError('Advertisement reward verification not found');
      }
      if (row.type !== type) {
        throw new NotFoundError('Advertisement reward verification not found');
      }
      if (row.expiresAt <= new Date()) {
        throw new NotFoundError('Advertisement reward verification not found');
      }
      if (type === AdvertisementRewardType.PUZZLE_HINT) {
        if (puzzleId == null || row.puzzleId !== puzzleId) {
          throw new NotFoundError('Advertisement reward verification not found');
        }
      }
      return mapToAdvertisementRewardVerification(row);
    })
    .catch((error) => {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (isNotFoundError(error)) {
        throw new NotFoundError('Advertisement reward verification not found');
      }
      throw error;
    });
}
