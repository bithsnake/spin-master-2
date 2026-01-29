import { Assets, TextStyle } from "pixi.js";
import { COLOR } from "./colorLibrary";
import { StyleType } from "../types/types";

const fontFamily = {
  robotoCondensed: "Roboto Condensed",
};

export const STYLE: {
  [key: string]: (size?: number, fontFamily?: string) => TextStyle;
} = {
  normal: (size = 1): TextStyle =>
    new TextStyle({
      fontFamily: fontFamily.robotoCondensed || "Roboto",
      fontSize: 36 * size,
      fill: COLOR.white,
      align: "left",
    }),
  title: (size = 1): TextStyle =>
    new TextStyle({
      fontFamily: fontFamily.robotoCondensed || "Roboto",
      fontSize: 128 * size,
      fill: COLOR.melange,
      fontWeight: "bold",
      letterSpacing: 4,
      align: "center",
      stroke: COLOR.greenLight,
    }),
};

export const STYLE_KEY: { normal: StyleType; title: StyleType } = {
  normal: "normal",
  title: "title",
};

export async function loadFontAssets(): Promise<void> {
  const roboto = await Assets.load("/fonts/Roboto_Condensed-Regular.ttf");
  fontFamily.robotoCondensed = roboto.family.split(" ")[0];
}
