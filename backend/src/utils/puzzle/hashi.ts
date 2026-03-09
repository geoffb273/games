import { type HashiPuzzleData } from '@/platform/puzzle/resource/puzzle';

import { createSeededRandom, shuffleArray, stringToSeed } from '../randomUtils';

type Island = { row: number; col: number; requiredBridges: number };

type Connection = {
  a: number;
  b: number;
  isHorizontal: boolean;
};

type ConnectionState = {
  min: number;
  max: number;
};

/**
 * Finds all valid connections between islands.
 * Two islands can be connected if they share a row or column
 * and no other island lies between them.
 */
function findConnections(islands: { row: number; col: number }[]): Connection[] {
  const connections: Connection[] = [];

  for (let i = 0; i < islands.length; i++) {
    for (let j = i + 1; j < islands.length; j++) {
      const a = islands[i];
      const b = islands[j];

      if (a.row === b.row) {
        const minCol = Math.min(a.col, b.col);
        const maxCol = Math.max(a.col, b.col);
        const blocked = islands.some(
          (other, k) =>
            k !== i && k !== j && other.row === a.row && other.col > minCol && other.col < maxCol,
        );
        if (!blocked) {
          connections.push({ a: i, b: j, isHorizontal: true });
        }
      } else if (a.col === b.col) {
        const minRow = Math.min(a.row, b.row);
        const maxRow = Math.max(a.row, b.row);
        const blocked = islands.some(
          (other, k) =>
            k !== i && k !== j && other.col === a.col && other.row > minRow && other.row < maxRow,
        );
        if (!blocked) {
          connections.push({ a: i, b: j, isHorizontal: false });
        }
      }
    }
  }

  return connections;
}

function connectionsCross(
  islands: { row: number; col: number }[],
  c1: Connection,
  c2: Connection,
): boolean {
  if (c1.isHorizontal === c2.isHorizontal) return false;

  const h = c1.isHorizontal ? c1 : c2;
  const v = c1.isHorizontal ? c2 : c1;

  const hRow = islands[h.a].row;
  const hMinCol = Math.min(islands[h.a].col, islands[h.b].col);
  const hMaxCol = Math.max(islands[h.a].col, islands[h.b].col);

  const vCol = islands[v.a].col;
  const vMinRow = Math.min(islands[v.a].row, islands[v.b].row);
  const vMaxRow = Math.max(islands[v.a].row, islands[v.b].row);

  return vCol > hMinCol && vCol < hMaxCol && hRow > vMinRow && hRow < vMaxRow;
}

/**
 * Builds a conflict graph identifying which connections would cross each other.
 */
function buildConflictGraph(
  islands: { row: number; col: number }[],
  connections: Connection[],
): Set<number>[] {
  const conflicts: Set<number>[] = connections.map(() => new Set());

  for (let i = 0; i < connections.length; i++) {
    for (let j = i + 1; j < connections.length; j++) {
      if (connectionsCross(islands, connections[i], connections[j])) {
        conflicts[i].add(j);
        conflicts[j].add(i);
      }
    }
  }

  return conflicts;
}

function isConnected(
  islandCount: number,
  connections: Connection[],
  bridgeCounts: number[],
): boolean {
  if (islandCount <= 1) return true;

  const adj: Set<number>[] = Array.from({ length: islandCount }, () => new Set());
  for (let ci = 0; ci < connections.length; ci++) {
    if (bridgeCounts[ci] > 0) {
      adj[connections[ci].a].add(connections[ci].b);
      adj[connections[ci].b].add(connections[ci].a);
    }
  }

  const visited = new Set<number>();
  const queue = [0];
  visited.add(0);

  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === islandCount;
}

/**
 * Constraint propagation for Hashi:
 * 1. Crossing: if a connection must have bridges (min > 0), all crossing connections are forced to 0
 * 2. Island sums: each island's required bridges constrains the min/max of its connections
 */
