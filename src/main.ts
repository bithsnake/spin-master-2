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
import {
  canvasCenterX,
  choose,
  createText,
  initSound,
} from "./utilities/tools";
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
import { loadFontAssets, STYLE_KEY } from "./utilities/style-library";

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

  // --- MUSIC TOGGLE ---
  const musicToggleContainer = new Container({ label: "musicToggle" });
  const musicToggleBg = new Graphics();
  const musicToggleText = createText(
    0,
    0,
    "topLeft",
    "Music: On",
    STYLE_KEY.normal,
    1.1,
    "left",
    "musicToggleText",
  );

  musicToggleContainer.eventMode = "static";
  musicToggleContainer.cursor = "pointer";

  let musicEnabled = true;
  let isHovering = false;

  let musicToggleWidth = 0;
  const renderMusicToggle = () => {
    const paddingX = 12;
    const paddingY = 6;
    const radius = 6;
    const bgColorOn = 0x2d6cdf;
    const bgColorOnHover = 0x1f4fb3;
    const bgColorOffHover = 0x000000;
    const bgAlphaOn = 0.85;
    const bgAlphaOff = 0;
    const bgAlphaOffHover = 0.2;

    musicToggleText.text = `Music: ${musicEnabled ? "On" : "Off"}`;

    const bgWidth = musicToggleText.width + paddingX * 2;
    const bgHeight = musicToggleText.height + paddingY * 2;

    musicToggleBg.clear();

    if (musicEnabled) {
      const color = isHovering ? bgColorOnHover : bgColorOn;
      musicToggleBg.roundRect(0, 0, bgWidth, bgHeight, radius).fill({
        color,
        alpha: bgAlphaOn,
      });
    } else if (isHovering) {
      musicToggleBg
        .roundRect(0, 0, bgWidth, bgHeight, radius)
        .fill({ color: bgColorOffHover, alpha: bgAlphaOffHover });
    } else {
      musicToggleBg
        .roundRect(0, 0, bgWidth, bgHeight, radius)
        .fill({ color: 0x000000, alpha: bgAlphaOff });
    }

    musicToggleWidth = bgWidth;
    musicToggleText.position.set(paddingX, paddingY);
    musicToggleContainer.hitArea = new Rectangle(0, 0, bgWidth, bgHeight);
    musicToggleContainer.pivot.set(musicToggleWidth, 0);
  };

  const updateMusicTogglePosition = () => {
    const x = app.screen.width - 32;
    const y = 64;
    musicToggleContainer.position.set(x, y);
  };

  renderMusicToggle();
  updateMusicTogglePosition();
  app.ticker.addOnce(() => {
    renderMusicToggle();
    updateMusicTogglePosition();
  });
  window.addEventListener("resize", () => {
    renderMusicToggle();
    updateMusicTogglePosition();
  });

  musicToggleContainer.on("pointerdown", () => {
    musicEnabled = !musicEnabled;
    global.soundtrack?.mute(!musicEnabled);
    renderMusicToggle();
    updateMusicTogglePosition();
  });

  musicToggleContainer.on("pointerover", () => {
    isHovering = true;
    renderMusicToggle();
  });

  musicToggleContainer.on("pointerout", () => {
    isHovering = false;
    renderMusicToggle();
  });

  musicToggleContainer.addChild(musicToggleBg, musicToggleText);
  uiContainer.addChild(musicToggleContainer);

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
