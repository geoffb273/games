import { getColorWithOpacity } from '@/utils/colorUtils';

describe('getColorWithOpacity', () => {
  describe('hex colors', () => {
    it('expands 3-digit hex and applies opacity', () => {
      expect(getColorWithOpacity('#abc', 1)).toBe('rgba(170, 187, 204, 1)');
      expect(getColorWithOpacity('#f00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('parses 6-digit hex and applies opacity', () => {
      expect(getColorWithOpacity('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
      expect(getColorWithOpacity('#00FF00', 0.25)).toBe('rgba(0, 255, 0, 0.25)');
    });

    it('parses 8-digit hex, multiplies embedded alpha by opacity', () => {
      expect(getColorWithOpacity('#ffffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
      expect(getColorWithOpacity('#ff0000ff', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(getColorWithOpacity('#ff000080', 1)).toBe('rgba(255, 0, 0, 0.5019607843137255)');
    });

    it('accepts mixed-case hex digits', () => {
      expect(getColorWithOpacity('#AaBbCc', 1)).toBe('rgba(170, 187, 204, 1)');
    });

    it('falls back to black when hex format is invalid', () => {
      expect(getColorWithOpacity('#gg0000', 0.75)).toBe('rgba(0, 0, 0, 0.75)');
      expect(getColorWithOpacity('#12', 1)).toBe('rgba(0, 0, 0, 1)');
      expect(getColorWithOpacity(' #ff0000', 1)).toBe('rgba(0, 0, 0, 1)');
    });
  });

  describe('rgb / rgba colors', () => {
    it('parses rgb() and applies opacity as alpha', () => {
      expect(getColorWithOpacity('rgb(10, 20, 30)', 1)).toBe('rgba(10, 20, 30, 1)');
      expect(getColorWithOpacity('rgb(10, 20, 30)', 0.5)).toBe('rgba(10, 20, 30, 0.5)');
    });

    it('allows flexible whitespace in rgb()', () => {
      expect(getColorWithOpacity('rgb(  1 , 2 , 3  )', 1)).toBe('rgba(1, 2, 3, 1)');
    });

    it('multiplies existing rgba alpha by opacity', () => {
      expect(getColorWithOpacity('rgba(255, 0, 0, 0.5)', 0.5)).toBe('rgba(255, 0, 0, 0.25)');
      expect(getColorWithOpacity('rgba(0, 0, 0, 1)', 0.25)).toBe('rgba(0, 0, 0, 0.25)');
    });

    it('falls back to black when rgb string does not match', () => {
      expect(getColorWithOpacity('rgb(1,2)', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(getColorWithOpacity('RGB(0, 0, 0)', 1)).toBe('rgba(0, 0, 0, 1)');
    });
  });

  describe('unsupported color strings', () => {
    it('returns black with clamped opacity for non-hex, non-rgb inputs', () => {
      expect(getColorWithOpacity('', 0.8)).toBe('rgba(0, 0, 0, 0.8)');
      expect(getColorWithOpacity('hsl(0, 100%, 50%)', 1)).toBe('rgba(0, 0, 0, 1)');
      expect(getColorWithOpacity('red', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('opacity clamping', () => {
    it('clamps opacity below 0 to 0', () => {
      expect(getColorWithOpacity('#000000', -1)).toBe('rgba(0, 0, 0, 0)');
      expect(getColorWithOpacity('rgb(1, 2, 3)', -0.1)).toBe('rgba(1, 2, 3, 0)');
    });

    it('clamps opacity above 1 to 1', () => {
      expect(getColorWithOpacity('#000000', 2)).toBe('rgba(0, 0, 0, 1)');
      expect(getColorWithOpacity('rgb(1, 2, 3)', 1.5)).toBe('rgba(1, 2, 3, 1)');
    });
  });
});
