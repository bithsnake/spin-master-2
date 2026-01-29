export type ColorType =
  | 0xff0000
  | 0x0000ff
  | 0x00ff00
  | 0xffff00
  | 0x000000
  | 0x7f0070
  | 0xffffff
  | 0x974949
  | 0xb3f909
  | 0xc4cfcf;

export const COLOR = {
  red: 0xff0000 as ColorType,
  blue: 0x0000ff as ColorType,
  green: 0x00ff00 as ColorType,
  yellow: 0xffff00 as ColorType,
  black: 0x000000 as ColorType,
  purple: 0x7f0070 as ColorType,
  white: 0xffffff as ColorType,
  melange: 0x974949 as ColorType,
  greenLight: 0xb3f909 as ColorType,
  gray: 0xc4cfcf as ColorType,
} as const;
