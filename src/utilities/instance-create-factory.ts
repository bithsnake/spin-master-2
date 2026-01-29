import {
  BackGroundInstance,
  ButtonInstance,
  instanceCreate,
  PointerInstance,
  ReelInstance,
  UIGeneralText,
  GameObject,
} from "../classes/class-library";
import { FromSprite } from "../types/types";
import { REEL, TILE01 } from "./imageLibrary";
import { canvasCenterX, canvasCenterY } from "./tools";
import { GlobalState } from "../classes/class-library";
import { playButtonAction } from "../classes/button-class-actions";
import {
  playButtonAtlas,
  POINTER_HAND_ANIMS,
  pointerAtlasHand,
} from "./atlas-library";
import { SYMBOLS_LIST } from "./symbols-library";
import { BALANCE_INSTANCE, WIN_INSTANCE } from "./container-name-library";
import { eventBus } from "./event-bus";

export async function createGuiTextInstances(global: GlobalState) {
  const GUIBalanceTextInstance = await instanceCreate(32, 32, UIGeneralText, {
    label: BALANCE_INSTANCE,
    anchorPoint: "topLeft",
    title: "Balance: ",
    textSize: 1,
  });

  GUIBalanceTextInstance.title = "Balance: $";

  const GUIWinTextInstance = await instanceCreate(
    32,
    global.app.canvas.height - 128,
    UIGeneralText,
    {
      label: WIN_INSTANCE,
      anchorPoint: "topLeft",
      title: "Win: ",
      textSize: 1,
    },
  );

  GUIWinTextInstance.title = "Win: $";

  return [GUIWinTextInstance, GUIBalanceTextInstance];
}

export async function createInteractiveInstances(global: GlobalState) {
  const canvasCenter = {
    x: canvasCenterX(global.app),
    y: canvasCenterY(global.app),
  };
  const pointerHandInstance = await instanceCreate(
    canvasCenter.x,
    canvasCenter.y,
    PointerInstance,
    {
      _pointerAtlas: pointerAtlasHand,
      anim: POINTER_HAND_ANIMS.pick,
      animate: false,
      speed: 0.1,
      anchorPoint: { x: 0.6, y: 0.4 },
    },
  );

  const reelInstance = await instanceCreate(0, 0, ReelInstance, {
    anchorPoint: "topLeft",
    size: { w: 1, h: 1 },
    reelSprite: REEL,
    symbolIds: SYMBOLS_LIST,
    global: global,
  });

  const playButtonInstance = await instanceCreate(
    canvasCenter.x,
    global.app.canvas.height,
    ButtonInstance,
    {
      atlasData: playButtonAtlas,
      anchorPoint: { x: 0.57, y: 1 },
      size: 1,
      global: global,
      action: playButtonAction,
      other: reelInstance,
    },
  );
  return [reelInstance, playButtonInstance, pointerHandInstance];
}

export async function createBackgroundInstances(global: GlobalState) {
  const BGTiledInstance = await instanceCreate(0, 0, BackGroundInstance, {
    sprite: <FromSprite>TILE01,
    global: global,
  });

  return [BGTiledInstance];
}

export function registerUiEventHandlers(
  guiInstArray: GameObject[],
  global: GlobalState,
) {
  const balanceInst = guiInstArray.find(
    (inst) => inst.self.label === BALANCE_INSTANCE,
  ) as UIGeneralText | undefined;
  const winInst = guiInstArray.find(
    (inst) => inst.self.label === WIN_INSTANCE,
  ) as UIGeneralText | undefined;

  const updateBalance = (balance: number) => {
    if (!balanceInst) return;
    balanceInst.value = balance.toString();
    balanceInst.update(global);
  };

  const updateWin = (winAmount: number) => {
    if (!winInst) return;
    winInst.value = winAmount.toString();
    winInst.update(global);
  };

  eventBus.on("UI/BALANCE_UPDATE", ({ balance }) => updateBalance(balance));
  eventBus.on("UI/WIN_UPDATE", ({ winAmount }) => updateWin(winAmount));

  updateBalance(global.currentBalance);
  updateWin(global.currentWinAmount);
}
