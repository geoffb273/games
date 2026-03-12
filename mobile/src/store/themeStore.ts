import { proxy, useSnapshot } from 'valtio';
import { z } from 'zod';

import { getStorage } from '@/storage/mmkv';

const ThemePreferenceSchema = z.enum(['light', 'dark']);

export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

const THEME_PREFERENCE_KEY = 'themePreference';

type ThemeState = {
  preference: ThemePreference;
};

const storage = getStorage();

function readInitialPreference(): ThemePreference {
  try {
    const raw = storage.getString(THEME_PREFERENCE_KEY);
    if (raw == null) return 'light';

    const parsed = ThemePreferenceSchema.safeParse(raw);
    if (!parsed.success) {
      return 'light';
    }

    return parsed.data;
  } catch {
    return 'light';
  }
}

const ThemeStore = proxy<ThemeState>({
  preference: readInitialPreference(),
});

export function useThemePreference(): ThemeState {
  return useSnapshot(ThemeStore);
}

export function getThemePreference(): ThemePreference {
  return ThemeStore.preference;
}

export function setThemePreference(next: ThemePreference): void {
  ThemeStore.preference = next;
  try {
    storage.set(THEME_PREFERENCE_KEY, next);
  } catch {
    // Persistence is best-effort; ignore write errors.
  }
}
