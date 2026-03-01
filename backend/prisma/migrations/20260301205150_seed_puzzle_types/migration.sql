-- Seed PuzzleType table with initial values
INSERT INTO "PuzzleType" ("type", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  ('HANJI', 'Hanji', NULL, true, NOW(), NOW()),
  ('HASHI', 'Hashi', NULL, true, NOW(), NOW()),
  ('MINESWEEPER', 'Minesweeper', NULL, true, NOW(), NOW());