function propagate(
  state: ConnectionState[],
  islands: Island[],
  islandConnections: number[][],
  conflicts: Set<number>[],
): ConnectionState[] | null {
  const s = state.map((x) => ({ ...x }));

  let changed = true;
  while (changed) {
    changed = false;

    for (let ci = 0; ci < s.length; ci++) {
      if (s[ci].min > 0) {
        for (const conflictIdx of conflicts[ci]) {
          if (s[conflictIdx].max > 0) {
            s[conflictIdx].max = 0;
            if (s[conflictIdx].min > 0) return null;
            changed = true;
          }
        }
      }
    }

    for (let i = 0; i < islands.length; i++) {
      const required = islands[i].requiredBridges;
      const conns = islandConnections[i];

      let sumMin = 0;
      let sumMax = 0;
      for (const ci of conns) {
        sumMin += s[ci].min;
        sumMax += s[ci].max;
      }

      if (required < sumMin || required > sumMax) return null;

      for (const ci of conns) {
        const othersMin = sumMin - s[ci].min;
        const othersMax = sumMax - s[ci].max;

        const newMax = Math.min(s[ci].max, required - othersMin);
        const newMin = Math.max(s[ci].min, required - othersMax);

        if (newMin > newMax) return null;

        if (newMax < s[ci].max) {
          s[ci].max = newMax;
          changed = true;
        }
        if (newMin > s[ci].min) {
          s[ci].min = newMin;
          changed = true;
        }
      }
    }
  }

  return s;
}

/**
 * Core solver using constraint propagation + backtracking with MRV heuristic.
 * Finds up to maxSolutions distinct solutions.
 */
function solveHashiCore(
  islands: Island[],
  connections: Connection[],
  conflicts: Set<number>[],
  maxSolutions: number,
): number[][] {
  const islandConnections: number[][] = islands.map(() => []);
  for (let ci = 0; ci < connections.length; ci++) {
    islandConnections[connections[ci].a].push(ci);
    islandConnections[connections[ci].b].push(ci);
  }

  const solutions: number[][] = [];

  function solve(state: ConnectionState[]): void {
    if (solutions.length >= maxSolutions) return;

    const propagated = propagate(state, islands, islandConnections, conflicts);
    if (propagated === null) return;

    let bestIdx = -1;
    let bestRange = Infinity;
    for (let ci = 0; ci < propagated.length; ci++) {
      const range = propagated[ci].max - propagated[ci].min;
      if (range > 0 && range < bestRange) {
        bestRange = range;
        bestIdx = ci;
      }
    }

    if (bestIdx === -1) {
      const bridgeCounts = propagated.map((s) => s.min);
      if (isConnected(islands.length, connections, bridgeCounts)) {
        solutions.push(bridgeCounts);
      }
      return;
    }

    for (let v = propagated[bestIdx].min; v <= propagated[bestIdx].max; v++) {
      if (solutions.length >= maxSolutions) return;
      const newState = propagated.map((s) => ({ ...s }));
      newState[bestIdx] = { min: v, max: v };
      solve(newState);
    }
  }

  const initialState: ConnectionState[] = connections.map(() => ({ min: 0, max: 2 }));
  solve(initialState);

  return solutions;
}

// --- Public solver ---

type HashiBridge = {
  from: { row: number; col: number };
  to: { row: number; col: number };
  bridges: 1 | 2;
};

/**
 * Solves a Hashi puzzle and checks for unique solvability.
 *
 * Uses constraint propagation on island bridge counts and crossing constraints,
 * with backtracking (MRV heuristic) for undecided connections.
 */
export function solveHashi(islands: Island[]): { solvable: boolean; solution?: HashiBridge[] } {
  const positions = islands.map((i) => ({ row: i.row, col: i.col }));
  const connections = findConnections(positions);
  const conflicts = buildConflictGraph(positions, connections);

  const solutions = solveHashiCore(islands, connections, conflicts, 2);
  if (solutions.length !== 1) return { solvable: false };

  const bridgeCounts = solutions[0];
  const result: HashiBridge[] = [];

  for (let ci = 0; ci < connections.length; ci++) {
    if (bridgeCounts[ci] > 0) {
      const conn = connections[ci];
      result.push({
        from: { row: islands[conn.a].row, col: islands[conn.a].col },
        to: { row: islands[conn.b].row, col: islands[conn.b].col },
        bridges: bridgeCounts[ci] as 1 | 2,
      });
    }
  }

  return { solvable: true, solution: result };
}

/**
 * Places islands on the grid with minimum orthogonal spacing of 2
 * to ensure bridges have at least one intermediate cell.
 */
