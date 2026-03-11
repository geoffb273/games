import { View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { type PuzzleType } from '@/api/puzzle/puzzle';
import { GameInstructionsView } from '@/components/view/GameInstructionsView';
import { useTheme } from '@/hooks/useTheme';

type InstructionsParams = {
  type: PuzzleType;
};

export default function InstructionsScreen() {
  const theme = useTheme();
  const { type } = useLocalSearchParams<InstructionsParams>();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <GameInstructionsView puzzleType={type} />
    </View>
  );
}
