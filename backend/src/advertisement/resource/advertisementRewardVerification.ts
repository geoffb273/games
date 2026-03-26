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
  type: AdvertisementRewardTypeValue;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdvertisementRewardVerificationInput = {
  uniqueKey: string;
  admobTransactionId: string;
  userId: string;
  expiresAt: Date;
  type: AdvertisementRewardTypeValue;
  puzzleId?: string | null;
};

export type GetAdvertisementRewardVerificationInput = {
  userId: string;
  uniqueKey: string;
  type: AdvertisementRewardTypeValue;
  puzzleId: string | null;
};
