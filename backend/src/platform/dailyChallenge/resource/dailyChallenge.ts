export type DailyChallenge = {
  id: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DailyChallengeStreak = {
  current: number;
  max: number;
};
