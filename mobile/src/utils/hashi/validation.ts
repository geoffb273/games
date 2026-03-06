import type { HashiConnection } from './connections';

function isConnected(
  islandCount: number,
  connections: HashiConnection[],
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
 * True when every island has exactly its required number of bridge ends
 * (sum of incident bridge counts) and all islands are connected by bridges.
 */
export function isHashiComplete(
  islands: { row: number; col: number; requiredBridges: number }[],
  connections: HashiConnection[],
  bridgeCounts: number[],
): boolean {
  if (bridgeCounts.length !== connections.length) return false;

  const islandSums = islands.map(() => 0);
  for (let ci = 0; ci < connections.length; ci++) {
    const count = bridgeCounts[ci];
    if (count < 0 || count > 2) return false;
    islandSums[connections[ci].a] += count;
    islandSums[connections[ci].b] += count;
  }

  for (let i = 0; i < islands.length; i++) {
    if (islandSums[i] !== islands[i].requiredBridges) return false;
  }

  return isConnected(islands.length, connections, bridgeCounts);
}
