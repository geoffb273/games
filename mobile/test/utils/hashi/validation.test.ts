import type { HashiConnection } from '@/utils/hashi/connections';
import { isHashiComplete } from '@/utils/hashi/validation';

function island(row: number, col: number, requiredBridges: number) {
  return { row, col, requiredBridges };
}

describe('isHashiComplete', () => {
  it('returns true for single island with no connections and required 0', () => {
    const islands = [island(0, 0, 0)];
    const connections: HashiConnection[] = [];
    const bridgeCounts: number[] = [];
    expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(true);
  });

  it('returns false when bridgeCounts length does not match connections length', () => {
    const islands = [island(0, 0, 1), island(0, 1, 1)];
    const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
    const bridgeCounts = [1, 0]; // length 2, connections length 1
    expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(false);
  });

  it('returns false when any bridge count is negative', () => {
    const islands = [island(0, 0, 0), island(0, 1, 0)];
    const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
    expect(isHashiComplete(islands, connections, [-1])).toBe(false);
  });

  it('returns false when any bridge count is greater than 2', () => {
    const islands = [island(0, 0, 1), island(0, 1, 1)];
    const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
    expect(isHashiComplete(islands, connections, [3])).toBe(false);
  });

  describe('island bridge sums', () => {
    it('returns false when an island has fewer incident bridges than required', () => {
      const islands = [island(0, 0, 2), island(0, 1, 2)];
      const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
      const bridgeCounts = [1]; // each island gets 1, but required 2
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(false);
    });

    it('returns false when an island has more incident bridges than required', () => {
      const islands = [island(0, 0, 1), island(0, 1, 1)];
      const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
      const bridgeCounts = [2]; // each island gets 2, but required 1
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(false);
    });

    it('returns true when every island has exactly its required incident bridges', () => {
      const islands = [island(0, 0, 1), island(0, 1, 1)];
      const connections: HashiConnection[] = [{ a: 0, b: 1, isHorizontal: true }];
      const bridgeCounts = [1];
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(true);
    });

    it('returns true for three islands in a row with correct sums', () => {
      const islands = [island(0, 0, 1), island(0, 1, 2), island(0, 2, 1)];
      const connections: HashiConnection[] = [
        { a: 0, b: 1, isHorizontal: true },
        { a: 1, b: 2, isHorizontal: true },
      ];
      const bridgeCounts = [1, 1]; // 0 gets 1, 1 gets 2, 2 gets 1
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(true);
    });
  });

  describe('connectivity', () => {
    it('returns false when graph is disconnected despite correct sums', () => {
      const islands = [island(0, 0, 1), island(0, 1, 1), island(0, 2, 1), island(0, 3, 1)];
      const connections: HashiConnection[] = [
        { a: 0, b: 1, isHorizontal: true },
        { a: 2, b: 3, isHorizontal: true },
      ];
      const bridgeCounts = [1, 1]; // two components: 0-1 and 2-3
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(false);
    });

    it('returns true when all islands are connected by bridges', () => {
      const islands = [island(0, 0, 1), island(0, 1, 2), island(0, 2, 1)];
      const connections: HashiConnection[] = [
        { a: 0, b: 1, isHorizontal: true },
        { a: 1, b: 2, isHorizontal: true },
      ];
      const bridgeCounts = [1, 1];
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(true);
    });

    it('returns false when some connections have zero bridges and graph is disconnected', () => {
      const islands = [island(0, 0, 1), island(0, 1, 1), island(0, 2, 1), island(0, 3, 1)];
      const connections: HashiConnection[] = [
        { a: 0, b: 1, isHorizontal: true },
        { a: 1, b: 2, isHorizontal: true },
        { a: 2, b: 3, isHorizontal: true },
      ];
      const bridgeCounts = [1, 0, 1]; // only 0-1 and 2-3 have bridges; 1-2 has 0
      expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(false);
    });
  });

  it('returns true for 2x2 grid fully connected with correct requirements', () => {
    const islands = [island(0, 0, 2), island(0, 2, 2), island(2, 0, 2), island(2, 2, 2)];
    const connections: HashiConnection[] = [
      { a: 0, b: 1, isHorizontal: true },
      { a: 2, b: 3, isHorizontal: true },
      { a: 0, b: 2, isHorizontal: false },
      { a: 1, b: 3, isHorizontal: false },
    ];
    const bridgeCounts = [1, 1, 1, 1]; // each island gets 2 (one from each neighbor)
    expect(isHashiComplete(islands, connections, bridgeCounts)).toBe(true);
  });
});
