import { type Puzzle } from '@/api/puzzle/puzzle';

import { GameViewFlowBoard } from './GameViewFlowBoard';
import { GameViewHanjiBoard } from './GameViewHanjiBoard';
import { GameViewHashiBoard } from './GameViewHashiBoard';
import { GameViewMinesweeperBoard } from './GameViewMinesweeperBoard';
import { GameViewSlitherlinkBoard } from './GameViewSlitherlinkBoard';

export type GameViewPuzzleBoardProps = {
  puzzle: Puzzle;
  onBoardAnimationComplete: () => void;
};

export function GameViewPuzzleBoard({
  puzzle,
  onBoardAnimationComplete,
}: GameViewPuzzleBoardProps) {
  switch (puzzle.type) {
    case 'FLOW':
      return <GameViewFlowBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />;
    case 'HANJI':
      return <GameViewHanjiBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />;
    case 'HASHI':
      return <GameViewHashiBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />;
    case 'MINESWEEPER':
      return (
        <GameViewMinesweeperBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />
      );
    case 'SLITHERLINK':
      return (
        <GameViewSlitherlinkBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />
      );
  }
}
