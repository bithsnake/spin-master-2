import { FederatedPointerEvent } from "pixi.js";
import { sfxCashRegister, sfxPick } from "../utilities/soundLibrary";
import { eventBus } from "../utilities/event-bus";
import {
  GlobalState,
  ButtonInstance,
  instanceCreate,
  UIScrollingText,
  ReelInstance,
} from "./class-library";

export const playButtonAction = (
  global: GlobalState,
  selfInst: ButtonInstance,
  event: FederatedPointerEvent,
  other: unknown,
) => {
  if (!global.gameCanRun) return;
  if (global.spinTimerSeconds > 1 && global.currentBalance > 0) {
    eventBus.emit("SOUND/PLAY", { sound: sfxPick, volume: 1 });
    event.stopPropagation();
    const rc = <ReelInstance>other;
    rc.quickStop = true;
    return;
  }
  if (global.currentBalance <= 0) return;
  if (!global.canPress) return;
  if (!global.gameIsStarted) {
    global.gameIsStarted = true;
    global.canPress = true;
    global.elapsedTime -= 1000;
  }

  if (!global.soundtrack?.playing()) {
    global.soundtrack?.play();
    global.soundtrack?.loop(true);
  }

  global.spinTimerSeconds = global.spinTimerSecondsMax;
  global.isSpinning = true;
  eventBus.emit("SPIN/START", { source: "button" });

  if (global.currentBalance > 0) {
    (<ReelInstance>other).randomizePosition = Math.round(Math.random());
    eventBus.emit("SOUND/PLAY", { sound: sfxCashRegister, volume: 0.5 });
    global.currentBalance -= global.betAmount;
    eventBus.emit("UI/BALANCE_UPDATE", { balance: global.currentBalance });

    instanceCreate(selfInst.self.x - 256, 256, UIScrollingText, {
      label: "bet",
      anchorPoint: "topLeft",
      value: `-$${global.betAmount}`,
      global: global,
      dir: "up",
    });
  }
  // set frame
  // (<AnimatedSprite>selfInst.self).currentFrame =
  //   global.currentBalance > 0 ? 0 : 1;
};
