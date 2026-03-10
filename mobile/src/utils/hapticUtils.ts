import * as Haptics from 'expo-haptics';

const HAPTIC_THROTTLE_MS = 40;

let lastHapticTs = 0;

function canTriggerHaptic() {
  const now = Date.now();
  if (now - lastHapticTs < HAPTIC_THROTTLE_MS) return false;
  lastHapticTs = now;
  return true;
}

export function triggerHapticLight() {
  if (!canTriggerHaptic()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function triggerHapticMedium() {
  if (!canTriggerHaptic()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function triggerHapticHard() {
  if (!canTriggerHaptic()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
