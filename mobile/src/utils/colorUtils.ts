function clampOpacity(opacity: number): number {
  return Math.max(0, Math.min(1, opacity));
}

/**
 * Returns a hex color (#RGB, #RRGGBB, #RRGGBBAA) as rgba() with the given opacity (0–1).
 */
function getHexColorWithOpacity(hexColor: string, opacity: number): string {
  const hexMatch = hexColor.match(/^#([0-9a-fA-F]{3,8})$/);
  if (!hexMatch) return `rgba(0, 0, 0, ${clampOpacity(opacity)})`;

  const hex = hexMatch[1];
  const clamped = clampOpacity(opacity);
  let r: number, g: number, b: number, a: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    a = clamped;
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = clamped;
  } else {
    // 8 chars: RRGGBBAA
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = (parseInt(hex.slice(6, 8), 16) / 255) * clamped;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Returns an rgb/rgba color as rgba() with the given opacity (0–1).
 * Existing alpha is multiplied by the provided opacity.
 */
function getRgbColorWithOpacity(rgbColor: string, opacity: number): string {
  const rgbMatch = rgbColor.match(
    /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)$/,
  );
  if (!rgbMatch) return `rgba(0, 0, 0, ${clampOpacity(opacity)})`;

  const r = parseInt(rgbMatch[1], 10);
  const g = parseInt(rgbMatch[2], 10);
  const b = parseInt(rgbMatch[3], 10);
  const alphaMatch = rgbColor.match(/,\s*([\d.]+)\s*\)$/);
  const existingAlpha = rgbColor.startsWith('rgba') ? parseFloat(alphaMatch?.[1] ?? '1') : 1;
  const a = existingAlpha * clampOpacity(opacity);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Returns the color as an rgba() string with the given opacity (0–1).
 * Supports hex (#RGB, #RRGGBB, #RRGGBBAA) and rgb/rgba() inputs.
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) return getHexColorWithOpacity(color, opacity);
  if (color.startsWith('rgb')) return getRgbColorWithOpacity(color, opacity);
  return `rgba(0, 0, 0, ${clampOpacity(opacity)})`;
}
