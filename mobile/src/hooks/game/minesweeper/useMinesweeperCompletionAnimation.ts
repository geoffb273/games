import { useEffect, useRef, useState } from 'react';

import { LOSS_REVEAL_DURATION_MS } from '@/components/game/MinesweeperBoard/MinesweeperCell';

type CompletionAnimationPhase = 'idle' | 'winWave' | 'lossReveal' | 'lossExplosion';

type UseMinesweeperCompletionAnimationInput = {
  isWin: boolean;
  isLoss: boolean;
  variant: 'play' | 'instructions';
};

type UseMinesweeperCompletionAnimationResult = {
  isCompletionAnimationActive: boolean;
  shouldRevealAllCells: boolean;
  isLossRevealActive: boolean;
};

export function useMinesweeperCompletionAnimation({
  isWin,
  isLoss,
  variant,
}: UseMinesweeperCompletionAnimationInput): UseMinesweeperCompletionAnimationResult {
  const [completionAnimationPhase, setCompletionAnimationPhase] =
    useState<CompletionAnimationPhase>('idle');
  const hasTriggeredCompletionAnimationRef = useRef(false);

  useEffect(() => {
    if (variant !== 'play' || (!isWin && !isLoss) || hasTriggeredCompletionAnimationRef.current)
      return;

    hasTriggeredCompletionAnimationRef.current = true;
    if (isLoss) {
      setCompletionAnimationPhase('lossReveal');
      const timeoutId = setTimeout(() => {
        setCompletionAnimationPhase('lossExplosion');
      }, LOSS_REVEAL_DURATION_MS);

      return () => clearTimeout(timeoutId);
    }

    setCompletionAnimationPhase('winWave');
  }, [isLoss, isWin, variant]);

  return {
    isCompletionAnimationActive:
      completionAnimationPhase === 'winWave' || completionAnimationPhase === 'lossExplosion',
    shouldRevealAllCells:
      completionAnimationPhase === 'lossReveal' || completionAnimationPhase === 'lossExplosion',
    isLossRevealActive: completionAnimationPhase === 'lossReveal',
  };
}
