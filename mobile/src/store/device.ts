import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'device_id';

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}
