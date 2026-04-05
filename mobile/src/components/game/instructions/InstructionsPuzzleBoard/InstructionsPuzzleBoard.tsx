import { type PuzzleType } from '@/api/puzzle/puzzle';
import { InstructionsFlowBoard } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsFlowBoard';
import { InstructionsHanjiBoard } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsHanjiBoard';
import { InstructionsHashiBoard } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsHashiBoard';
import { InstructionsMinesweeperBoard } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsMinesweeperBoard';
import { InstructionsSlitherlinkBoard } from '@/components/game/instructions/InstructionsPuzzleBoard/InstructionsSlitherlinkBoard';

export type InstructionsPuzzleBoardProps = {
  puzzleType: PuzzleType;
};

export function InstructionsPuzzleBoard({ puzzleType }: InstructionsPuzzleBoardProps) {
  switch (puzzleType) {
    case 'FLOW':
      return <InstructionsFlowBoard />;
    case 'HANJI':
      return <InstructionsHanjiBoard />;
    case 'HASHI':
      return <InstructionsHashiBoard />;
    case 'MINESWEEPER':
      return <InstructionsMinesweeperBoard />;
    case 'SLITHERLINK':
      return <InstructionsSlitherlinkBoard />;
  }
}
