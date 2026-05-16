import {
  clearQueuedMutationsForTest,
  enqueueDeleteProgress,
  enqueueSolvePuzzle,
  processQueuedMutations,
  readQueuedMutations,
} from '@/client/mutationQueue/mutationQueue';
import { setIsOnlineForTest } from '@/client/networkState';
import { PuzzleType } from '@/generated/gql/graphql';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/storage/mmkv', () => {
  const storage = new Map<string, string>();

  return {
    __mockStorage: storage,
    getStorage: () => ({
      getString: (key: string) => storage.get(key),
      set: (key: string, value: string) => {
        storage.set(key, value);
      },
      delete: (key: string) => {
        storage.delete(key);
      },
    }),
  };
});

jest.mock('@/api/puzzle/puzzleHint', () => ({
  mapToPuzzleHint: (hint: unknown) => {
    if (typeof hint === 'object' && hint != null && '__typename' in hint) {
      return {
        puzzleType: 'HANJI',
        row: 0,
        col: 0,
        value: 1,
      };
    }
    return null;
  },
}));

jest.mock('@/client/newRelic', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

const { __mockStorage: mockStorage } = jest.requireMock('@/storage/mmkv') as {
  __mockStorage: Map<string, string>;
};

describe('mutationQueue', () => {
  beforeEach(() => {
    mockStorage.clear();
    setIsOnlineForTest(true);
  });

  it('persists queued mutations in FIFO order', () => {
    enqueueSolvePuzzle({
      puzzleId: 'puzzle-1',
      puzzleType: PuzzleType.Hanji,
      startedAt: new Date('2026-05-15T12:00:00.000Z'),
      completedAt: new Date('2026-05-15T12:01:00.000Z'),
      durationMs: 60000,
      hanjiSolution: [[1]],
    });
    enqueueDeleteProgress();

    expect(readQueuedMutations().map((item) => item.operation)).toEqual([
      'SolvePuzzle',
      'DeleteProgress',
    ]);
  });

  it('does not drain while offline', async () => {
    const client = { mutate: jest.fn() };
    enqueueDeleteProgress();
    setIsOnlineForTest(false);

    await processQueuedMutations({ client });

    expect(client.mutate).not.toHaveBeenCalled();
    expect(readQueuedMutations()).toHaveLength(1);
  });

  it('drains successful mutations in FIFO order', async () => {
    const client = {
      mutate: jest
        .fn()
        .mockResolvedValueOnce({
          data: { solvePuzzle: { __typename: 'MutationSolvePuzzleSuccess', data: {} } },
        })
        .mockResolvedValueOnce({
          data: { deleteProgress: { __typename: 'MutationDeleteProgressSuccess', data: true } },
        }),
    };
    const onDeleteProgressSynced = jest.fn();

    enqueueSolvePuzzle({
      puzzleId: 'puzzle-1',
      puzzleType: PuzzleType.Hanji,
      startedAt: new Date('2026-05-15T12:00:00.000Z'),
      completedAt: null,
      durationMs: null,
      hanjiSolution: null,
    });
    enqueueDeleteProgress();

    await processQueuedMutations({ client, onDeleteProgressSynced });

    expect(client.mutate).toHaveBeenCalledTimes(2);
    expect(onDeleteProgressSynced).toHaveBeenCalledTimes(1);
    expect(readQueuedMutations()).toEqual([]);
  });

  it('dequeues already-existing solve mutations as successful replays', async () => {
    const client = {
      mutate: jest.fn().mockResolvedValue({
        data: { solvePuzzle: { __typename: 'AlreadyExistsError', message: 'Already exists' } },
      }),
    };

    enqueueSolvePuzzle({
      puzzleId: 'puzzle-1',
      puzzleType: PuzzleType.Hanji,
      startedAt: new Date('2026-05-15T12:00:00.000Z'),
      completedAt: null,
      durationMs: null,
      hanjiSolution: null,
    });

    await processQueuedMutations({ client });

    expect(readQueuedMutations()).toEqual([]);
  });

  it('keeps a failed non-duplicate mutation queued for a future retry', async () => {
    const client = {
      mutate: jest.fn().mockResolvedValue({
        data: { deleteProgress: { __typename: 'UnknownError', message: 'Try later' } },
      }),
    };

    enqueueDeleteProgress();

    await processQueuedMutations({ client });

    expect(readQueuedMutations()).toHaveLength(1);

    clearQueuedMutationsForTest();

    expect(readQueuedMutations()).toEqual([]);
  });
});
