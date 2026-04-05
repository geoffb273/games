import { PlaytimeClockProvider } from '@/provider/PlaytimeClockProvider';

import {
  GameViewPuzzleBoard,
  type GameViewPuzzleBoardProps,
} from './GameViewPuzzleBoard/GameViewPuzzleBoard';
import {
  InstructionsPuzzleBoard,
  type InstructionsPuzzleBoardProps,
} from './instructions/InstructionsPuzzleBoard/InstructionsPuzzleBoard';

type PuzzleBoardProps =
  | ({
      variant: 'game-view';
    } & GameViewPuzzleBoardProps)
  | ({
      variant: 'instructions';
    } & InstructionsPuzzleBoardProps);

export function PuzzleBoard(props: PuzzleBoardProps) {
  return (
    <PlaytimeClockProvider>
      {props.variant === 'game-view' ? (
        <GameViewPuzzleBoard {...props} />
      ) : (
        <InstructionsPuzzleBoard {...props} />
      )}
    </PlaytimeClockProvider>
  );
}
