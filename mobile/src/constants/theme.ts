import { Platform } from 'react-native';

export const Colors = {
  primary: '#087E8B',      // Deep Teal
  primaryDark: '#05535C',
  secondary: '#FF6B35',    // Tangerine Accent
  secondaryDark: '#E05523',
  success: '#3FAE7A',      // Jade Green (Found items)
  danger: '#D94F4F',       // Warm Red (Lost items)
  background: '#F4FAF9',   // Light Mint tint background
  cardBg: '#FFFFFF',
  text: '#1A2D30',
  textMuted: '#6B7C80',
  border: '#E2EBE9',
  light: {
    text: '#1A2D30',
    background: '#F4FAF9',
    backgroundElement: '#E8F3F1',
    backgroundSelected: '#087E8B',
    textSecondary: '#6B7C80',
    primary: '#087E8B',
  },
  dark: {
    text: '#ffffff',
    background: '#0D1B1E',
    backgroundElement: '#182C30',
    backgroundSelected: '#087E8B',
    textSecondary: '#94A7AB',
    primary: '#087E8B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
