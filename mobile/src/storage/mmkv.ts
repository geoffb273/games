import { MMKV } from 'react-native-mmkv';

let storage: MMKV | null = null;

export function getStorage(): MMKV {
  if (storage == null) {
    storage = new MMKV({
      id: 'games-storage',
    });
  }
  return storage;
}
