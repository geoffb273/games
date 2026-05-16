import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

type Listener = (isOnline: boolean) => void;

let latestIsOnline = true;
const listeners = new Set<Listener>();

function getIsOnlineFromState(state: NetInfoState): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

function setLatestIsOnline(nextIsOnline: boolean) {
  if (latestIsOnline === nextIsOnline) return;

  latestIsOnline = nextIsOnline;
  listeners.forEach((listener) => listener(nextIsOnline));
}

NetInfo.addEventListener((state) => {
  setLatestIsOnline(getIsOnlineFromState(state));
});

export function isOnline(): boolean {
  return latestIsOnline;
}

export function subscribeIsOnline(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setIsOnlineForTest(isOnlineForTest: boolean): void {
  setLatestIsOnline(isOnlineForTest);
}
