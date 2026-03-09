import type { HashiConnection } from './connections';

type Island = { row: number; col: number };

/**
 * Returns true if the two bridge segments cross in the interior
 * (not at an island). Only axis-aligned segments are considered;
 * they cross iff one is horizontal and one is vertical and the
 * crossing point lies strictly between both segments' endpoints.
 */
export function doBridgesCross(
  conn1: HashiConnection,
  conn2: HashiConnection,
  islands: Island[],
): boolean {
  if (conn1.isHorizontal === conn2.isHorizontal) {
    return false;
  }

  const horizontal = conn1.isHorizontal ? conn1 : conn2;
  const vertical = conn1.isHorizontal ? conn2 : conn1;

  const hr = islands[horizontal.a].row;
  const hcMin = Math.min(islands[horizontal.a].col, islands[horizontal.b].col);
  const hcMax = Math.max(islands[horizontal.a].col, islands[horizontal.b].col);

  const vc = islands[vertical.a].col;
  const vrMin = Math.min(islands[vertical.a].row, islands[vertical.b].row);
  const vrMax = Math.max(islands[vertical.a].row, islands[vertical.b].row);

  return vrMin < hr && hr < vrMax && hcMin < vc && vc < hcMax;
}

/**
 * Returns true if adding a bridge on the given connection would cross
 * any existing bridge (any other connection with bridgeCounts >= 1).
 */
export function wouldNewBridgeCrossExisting(
  connectionIndex: number,
  connections: HashiConnection[],
  bridgeCounts: number[],
  islands: Island[],
): boolean {
  const conn = connections[connectionIndex];
  if (!conn) return false;

  for (let j = 0; j < connections.length; j++) {
    if (j === connectionIndex || bridgeCounts[j] < 1) continue;
    if (doBridgesCross(conn, connections[j], islands)) return true;
  }
  return false;
}
