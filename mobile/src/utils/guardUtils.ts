export function passiveExhaustiveGuard(_value: never): never {
  return _value;
}

export function aggressiveExhaustiveGuard(value: never): never {
  throw new Error(`Exhaustive guard failed: ${value}`);
}
