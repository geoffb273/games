-- DropIndex
DROP INDEX "UserPuzzleHint_userId_puzzleId_key";

-- CreateIndex
CREATE INDEX "UserPuzzleHint_userId_puzzleId_idx" ON "UserPuzzleHint"("userId", "puzzleId");
