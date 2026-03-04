/* eslint-disable react-native/no-unused-styles */
import { type ReactNode } from 'react';
// eslint-disable-next-line no-restricted-imports
import { StyleSheet, Text as RNText } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

type FontWeight = 'bold' | 'semibold' | 'medium' | 'regular';
type Size = '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

type SemanticType = 'body' | 'emphasized_body' | 'caption' | 'h1' | 'h2' | 'h3' | 'lead';

type LineHeight = 'tight' | 'normal' | 'relaxed';

type TextStyleProps =
  | {
      fontWeight?: FontWeight;
      size?: Size;
      lineHeight?: LineHeight;
      type?: never;
    }
  | {
      fontWeight?: never;
      size?: never;
      lineHeight?: never;
      type: SemanticType;
    };

type TextProps = {
  children: ReactNode;
  numberOfLines?: number;
  color?: 'text' | 'textSecondary';
  _colorOverride?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
} & TextStyleProps;

export function Text({
  children,
  numberOfLines,
  fontWeight: passedFontWeight,
  size: passedSize,
  lineHeight: passedLineHeight,
  type,
  color = 'text',
  _colorOverride,
  textAlign = 'left',
}: TextProps) {
  const theme = useTheme();

  let fontWeight: FontWeight = passedFontWeight ?? 'regular';
  let size: Size = passedSize ?? 'md';
  let lineHeight: LineHeight = passedLineHeight ?? 'normal';

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
        { color: textColor },
        { textAlign },
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
  }
> = {
  body: {
    fontWeight: 'regular',
    size: 'md',
    lineHeight: 'normal',
  },
  emphasized_body: {
    fontWeight: 'semibold',
    size: 'md',
    lineHeight: 'normal',
  },
  caption: {
    fontWeight: 'regular',
    size: 'sm',
    lineHeight: 'normal',
  },
  h1: {
    fontWeight: 'bold',
    size: '3xl',
    lineHeight: 'tight',
  },
  h2: {
    fontWeight: 'semibold',
    size: '2xl',
    lineHeight: 'tight',
  },
  h3: {
    fontWeight: 'semibold',
    size: 'xl',
    lineHeight: 'normal',
  },
  lead: {
    fontWeight: 'regular',
    size: 'lg',
    lineHeight: 'relaxed',
  },
};

const LINE_HEIGHT: Record<LineHeight, number> = {
  tight: 1.1,
  normal: 1.2,
  relaxed: 1.5,
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
