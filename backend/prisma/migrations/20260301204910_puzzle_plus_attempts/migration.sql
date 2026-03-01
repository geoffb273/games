-- CreateTable
CREATE TABLE "PuzzleType" (
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuzzleType_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Puzzle" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dailyChallengeId" UUID NOT NULL,
    "type" UUID NOT NULL,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPuzzleAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "userId" UUID NOT NULL,
    "puzzleId" UUID NOT NULL,

    CONSTRAINT "UserPuzzleAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PuzzleType_type_key" ON "PuzzleType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "Puzzle_type_idx" ON "Puzzle"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Puzzle_dailyChallengeId_type_key" ON "Puzzle"("dailyChallengeId", "type");

-- CreateIndex
CREATE INDEX "UserPuzzleAttempt_puzzleId_idx" ON "UserPuzzleAttempt"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPuzzleAttempt_userId_puzzleId_key" ON "UserPuzzleAttempt"("userId", "puzzleId");
