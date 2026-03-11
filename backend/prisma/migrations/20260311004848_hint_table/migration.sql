-- CreateTable
CREATE TABLE "UserPuzzleHint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "puzzleId" UUID NOT NULL,

    CONSTRAINT "UserPuzzleHint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPuzzleHint_puzzleId_idx" ON "UserPuzzleHint"("puzzleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPuzzleHint_userId_puzzleId_key" ON "UserPuzzleHint"("userId", "puzzleId");
