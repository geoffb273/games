import { type Router as ExpressRouter, Router } from 'express';
import { type Logger } from 'pino';
import { z } from 'zod';

import {
  AdvertisementRewardType,
  type CreateAdvertisementRewardVerificationInput,
} from '@/advertisement/resource/advertisementRewardVerification';
import { createAdvertisementRewardVerification } from '@/advertisement/service/advertisementRewardService';
import { logger } from '@/logger';
import { AdMobSsvVerificationError } from '@/schema/errors';
import { verifyAdMobSsvQueryString } from '@/utils/adMob/verify';
import { getNonEmptyString } from '@/utils/urlUtils';

const FIFTEEN_MINUTES_IN_MS = 1000 * 60 * 15;
const adMobCustomDataSchema = z.object({
  puzzleId: z.string().min(1),
  uniqueKey: z.string().min(1),
});

export const adMobWebhookRouter: ExpressRouter = Router();

adMobWebhookRouter.get('/ad-mob-verification', async (req, res) => {
  const q = req.originalUrl.indexOf('?');
  const rawQuery = q === -1 ? '' : req.originalUrl.slice(q + 1);

  if (!rawQuery) {
    logger.warn('AdMob SSV verification failed: Missing query string');
    res.status(400).json({ error: 'Missing query string' });
    return;
  }

  try {
    await verifyAdMobSsvQueryString({ rawQuery, logger });
  } catch (err) {
    logger.error({ err }, 'AdMob SSV verification failed');
    if (err instanceof AdMobSsvVerificationError) {
      res.status(403).json({ error: 'Verification failed' });
      return;
    }

    res.status(500).json({ error: 'Internal error' });
    return;
  }

  logger.info('AdMob SSV verification successful');
  res.status(200).json({ ok: true });

  const rewardVerificationInput = getRewardVerificationInput({
    query: req.query,
    logger,
  });
  if (rewardVerificationInput == null) {
    return;
  }

  void createAdvertisementRewardVerification(rewardVerificationInput).catch((err) => {
    logger.error(
      {
        err,
        ...rewardVerificationInput,
      },
      'createAdvertisementRewardVerification failed: Failed to create advertisement reward verification',
    );
  });
});

function getRewardVerificationInput({
  query,
  logger: baseLogger,
}: {
  query: Record<string, unknown>;
  logger: Logger;
}): CreateAdvertisementRewardVerificationInput | null {
  const transactionId = getNonEmptyString(query.transaction_id);
  const userId = getNonEmptyString(query.user_id);
  const customData = getNonEmptyString(query.custom_data);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const logger = baseLogger.child({ query, transactionId, userId, customData });

  let puzzleId: string | undefined;
  let uniqueKey: string | undefined;
  if (customData != null) {
    try {
      const customDataJson: unknown = JSON.parse(customData);
      const parsedCustomData = adMobCustomDataSchema.parse(customDataJson);
      puzzleId = parsedCustomData.puzzleId;
      uniqueKey = parsedCustomData.uniqueKey;
    } catch (err) {
      logger.error(
        { err },
        'createAdvertisementRewardVerification failed: Failed to parse custom data',
      );
      return null;
    }
  }

  if (transactionId == null || userId == null || puzzleId == null || uniqueKey == null) {
    logger.error(
      { puzzleId, uniqueKey },
      'createAdvertisementRewardVerification failed: Missing required fields',
    );
    return null;
  }

  return {
    admobTransactionId: transactionId,
    userId,
    puzzleId,
    uniqueKey,
    expiresAt: new Date(Date.now() + FIFTEEN_MINUTES_IN_MS),
    type: AdvertisementRewardType.PUZZLE_HINT,
  };
}
