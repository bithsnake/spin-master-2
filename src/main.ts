import { initDevtools } from "@pixi/devtools";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Ticker,
} from "pixi.js";
import {
  GameObject,
  GlobalState,
  ReelInstance,
  UIGeneralText,
} from "./classes/class-library";
import {
  BALANCE_INSTANCE,
  BG_CONTAINER,
  GAME_CONTAINER,
  INSTANCE_CONTAINER,
  PICKER,
  PLAY_BUTTON,
  REEL_CONTAINER,
  UI_CONTAINER,
  WIN_INSTANCE,
} from "./utilities/container-name-library";
import {
  createBackgroundInstances,
  createGuiTextInstances,
  createInteractiveInstances,
} from "./utilities/instance-create-factory";
import { canvasCenterX, choose, initSound } from "./utilities/tools";
import { spinmaster, track2 } from "./utilities/soundLibrary";
import {
  assetPath,
  PLAY_DISABLED,
  REEL,
  SYM01,
  SYM02,
  SYM03,
  SYM04,
  SYM05,
  SYM06,
  TILE01,
  WIN_BG,
} from "./utilities/imageLibrary";
import { loadFontAssets } from "./utilities/style-library";

(async () => {
  await Assets.init();
  await Assets.load([
    assetPath + PLAY_BUTTON + ".png",
    assetPath + PLAY_DISABLED + ".png",
    assetPath + WIN_BG + ".png",
    assetPath + PICKER + ".png",
    assetPath + TILE01 + ".png",
    assetPath + REEL + ".png",
    assetPath + SYM01 + ".png",
    assetPath + SYM02 + ".png",
    assetPath + SYM03 + ".png",
    assetPath + SYM04 + ".png",
    assetPath + SYM05 + ".png",
    assetPath + SYM06 + ".png",
  ]);

  await loadFontAssets();

  const app = new Application();

  await app.init({
    resizeTo: window,
    antialias: true,
    backgroundColor: 0x000000,
    backgroundAlpha: 0.99,
  });

  app.renderer.resolution = window.devicePixelRatio / window.devicePixelRatio;

  // DEV TOOLS
  initDevtools({ app });

  // --- GLOBAL STATE ---
  const global = new GlobalState();
  global.app = app;
  global.gameIsStarted = true;
  global.gameCanRun = true;

  // --- instances ---
  const guiInstArray = <GameObject[]>await createGuiTextInstances(global);
  const instArray = <GameObject[]>await createInteractiveInstances(global);
  const reel = <ReelInstance>instArray[0];
  instArray.splice(0, 1);
  const bgInstArray = <GameObject[]>await createBackgroundInstances(global);

  // cover top and bottom
  const SYMBOL_AMOUNT = 3;
  const SYMBOL_SIZE = 128;
  const REEL_EDGE = 12;
  const REEL_WIDTH = SYMBOL_SIZE + REEL_EDGE * SYMBOL_AMOUNT;

  const yPos = (app.screen.height - SYMBOL_SIZE * SYMBOL_AMOUNT) / 2;
  reel.self.y = yPos;
  reel.self.x = canvasCenterX(app) - REEL_WIDTH / 2;
  reel.slotContainer.y = reel.self.y;
  reel.slotContainer.x = reel.self.x;
  reel.symbolContainer.y = reel.self.y;
  reel.symbolContainer.x = reel.self.x;

  // add borders on top and bottom
  const top = new Graphics().rect(0, 0, app.screen.width, yPos).fill("black");
  const bottom = new Graphics()
    .rect(
      0,
      SYMBOL_SIZE * SYMBOL_AMOUNT + yPos + REEL_EDGE,
      app.screen.width,
      yPos,
    )
    .fill("black");

  // --- containers ---
  const reelContainer = new Container({
    label: REEL_CONTAINER,
  });
  reelContainer.addChild(reel.self);
  reelContainer.addChild(reel.symbolContainer);
  reelContainer.addChild(reel.slotContainer);

  // BG
  const bgContainer = new Container({
    label: BG_CONTAINER,
  });
  bgInstArray.forEach((inst) => {
    bgContainer.addChild(inst.self);
  });

  // INST
  const instanceContainer = new Container({
    label: INSTANCE_CONTAINER,
  });

  instanceContainer.addChild(reelContainer);
  instanceContainer.addChild(top);
  instanceContainer.addChild(bottom);
  instArray.forEach((inst) => {
    instanceContainer.addChild(inst.self);
  });

  // GUI
  const uiContainer = new Container({
    label: UI_CONTAINER,
  });
  guiInstArray.forEach((inst) => {
    uiContainer.addChild(inst.self);
  });

  const gameContainer = new Container({
    label: GAME_CONTAINER,
    sortableChildren: true,
    cullable: true,
    cullableChildren: true,
    cullArea: new Rectangle(0, 0, app.screen.width, app.screen.height),
  });

  gameContainer.addChild(bgContainer); // back layer
  gameContainer.addChild(instanceContainer); // middle layer
  gameContainer.addChild(uiContainer); // front layer

  // --- INIT & PLAY SOUNDTRACK ---
  global.soundtrack = initSound(
    choose(spinmaster, spinmaster, track2),
    0.5,
    true,
  );
  global.soundtrack.play();
  global.reset();

  let deltaTime = 0;
  const updatables = [
    () => global.update(deltaTime),
    () => instArray.forEach((inst) => inst.update({ inst: global })),
    () => reel.update({ inst: global }),
    () =>
      guiInstArray.forEach((inst) => {
        if (inst.self.label === BALANCE_INSTANCE) {
          // balance value
          (<UIGeneralText>inst).value = global.currentBalance.toString();
          inst.update({ inst: global });
        }
        if (inst.self.label === WIN_INSTANCE) {
          // win value
          (<UIGeneralText>inst).value = global.currentWinAmount.toString();
          inst.update({ inst: global });
        }
      }),
    () => bgInstArray.forEach((inst) => inst.update({ inst: global })),
  ];

  global.app.stage.addChild(gameContainer);

  app.ticker.add((time: Ticker) => {
    deltaTime = time.deltaTime;
    updatables.forEach((fn) => fn());
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);
})();
