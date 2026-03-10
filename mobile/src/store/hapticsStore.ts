import { proxy, useSnapshot } from 'valtio';
import { z } from 'zod';

import { getStorage } from '@/storage/mmkv';

const HapticsPreferenceSchema = z.enum(['on', 'off']);

export type HapticsPreference = z.infer<typeof HapticsPreferenceSchema>;

const HAPTICS_PREFERENCE_KEY = 'hapticsPreference';

type HapticsState = {
  preference: HapticsPreference;
};

const storage = getStorage();

function readInitialPreference(): HapticsPreference {
  try {
    const raw = storage.getString(HAPTICS_PREFERENCE_KEY);
    if (raw == null) return 'on';

    const parsed = HapticsPreferenceSchema.safeParse(raw);
    if (!parsed.success) {
      return 'on';
    }

    return parsed.data;
  } catch {
    return 'on';
  }
}

const HapticsStore = proxy<HapticsState>({
  preference: readInitialPreference(),
});

export function useHapticsPreference(): HapticsState {
  return useSnapshot(HapticsStore);
}

export function getHapticsPreference(): HapticsPreference {
  return HapticsStore.preference;
}

export function useHapticsEnabled(): boolean {
  const { preference } = useHapticsPreference();
  return preference === 'on';
}

export function setHapticsPreference(next: HapticsPreference): void {
  HapticsStore.preference = next;
  try {
    storage.set(HAPTICS_PREFERENCE_KEY, next);
  } catch {
    // Persistence is best-effort; ignore write errors.
  }
}
