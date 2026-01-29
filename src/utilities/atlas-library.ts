import { AtlasData } from "../types/types";
import { PICKER, PLAY_BUTTON } from "./container-name-library";
import { assetPath } from "./imageLibrary";

export const pointerAtlasHand: AtlasData = {
  frames: {
    pick0: {
      frame: { x: 0, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      anchor: {
        x: 0.4,
        y: 0.8,
      },
    },
    pick1: {
      frame: { x: 32, y: 0, w: 32, h: 32 },
      sourceSize: { w: 32, h: 32 },
      spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 },
      anchor: {
        x: 0.4,
        y: 0.8,
      },
    },
  },
  meta: {
    app: "http://www.codeandweb.com/texturepacker",
    version: "1.0",
    name: "picker",
    image: assetPath + PICKER + ".png",
    format: "RGBA8888",
    size: { w: 64, h: 32 },
    scale: "1",
  },
  animations: {
    pick: ["pick0", "pick1"],
  },
};

export const POINTER_HAND_ANIMS = {
  pick: "pick",
};

export const playButtonAtlas: AtlasData = {
  frames: {
    enable: {
      frame: { x: 0, y: 0, w: 185, h: 185 },
      sourceSize: { w: 185, h: 185 },
      spriteSourceSize: { x: 0, y: 0, w: 185, h: 185 },
      anchor: {
        x: 0.5,
        y: 0.5,
      },
    },
    disable: {
      frame: { x: 185, y: 0, w: 185, h: 185 },
      sourceSize: { w: 185, h: 185 },
      spriteSourceSize: { x: 0, y: 0, w: 185, h: 185 },
      anchor: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  meta: {
    app: "http://www.codeandweb.com/texturepacker",
    version: "1.0",
    name: "playButton",
    image: assetPath + PLAY_BUTTON + ".png",
    format: "RGBA8888",
    size: { w: 370, h: 185 },
    scale: "1",
  },
  animations: {
    normal: ["enable", "disable"],
  },
};

// export const PLAY_BUTTON_ANIMS: { [key: string]: string } = {
//   normal: "pick",
// };