function placeIslands(
  width: number,
  height: number,
  count: number,
  random: () => number,
): { row: number; col: number }[] {
  const islands: { row: number; col: number }[] = [];

  const candidates: { row: number; col: number }[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      candidates.push({ row: r, col: c });
    }
  }

  const shuffled = shuffleArray(candidates, random);

  for (const pos of shuffled) {
    if (islands.length >= count) break;

    let tooClose = false;
    for (const existing of islands) {
      if (existing.row === pos.row && Math.abs(existing.col - pos.col) < 2) {
        tooClose = true;
        break;
      }
      if (existing.col === pos.col && Math.abs(existing.row - pos.row) < 2) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    islands.push(pos);
  }

  return islands;
}

/**
 * Generates a random valid bridge assignment by building a spanning tree
 * (ensuring connectivity) then optionally adding extra bridges for variety.
 *
 * @param doubleBridgeProb - probability that a spanning tree edge gets 2 bridges (vs 1)
 * @param extraBridgeProb - probability of adding a bridge on each unused non-conflicting connection
 */
function generateRandomSolution(
  islands: { row: number; col: number }[],
  connections: Connection[],
  conflicts: Set<number>[],
  random: () => number,
  doubleBridgeProb: number,
  extraBridgeProb: number,
): number[] | null {
  const bridgeCounts = new Array<number>(connections.length).fill(0);
  const blockedByConflict = new Set<number>();

  const ufRank = new Array<number>(islands.length).fill(0);
  const ufParent = new Array<number>(islands.length).fill(-1);

  function find(x: number): number {
    if (ufParent[x] === -1) return x;
    ufParent[x] = find(ufParent[x]);
    return ufParent[x];
  }

  function union(x: number, y: number): boolean {
    const rx = find(x);
    const ry = find(y);
    if (rx === ry) return false;
    if (ufRank[rx] < ufRank[ry]) {
      ufParent[rx] = ry;
    } else if (ufRank[rx] > ufRank[ry]) {
      ufParent[ry] = rx;
    } else {
      ufParent[ry] = rx;
      ufRank[rx]++;
    }
    return true;
  }

  const shuffledIndices = shuffleArray(
    connections.map((_, i) => i),
    random,
  );

  let edgesAdded = 0;
  for (const ci of shuffledIndices) {
    if (blockedByConflict.has(ci)) continue;
    const { a, b } = connections[ci];
    if (union(a, b)) {
      bridgeCounts[ci] = random() < doubleBridgeProb ? 2 : 1;
      for (const conflictIdx of conflicts[ci]) {
        blockedByConflict.add(conflictIdx);
      }
      edgesAdded++;
      if (edgesAdded === islands.length - 1) break;
    }
  }

  if (edgesAdded < islands.length - 1) return null;

  if (extraBridgeProb > 0) {
    for (const ci of shuffledIndices) {
      if (bridgeCounts[ci] > 0 || blockedByConflict.has(ci)) continue;
      if (random() < extraBridgeProb) {
        bridgeCounts[ci] = random() < doubleBridgeProb ? 2 : 1;
        for (const conflictIdx of conflicts[ci]) {
          blockedByConflict.add(conflictIdx);
        }
      }
    }
  }

  return bridgeCounts;
}

/**
 * When a solution isn't unique, compares two solutions to find where they differ,
 * then tries reducing or removing those specific bridges. Much cheaper than
 * trying all bridges since typically only 2-5 connections differ.
 */
function tryFixAmbiguity(
  positions: { row: number; col: number }[],
  connections: Connection[],
  conflicts: Set<number>[],
  bridgeCounts: number[],
  altSolution: number[],
  random: () => number,
): number[] | null {
  const diffIndices: number[] = [];
  for (let ci = 0; ci < bridgeCounts.length; ci++) {
    if (bridgeCounts[ci] !== altSolution[ci]) diffIndices.push(ci);
  }

  const shuffled = shuffleArray(diffIndices, random);

  for (const ci of shuffled) {
    const candidates: number[] = [];
    if (bridgeCounts[ci] === 2) candidates.push(1);
    if (bridgeCounts[ci] > 0) candidates.push(0);

    for (const newVal of candidates) {
      const modified = [...bridgeCounts];
      modified[ci] = newVal;

      if (!isConnected(positions.length, connections, modified)) continue;

      const islands: Island[] = positions.map((pos, i) => {
        let total = 0;
        for (let cj = 0; cj < connections.length; cj++) {
          if (connections[cj].a === i || connections[cj].b === i) {
            total += modified[cj];
          }
        }
        return { ...pos, requiredBridges: total };
      });
      if (islands.some((isl) => isl.requiredBridges === 0)) continue;

      const solutions = solveHashiCore(islands, connections, conflicts, 2);
      if (solutions.length === 1) return modified;
    }
  }

  return null;
}

