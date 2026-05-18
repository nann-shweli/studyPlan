export const LightColors = {
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4B44CC',

  accent: '#FF6584',
  accentLight: '#FF8FA3',

  success: '#43C59E',
  successLight: '#D1F5EB',

  warning: '#F9A825',
  warningLight: '#FFF4D4',

  danger: '#EF5350',
  dangerLight: '#FDECEA',

  white: '#FFFFFF',
  black: '#0D0D0D',

  background: '#F4F5FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDEEF8',

  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textDisabled: '#BDBDBD',
  textInverted: '#FFFFFF',

  border: '#E5E7EB',
  borderFocus: '#6C63FF',

  progressTrack: '#E5E7EB',
};

export const DarkColors: typeof LightColors = {
  primary: '#8B85FF',
  primaryLight: '#A8A4FF',
  primaryDark: '#C9C7FF',

  accent: '#FF7A96',
  accentLight: '#FFA5B7',

  success: '#58D8B3',
  successLight: '#133B33',

  warning: '#FFD166',
  warningLight: '#3B3215',

  danger: '#FF6B6B',
  dangerLight: '#431F22',

  white: '#FFFFFF',
  black: '#0D0D0D',

  background: '#11131A',
  surface: '#1B1E27',
  surfaceAlt: '#272B36',

  textPrimary: '#FFFFFF',
  textSecondary: '#B5BDCB',
  textDisabled: '#707887',
  textInverted: '#11131A',

  border: '#303545',
  borderFocus: '#8B85FF',

  progressTrack: '#303545',
};

export type AppColors = typeof LightColors;
export type AppColorScheme = 'light' | 'dark';

export const getThemeColors = (scheme: AppColorScheme): AppColors =>
  scheme === 'dark' ? DarkColors : LightColors;

export const Colors = LightColors;