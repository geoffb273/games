import { proxy, useSnapshot } from 'valtio';
import { z } from 'zod';

import { getStorage } from '@/storage/mmkv';

const ColorBlindPreferenceSchema = z.enum(['on', 'off']);

export type ColorBlindPreference = z.infer<typeof ColorBlindPreferenceSchema>;

const COLOR_BLIND_PREFERENCE_KEY = 'colorBlindPreference';

type ColorBlindState = {
  preference: ColorBlindPreference;
};

const storage = getStorage();

function readInitialPreference(): ColorBlindPreference {
  try {
    const raw = storage.getString(COLOR_BLIND_PREFERENCE_KEY);
    if (raw == null) return 'off';

    const parsed = ColorBlindPreferenceSchema.safeParse(raw);
    if (!parsed.success) {
      return 'off';
    }

    return parsed.data;
  } catch {
    return 'off';
  }
}

const ColorBlindStore = proxy<ColorBlindState>({
  preference: readInitialPreference(),
});

export function useColorBlindPreference(): ColorBlindState {
  return useSnapshot(ColorBlindStore);
}

export function getColorBlindPreference(): ColorBlindPreference {
  return ColorBlindStore.preference;
}

export function useColorBlindEnabled(): boolean {
  const { preference } = useColorBlindPreference();
  return preference === 'on';
}

export function setColorBlindPreference(next: ColorBlindPreference): void {
  ColorBlindStore.preference = next;
  try {
    storage.set(COLOR_BLIND_PREFERENCE_KEY, next);
  } catch {
    // Persistence is best-effort; ignore write errors.
  }
}