// --- Main export ---

type GenerateHashiPuzzleDataOptions = {
  width: number;
  height: number;
  /** Optional seed for reproducibility */
  seed?: string | number;
  /** Target number of islands. Defaults to ~15% of grid cells (min 4). */
  islandCount?: number;
};

const ATTEMPTS_PER_TIER = 3000;
const MAX_ISLAND_REDUCTIONS = 6;

/**
 * Generates Hashi (bridges) puzzle data guaranteed to have a unique solution.
 *
 * For each attempt: places islands, generates a random spanning-tree-based bridge
 * assignment, and checks unique solvability. The double-bridge probability and
 * extra-bridge probability are randomized per attempt to maximise diversity.
 * Progressively reduces the island count if the target density is too hard.
 */
export function generateHashiPuzzleData({
  width,
  height,
  seed,
  islandCount,
}: GenerateHashiPuzzleDataOptions): HashiPuzzleData {
  const targetIslands = islandCount ?? Math.max(4, Math.floor(width * height * 0.15));

  for (let reduction = 0; reduction <= MAX_ISLAND_REDUCTIONS; reduction++) {
    const currentCount = targetIslands - reduction;
    if (currentCount < 4) break;

    for (let attempt = 0; attempt < ATTEMPTS_PER_TIER; attempt++) {
      const effectiveSeed = `${seed ?? Date.now()}-n${currentCount}-${attempt}`;
      const numericSeed = stringToSeed(effectiveSeed);
      const random = createSeededRandom(numericSeed);

      const doubleBridgeProb = 0.3 + random() * 0.4;
      const extraBridgeProb = random() < 0.7 ? 0 : random() * 0.2;

      const positions = placeIslands(width, height, currentCount, random);
      if (positions.length < 2) continue;

      const connections = findConnections(positions);
      if (connections.length === 0) continue;

      const conflicts = buildConflictGraph(positions, connections);

      const initialBridges = generateRandomSolution(
        positions,
        connections,
        conflicts,
        random,
        doubleBridgeProb,
        extraBridgeProb,
      );
      if (initialBridges === null) continue;

      const toIslands = (bc: number[]): Island[] =>
        positions.map((pos, i) => {
          let total = 0;
          for (let ci = 0; ci < connections.length; ci++) {
            if (connections[ci].a === i || connections[ci].b === i) {
              total += bc[ci];
            }
          }
          return { ...pos, requiredBridges: total };
        });

      let bridgeCounts = initialBridges;
      let islands = toIslands(bridgeCounts);

      if (islands.some((isl) => isl.requiredBridges === 0)) continue;

      const solutions = solveHashiCore(islands, connections, conflicts, 2);
      if (solutions.length === 0) continue;
      if (solutions.length > 1) {
        const altSolution =
          solutions.find((s) => s.some((v, i) => v !== bridgeCounts[i])) ?? solutions[1];
        const fixed = tryFixAmbiguity(
          positions,
          connections,
          conflicts,
          bridgeCounts,
          altSolution,
          random,
        );
        if (fixed === null) continue;
        bridgeCounts = fixed;
        islands = toIslands(bridgeCounts);
      }

      const solutionBridges: HashiPuzzleData['solution'] = [];
      for (let ci = 0; ci < connections.length; ci++) {
        if (bridgeCounts[ci] > 0) {
          const conn = connections[ci];
          solutionBridges.push({
            from: { row: islands[conn.a].row, col: islands[conn.a].col },
            to: { row: islands[conn.b].row, col: islands[conn.b].col },
            bridges: bridgeCounts[ci] as 1 | 2,
          });
        }
      }

      return {
        width,
        height,
        islands: islands.map((i) => ({
          row: i.row,
          col: i.col,
          requiredBridges: i.requiredBridges,
        })),
        solution: solutionBridges,
      };
    }
  }

  const minIslands = Math.max(4, targetIslands - MAX_ISLAND_REDUCTIONS);
  const totalAttempts = (targetIslands - minIslands + 1) * ATTEMPTS_PER_TIER;
  throw new Error(
    `Failed to generate a uniquely solvable Hashi puzzle after ${totalAttempts} attempts ` +
      `(tried ${targetIslands} down to ${minIslands} islands)`,
  );
}
