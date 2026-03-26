import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAdvertisementRewardVerification as createAdvertisementRewardVerificationDao,
  getAdvertisementRewardVerification as getAdvertisementRewardVerificationDao,
} from '@/advertisement/dao/advertisementRewardVerificationDao';
import { AdvertisementRewardType } from '@/advertisement/resource/advertisementRewardVerification';
import {
  createAdvertisementRewardVerification,
  getAdvertisementRewardVerification,
} from '@/advertisement/service/advertisementRewardService';
import { ValidationError } from '@/schema/errors';

vi.mock('@/advertisement/dao/advertisementRewardVerificationDao');

describe('advertisementRewardService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdvertisementRewardVerification', () => {
    it('throws ValidationError when type is PUZZLE_HINT and puzzleId is missing', async () => {
      await expect(
        getAdvertisementRewardVerification({
          userId: randomUUID(),
          uniqueKey: randomUUID(),
          type: AdvertisementRewardType.PUZZLE_HINT,
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(getAdvertisementRewardVerificationDao).not.toHaveBeenCalled();
    });
  });

  describe('createAdvertisementRewardVerification', () => {
    it('throws ValidationError when Zod validation fails', async () => {
      await expect(
        createAdvertisementRewardVerification({
          uniqueKey: '',
          admobTransactionId: randomUUID(),
          userId: randomUUID(),
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId: randomUUID(),
          expiresAt: new Date(),
        }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect(createAdvertisementRewardVerificationDao).not.toHaveBeenCalled();
    });

    it('calls DAO with parsed data when input is valid', async () => {
      const userId = randomUUID();
      const puzzleId = randomUUID();
      const uniqueKey = randomUUID();
      const admobTransactionId = randomUUID();
      const expiresAt = new Date(Date.now() + 60_000);

      vi.mocked(createAdvertisementRewardVerificationDao).mockImplementation(async (input) => {
        return {
          id: randomUUID(),
          uniqueKey: input.uniqueKey,
          admobTransactionId: input.admobTransactionId,
          userId: input.userId,
          puzzleId: input.puzzleId ?? null,
          expiresAt: input.expiresAt,
          type: input.type,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const result = await createAdvertisementRewardVerification({
        uniqueKey,
        admobTransactionId,
        userId,
        type: AdvertisementRewardType.PUZZLE_HINT,
        puzzleId,
        expiresAt,
      });

      expect(createAdvertisementRewardVerificationDao).toHaveBeenCalledWith(
        expect.objectContaining({
          uniqueKey,
          admobTransactionId,
          userId,
          type: AdvertisementRewardType.PUZZLE_HINT,
          puzzleId,
          expiresAt,
        }),
      );
      expect(result.uniqueKey).toBe(uniqueKey);
    });
  });
});
