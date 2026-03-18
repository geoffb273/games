/* eslint-disable react-native/no-unused-styles */
import { type ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { type StyleProp, StyleSheet, Text as RNText, type TextStyle } from 'react-native';

import { Fonts } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

type FontWeight = 'bold' | 'semibold' | 'medium' | 'regular';
type Size = '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

type SemanticType = 'body' | 'emphasized_body' | 'caption' | 'h1' | 'h2' | 'h3' | 'lead';

type LineHeight = 'tight' | 'normal' | 'relaxed';
type FontFamily = 'sans' | 'serif';

type TextStyleProps =
  | {
      fontWeight?: FontWeight;
      size?: Size;
      lineHeight?: LineHeight;
      fontFamily?: FontFamily;
      type?: never;
    }
  | {
      fontWeight?: never;
      size?: never;
      lineHeight?: never;
      fontFamily?: FontFamily;
      type: SemanticType;
    };

export type TextColor =
  | 'text'
  | 'textSecondary'
  | 'success'
  | 'warning'
  | 'background'
  | 'error'
  | 'successText';

type TextProps = {
  children: ReactNode;
  numberOfLines?: number;
  color?: TextColor;
  _colorOverride?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  style?: StyleProp<TextStyle>;
  underlined?: boolean;
} & TextStyleProps;

export type { FontFamily, TextProps };

export function Text({
  children,
  numberOfLines,
  fontWeight: passedFontWeight,
  size: passedSize,
  lineHeight: passedLineHeight,
  fontFamily: passedFontFamily,
  type,
  color = 'text',
  _colorOverride,
  textAlign = 'left',
  style,
  underlined = false,
}: TextProps) {
  const theme = useTheme();

  let fontWeight: FontWeight = passedFontWeight ?? 'regular';
  let size: Size = passedSize ?? 'md';
  let lineHeight: LineHeight = passedLineHeight ?? 'normal';
  let fontFamily: FontFamily =
    passedFontFamily ?? (type != null ? semanticStyles[type].fontFamily : 'sans');

  const textColor = _colorOverride ?? theme[color];

  if (type != null) {
    fontWeight = semanticStyles[type].fontWeight;
    size = semanticStyles[type].size;
    lineHeight = semanticStyles[type].lineHeight;
  }

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        fontWeightStyles[fontWeight],
        sizeStyles[size],
        {
          lineHeight: LINE_HEIGHT[lineHeight] * sizeStyles[size].fontSize,
        },
        fontFamilyStyles[fontFamily],
        { color: textColor },
        { textAlign },
        underlined && { textDecorationLine: 'underline' },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

const semanticStyles: Record<
  SemanticType,
  {
    fontWeight: FontWeight;
    size: Size;
    lineHeight: LineHeight;
    fontFamily: FontFamily;
  }
> = {
  body: {
    fontWeight: 'regular',
    size: 'md',
    lineHeight: 'normal',
    fontFamily: 'sans',
  },
  emphasized_body: {
    fontWeight: 'semibold',
    size: 'md',
    lineHeight: 'normal',
    fontFamily: 'sans',
  },
  caption: {
    fontWeight: 'regular',
    size: 'sm',
    lineHeight: 'normal',
    fontFamily: 'sans',
  },
  h1: {
    fontWeight: 'bold',
    size: '3xl',
    lineHeight: 'tight',
    fontFamily: 'serif',
  },
  h2: {
    fontWeight: 'semibold',
    size: '2xl',
    lineHeight: 'tight',
    fontFamily: 'serif',
  },
  h3: {
    fontWeight: 'semibold',
    size: 'xl',
    lineHeight: 'normal',
    fontFamily: 'serif',
  },
  lead: {
    fontWeight: 'regular',
    size: 'lg',
    lineHeight: 'relaxed',
    fontFamily: 'serif',
  },
};

const LINE_HEIGHT: Record<LineHeight, number> = {
  tight: 1.1,
  normal: 1.3,
  relaxed: 1.6,
};

const fontWeightStyles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  semibold: {
    fontWeight: '600',
  },
  medium: {
    fontWeight: '500',
  },
  regular: {
    fontWeight: '400',
  },
});

const sizeStyles = StyleSheet.create({
  '3xl': {
    fontSize: 40,
  },
  '2xl': {
    fontSize: 32,
  },
  xl: {
    fontSize: 24,
  },
  lg: {
    fontSize: 20,
  },
  md: {
    fontSize: 16,
  },
  sm: {
    fontSize: 14,
  },
  xs: {
    fontSize: 12,
  },
});

const fontFamilyStyles = StyleSheet.create({
  sans: {
    fontFamily: Fonts.sans,
  },
  serif: {
    fontFamily: Fonts.serif,
  },
});
