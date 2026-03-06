export type HashiConnection = {
  a: number;
  b: number;
  isHorizontal: boolean;
};

/**
 * Finds all valid connections between islands.
 * Two islands can be connected if they share a row or column
 * and no other island lies between them.
 */
export function findConnections(islands: { row: number; col: number }[]): HashiConnection[] {
  const connections: HashiConnection[] = [];

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
