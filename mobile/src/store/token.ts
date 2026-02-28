import * as SecureStore from 'expo-secure-store';
import { proxy, useSnapshot } from 'valtio';

const TOKEN_KEY = 'auth_token';

const AuthToken = proxy<{ token: string | null }>({ token: null });

/**
 * Returns the token from the store
 */
export function getToken(): string | null {
  if (AuthToken.token == null) {
    AuthToken.token = SecureStore.getItem(TOKEN_KEY);
  }
  return AuthToken.token;
}

/**
 * Read the token from the store and return it as a snapshot so changes trigger re renders
 */
export function useAuthToken(): { token: string | null } {
  return useSnapshot(AuthToken);
}

/**
 * Loads the token from store, saves it in memory and returns it
 */
export async function loadToken(): Promise<string | null> {
  AuthToken.token = await SecureStore.getItemAsync(TOKEN_KEY);
  return AuthToken.token;
}

/**
 * Saves the token to store and memory
 */
export async function saveToken(token: string): Promise<void> {
  AuthToken.token = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Clears the token from store and memory
 */
export async function clearToken(): Promise<void> {
  AuthToken.token = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
