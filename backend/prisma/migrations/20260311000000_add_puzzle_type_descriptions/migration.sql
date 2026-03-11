-- Populate descriptions for existing puzzle types

UPDATE "PuzzleType"
SET "description" = 'Connect matching colors without crossing paths.'
WHERE "type" = 'FLOW';

UPDATE "PuzzleType"
SET "description" = 'Fill the grid to reveal a hidden picture.'
WHERE "type" = 'HANJI';

UPDATE "PuzzleType"
SET "description" = 'Draw bridges to connect all the islands.'
WHERE "type" = 'HASHI';

UPDATE "PuzzleType"
SET "description" = 'Clear the board without detonating any mines.'
WHERE "type" = 'MINESWEEPER';

UPDATE "PuzzleType"
SET "description" = 'Draw a single loop that satisfies all the clues.'
WHERE "type" = 'SLITHERLINK';

