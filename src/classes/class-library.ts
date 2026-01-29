import {
  AnimatedSprite,
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
  Texture,
  TilingSprite,
} from "pixi.js";
import { IRenderable, IUpdatable } from "../interfaces/interfaces";
import {
  AnchorPoint,
  AtlasData,
  Direction,
  FromSprite,
  Point,
  Size,
  TextOptions,
} from "../types/types";
import {
  approach,
  canvasCenterY,
  choose,
  createAnimatedSprite,
  createSprite,
  createText,
  createTiledSprite,
  getAppScreenHeight,
  getAppScreenWidth,
  getAppStageHeight,
  getAppStageWidth,
  initSound,
  playSound,
  pointMeeting,
} from "../utilities/tools";

import { STYLE_KEY } from "../utilities/style-library";
import { playButtonAtlas, pointerAtlasHand } from "../utilities/atlas-library";
import {
  GAME_CONTAINER,
  SLOT_CONTAINER,
  SYMBOL_CONTAINER,
} from "../utilities/container-name-library";
import {
  highScoreFanfare,
  sfxPoint,
  spinmaster,
  track2,
} from "../utilities/soundLibrary";
import {
  assetPath,
  SYM01,
  SYM02,
  SYM03,
  SYM04,
  SYM05,
  SYM06,
} from "../utilities/imageLibrary";
export class GlobalState implements IUpdatable {
  app!: Application;
  canPress = false;
  spinTimerSecondsMax = 2;
  spinTimerSeconds = 0;
  isSpinning = false;
  gameRoundEnded = false;
  intervalMax = 5;
  interval = this.intervalMax;
  count = 0;
  time = 0;
  elapsedTime = 0;
  balanceInit = 100;
  currentBalance = this.balanceInit;
  currentWinAmount = 0;
  currentWinAmountBuffer = 0;
  betAmount = 1;
  soundtrack: Howl | null = null;
  timeOut = null;
  gameCanRun = false;
  textInst: UIText[] = [];
  private _gameIsStared = false;
  private _finishedStage = false;

  get finishedStage(): boolean {
    return this._finishedStage;
  }
  set finishedStage(value: boolean) {
    this._finishedStage = value;
  }
  get gameIsStarted(): boolean {
    return this._gameIsStared;
  }

  set gameIsStarted(value: boolean) {
    this._gameIsStared = value;
  }

  update(delta?: number): void {
    this.routine(delta || 0);
  }

  reset(): void {
    this.spinTimerSeconds = 0;
    this.interval = this.intervalMax;
    this.count = 0;
    this.time = 0;
    this.elapsedTime = 0;
    this.currentBalance = this.balanceInit;
    this.currentWinAmount = 0;
    this.currentWinAmountBuffer = 0;
    this.timeOut = null;
    this.textInst = [];
  }

  routine(delta: number): void {
    if (!this.gameIsStarted || this.finishedStage) {
      this.gameCanRun = false;
    } else {
      this.gameCanRun = true;
    }
    if (!this.gameIsStarted) return;

    if (this.textInst.length > 0) {
      this.textInst.forEach((text) => {
        text.update(this);
      });
    }

    // elapsed time is incremented by delta
    if (this.spinTimerSeconds > 0) {
      this.elapsedTime += delta * (1000 / 60);
    } else {
      this.elapsedTime = 0;
    }

    if (this.elapsedTime >= 1000 && this.spinTimerSeconds > 0) {
      this.spinTimerSeconds--;
      this.elapsedTime -= 1000;
    }
  }
}

// --- ABSTRACT CLASSES ---
export abstract class GameObject implements IRenderable, IUpdatable {
  declare self:
    | Sprite
    | AnimatedSprite
    | Graphics
    | TilingSprite
    | Container
    | Text;
  size = { m: 5, l: 5 * 1.2, xl: 5 * 1.5 };
  abstract update(...args: unknown[]): void;
  protected abstract stepEvent(...args: unknown[]): void;

  initDefaultSizes() {
    this.size = {
      m: this.self.scale.x,
      l: this.self.scale.x * 1.2,
      xl: this.self.scale.x * 1.5,
    };
  }

  isOutsideStage(
    global: GlobalState,
    sprite:
      | Sprite
      | AnimatedSprite
      | Graphics
      | TilingSprite
      | Container
      | Text,
  ) {
    return (
      sprite.position.x + this.self.width < 0 ||
      sprite.position.x > getAppStageWidth(global.app) ||
      sprite.position.y + this.self.height < 0 ||
      sprite.position.y > getAppStageHeight(global.app)
    );
  }
}

export abstract class UIText extends GameObject {
  declare self: Text;
  declare value: string;
  timer = 0;
  constructor(text: Text, value: string, global: GlobalState) {
    super();
    this.self = text;
    this.initDefaultSizes();
    this.value = value;
    global.app.stage.children.forEach((container) => {
      if (container.label === GAME_CONTAINER) {
        global.textInst.push(this);
        container.addChild(this.self);
      }
    });
  }
  destroyInstRef(global: GlobalState) {
    const idx = global.textInst.indexOf(this);
    if (idx !== -1) {
      global.textInst.splice(idx, 1);
    }
  }
}

// --- INTERACTIVE CLASSES ---
export class PointerInstance extends GameObject {
  declare self: AnimatedSprite;
  mousePosition: Point = { x: 0, y: 0 };
  mouseDown: { hold: boolean; event: MouseEvent | null } = {
    hold: false,
    event: null,
  };
  private constructor(sprite: AnimatedSprite) {
    super();
    this.self = sprite;
    this.self.label = "pointer";
    this.self.visible = true;
    this.initDefaultSizes();

    window.addEventListener("mousemove", (event) => {
      this.mousePosition.x = event.clientX;
      this.mousePosition.y = event.clientY;
      if (this.mouseDown.hold) {
        this.mouseDown.event = event;
      }
    });
    window.addEventListener("mouseup", (event) => {
      this.mouseDown = { hold: false, event: event };
    });
    window.addEventListener("mousedown", (event) => {
      this.mouseDown = { hold: true, event: event };
    });
  }

  static async create(
    x: number,
    y: number,
    options?: {
      _pointerAtlas: AtlasData;
      anim: string;
      animate: boolean;
      speed: number;
      anchorPoint: Point;
    },
  ): Promise<PointerInstance> {
    if (!options)
      return new PointerInstance(
        await createAnimatedSprite(pointerAtlasHand, x, y, { x: 0, y: 0 }, 5, {
          anim: "pick",
          animate: false,
          speed: 0.1,
        }),
      );
    const { _pointerAtlas, anim, animate, speed, anchorPoint } = options;
    const sprite = await createAnimatedSprite(
      _pointerAtlas || pointerAtlasHand,
      x,
      y,
      anchorPoint,
      5,
      {
        anim,
        animate,
        speed,
      },
    );
    return new PointerInstance(sprite);
  }

  update() {
    this.stepEvent();
  }

  protected stepEvent() {
    this.self.currentFrame = this.mouseDown.hold ? 1 : 0;
    document.body.style.cursor = "none";
    this.self.position.set(this.mousePosition.x, this.mousePosition.y);
  }
}

export class ReelInstance extends GameObject {
  declare self: Sprite;
  declare symbolIds: FromSprite[];
  symbolsData: { id: number; yStart: number }[] = [];
  quickStop = false;
  timer = 0;
  timerMax = 0;
  speedMax = 128;
  speed = this.speedMax;
  symbolContainer: Container = new Container();
  symbolContainerBuffer: Container = new Container();
  slotContainer: Container = new Container();
  randomizePosition = Math.round(Math.random());
  slotData: Graphics[] = [];
  slotTextures: Texture[] = [];
  moveTowardsPosition = 0;
  randomizeCounter = 0;

  constructor(reel: Sprite, symbolIds: FromSprite[], global: GlobalState) {
    super();
    // reel
    this.symbolContainer.label = SYMBOL_CONTAINER;
    this.slotContainer.label = SLOT_CONTAINER;
    this.symbolIds = symbolIds;
    this.self = reel;
    this.self.allowChildren = true;
    this.self.label = "reel";
    this.self.interactive = true;

    this.slotTextures = [
      Texture.from(assetPath + SYM01 + ".png"),
      Texture.from(assetPath + SYM02 + ".png"),
      Texture.from(assetPath + SYM03 + ".png"),
      Texture.from(assetPath + SYM04 + ".png"),
      Texture.from(assetPath + SYM05 + ".png"),
      Texture.from(assetPath + SYM06 + ".png"),
    ];

    this.slotTextures.forEach((texture) => {
      const name = texture.label!.split("/")[4].split(".")[0];
      texture.label = name;
    });

    this.addSlots();
    this.addSymbols(global);
    this.initDefaultSizes();
  }

  static async create(
    x: number,
    y: number,
    options: {
      anchorPoint: AnchorPoint;
      size: Size;
      reelSprite: FromSprite;
      symbolIds: FromSprite[];
      global: GlobalState;
    },
  ) {
    const { anchorPoint, size, reelSprite, symbolIds, global } = options;
    const reel = createSprite(x, y, anchorPoint, size, reelSprite);
    return new ReelInstance(reel, symbolIds, global);
  }
  update(global: { inst: GlobalState }): void {
    if (this.slotData.length === 0) this.initSlotData();
    this.stepEvent(global);
  }

  protected stepEvent(global: { inst: GlobalState }): void {
    const gl = global.inst;
    if (!gl.gameCanRun) return;

    const symbolCount = this.symbolContainer.children.length;
    const symbolHeight = this.symbolContainer.children[0].height;

    // spin
    if (gl.spinTimerSeconds > 0 && gl.isSpinning) {
      global.inst.canPress = false;
      this.timer = approach(this.timer, 0, 0.01);

      this.speed = 64 * (this.timer * 0.5);
      this.moveTowardsPosition += this.speed / symbolHeight;

      if (this.moveTowardsPosition >= symbolCount) {
        this.moveTowardsPosition -= symbolCount;
      }

      // if you stop the wheel
      if (this.quickStop) {
        // move forward + 3 steps and wrap if needed, i.e if paused the reel
        // '3 previoussymbols should go out of the screen'.
        this.moveTowardsPosition = (this.moveTowardsPosition + 3) % symbolCount;

        gl.spinTimerSeconds = 0;
        // update symbols y positions
        for (let i = 0; i < symbolCount; i++) {
          const symbol = this.symbolContainer.children[i];
          symbol.y = this.setSymbolPosition(i, symbolHeight, symbolCount);
        }
      }

      if (this.quickStop) {
        return;
      }

      // update symbols y positions
      for (let i = 0; i < symbolCount; i++) {
        const symbol = this.symbolContainer.children[i];
        symbol.y = this.setSymbolPosition(i, symbolHeight, symbolCount);
      }
      if (
        this.randomizeCounter >= this.symbolContainer.children.length - 1 &&
        gl.spinTimerSeconds > 1
      ) {
        this.randomizeCounter = 0;
        this.randomizeSymbolTextues(this.symbolContainer);
      }
      this.randomizeCounter++;
    } else {
      // stop, smoothly go back to position
      if (gl.isSpinning) {
        this.quickStop = false;
        const rcc = this.symbolContainer.children;

        // correct all symbol y-positions
        for (const symbol of rcc) {
          if (Math.floor(symbol.position.y) % symbol.height !== 0) {
            symbol.position.y = Math.floor((symbol.position.y -= 1));
          }
        }

        //check if all symbol y-positions are in correct position and run checkIfWin
        rcc.every((symbol) => {
          if (Math.floor(symbol.position.y) % symbol.height === 0) {
            // check if we have a win
            const result = this.checkIfWin(this.symbolContainer, global.inst);

            if (result.amount > 0) {
              instanceCreate(
                256,
                canvasCenterY(global.inst.app),
                UIScrollingText,
                {
                  label: "bet",
                  anchorPoint: "topLeft",
                  value: String(
                    `${result.multiplier === 3 ? "JACKPOT!\n" : ""}WIN! $ ${result.amount}`,
                  ),
                  global: global.inst,
                  dir: "up",
                },
              );

              playSound(
                result.multiplier === 3 ? highScoreFanfare : sfxPoint,
                result.multiplier === 3 ? 0.8 : 1.2,
              );

              global.inst.currentBalance += result.amount;
              global.inst.currentWinAmount += result.amount;
            }
            gl.isSpinning = false;
          }
        });
      }

      if (!gl.isSpinning) {
        this.speed = this.speedMax;

        if (
          global.inst.currentBalance <= 0 &&
          !global.inst.canPress &&
          !global.inst.gameRoundEnded
        ) {
          if (global.inst.soundtrack?.playing()) {
            global.inst.soundtrack?.fade(0.5, 0, 1000);
          }
          global.inst.gameRoundEnded = true;

          setTimeout(() => {
            global.inst.currentBalance =
              global.inst.balanceInit + global.inst.currentWinAmount;
            global.inst.gameRoundEnded = false;
            global.inst.canPress = true;

            global.inst.soundtrack?.stop();
            global.inst.soundtrack = initSound(
              choose(spinmaster, spinmaster, track2),
            );

            if (global.inst.currentWinAmount > 0) {
              instanceCreate(
                256,
                canvasCenterY(global.inst.app),
                UIScrollingText,
                {
                  label: "bet",
                  anchorPoint: "topLeft",
                  value: String(`YOU WIN! $ ${global.inst.currentWinAmount}`),
                  global: global.inst,
                  dir: "up",
                },
              );
              playSound(highScoreFanfare, 0.8);
              global.inst.currentWinAmount = 0;
            }

            // randomize all symbol textures!
            this.randomizeSymbolTextues(this.symbolContainer);
          }, 2500);
        } else {
          global.inst.gameRoundEnded = false;
          global.inst.canPress = true;
        }
      }
      this.timer = this.timerMax;
    }
  }

  setSymbolPosition(
    i: number,
    symbolHeight: number,
    symbolCount: number,
  ): number {
    // wrap if over y treshold and keep spacing, set 3 positions above the reel if we go over
    const yOffset = 3;
    let pos = this.moveTowardsPosition + i;
    if (pos >= symbolCount) pos -= symbolCount;

    return Math.floor(pos * symbolHeight - symbolHeight * yOffset);
  }

  /**
   * Randomize the textures of the symbols
   * @param container
   * @param changeOnIndex { from: number; to: number }, if null we change texture on all symbols
   */
  randomizeSymbolTextues(
    container: Container,
    changeOnIndex?: { from: number; to: number },
  ): void {
    if (changeOnIndex) {
      for (let i = changeOnIndex.from; i <= changeOnIndex.to; i++) {
        const newTexture = getRandomTexture(this.slotTextures);
        (container.children[i] as Sprite).texture = newTexture;
        if (newTexture.label !== undefined) {
          container.children[i].label = newTexture.label;
        }
      }
    } else {
      for (const symbol of container.children) {
        const newTexture = getRandomTexture(this.slotTextures);

        (symbol as Sprite).texture = newTexture;
        if (newTexture.label !== undefined) {
          symbol.label = newTexture.label;
        }
      }
    }
    function getRandomTexture(slotTextures: Texture[]): Texture {
      return slotTextures[Math.floor(Math.random() * slotTextures.length)];
    }
  }

  private checkIfWin(
    symbolContainer: Container,
    global: GlobalState,
  ): { amount: number; multiplier: number } {
    const found: Sprite[] = [];

    setFound(this.slotData);

    if (found.length === 0) {
      console.error("No symbols found");
    }

    const equalSymbols = found.filter(
      (symbol) => found.filter((s) => s.label === symbol.label).length > 1,
    );

    return {
      amount: global.betAmount * equalSymbols.length,
      multiplier: equalSymbols.length,
    };

    function setFound(slotData: Graphics[]): void {
      const visibleSymbols = symbolContainer.children.filter(
        (symbol) => symbol.visible === true,
      );
      for (const symbol of visibleSymbols) {
        for (const slot of slotData) {
          const symPos = symbol.getGlobalPosition();
          const symbolCenter = {
            x: symPos.x + symbol.width / 2,
            y: symPos.y + symbol.height / 2,
          };
          if (pointMeeting({ x: symbolCenter.x, y: symbolCenter.y }, slot)) {
            found.push(<Sprite>symbol);
          }
        }
      }
    }
  }

  private addSlots(): void {
    const height = this.self.height;
    const slots = 3;
    const reelPadding = 0;
    const slotHeight = (height - reelPadding) / slots;

    for (let i = 0; i < slots; i++) {
      const slotYTop = i * slotHeight;
      const colMask = new Graphics()
        .rect(0, 0, this.self.width, slotHeight)
        .fill(0xff0000);
      colMask.alpha = 0;
      colMask.position.set(0, slotYTop);
      this.slotContainer.addChild(colMask);
    }
  }

  private initSlotData(): void {
    this.slotData = this.slotContainer.children.map((slot) => <Graphics>slot);
  }

  private addSymbols(global: GlobalState): void {
    let index = 0;
    // this.symbolIds.length = 4;
    for (const symbol of this.symbolIds) {
      const symbolSprite = createSprite(
        6,
        6,
        "topLeft",
        { w: 1, h: 1 },
        symbol,
      );

      symbolSprite.label = `${symbol}_${index}`;
      // const colBox = createCollisionMask(
      //   symbolSprite.x,
      //   symbolSprite.y,
      //   symbolSprite.width,
      //   symbolSprite.height,
      //   0x000000,
      //   0xff0000,
      //   0xffffff,
      // );
      // colBox.alpha = 0.4;
      // symbolSprite.addChild(colBox);
      symbolSprite.position.y =
        symbolSprite.height * 2 + -index * symbolSprite.height + 6;
      this.symbolContainer.addChild(symbolSprite);

      this.symbolsData.push({
        id: index,
        yStart: symbolSprite.y,
      });

      index++;

      // all symbols added
      if (index === this.symbolIds.length) {
        // sort the symbols since they were added asynchronously
        this.symbolsData.sort((a, b) => {
          return a.id - b.id;
        });

        this.symbolContainer.children.sort((a, b) => {
          const indexA = +a.label.split("_")[1];
          const indexB = +b.label.split("_")[1];
          return indexA - indexB;
        });

        this.timerMax = global.spinTimerSecondsMax;
        this.timer = this.timerMax;

        for (const _symbol of this.symbolContainer.children) {
          _symbol.label = _symbol.label.split("_")[0];
        }
      }
      const buffer = new Container();
      for (const child of this.symbolContainer.children) {
        if (child instanceof Sprite) {
          const clone = new Sprite(child.texture);
          clone.position.copyFrom(child.position);
          clone.width = child.width;
          clone.height = child.height;
          clone.label = child.label;
          buffer.addChild(clone);
        }
      }
      this.symbolContainerBuffer = buffer;
    }
  }
}

export class ButtonInstance extends GameObject {
  declare self: Sprite | AnimatedSprite;
  action: (
    global: GlobalState,
    selfInst: ButtonInstance,
    event: FederatedPointerEvent,
    other: unknown,
  ) => void;

  constructor(
    button: Sprite | AnimatedSprite,
    global: GlobalState,
    action: (
      global: GlobalState,
      selfInst: ButtonInstance,
      event: FederatedPointerEvent,
      other: unknown,
    ) => void,
    other: unknown,
  ) {
    super();
    this.self = button;
    this.self.interactive = true;
    this.action = action;

    this.self.on("pointerdown", (_event: FederatedPointerEvent) => {
      this.action(global, this, _event, other);
    });
    this.initDefaultSizes();
  }

  static async create(
    x: number,
    y: number,
    options: {
      atlasData: AtlasData;
      anchorPoint: Point;
      size: number;
      global: GlobalState;
      other: unknown;
      action: (
        global: GlobalState,
        selfInst: ButtonInstance,
        event: FederatedPointerEvent,
        other: unknown,
      ) => void;
    },
  ) {
    const { atlasData, anchorPoint, size, global, other, action } = options;

    const button = await createAnimatedSprite(
      atlasData || playButtonAtlas,
      x,
      y,
      anchorPoint,
      size,
      {
        anim: "normal",
        animate: false,
        speed: 0,
      },
    );
    return new ButtonInstance(button, global, action, other);
  }
  update(global: { inst: GlobalState }): void {
    this.stepEvent(global.inst);
  }

  protected stepEvent(global: GlobalState): void {
    if (!global.gameCanRun) return;
    (<AnimatedSprite>this.self).currentFrame =
      global.currentBalance > 0 ? 0 : 1;
  }
}
// --- UI CLASSES ---
export class UIScrollingText extends UIText {
  declare self: Text;
  declare value: string;
  timer = 0;
  dir: Direction = "up";
  private constructor(
    text: Text,
    dir: Direction,
    value: string,
    global: GlobalState,
  ) {
    super(text, value, global);
    this.initDefaultSizes();
    this.dir = dir;
    this.value = value;
  }

  static async create(
    x: number,
    y: number,
    options: {
      label: string;
      anchorPoint: AnchorPoint;
      value: string;
      global: GlobalState;
      dir: Direction;
    },
  ) {
    const { label, anchorPoint, dir, value, global } = options;
    const text = createText(
      x,
      y,
      anchorPoint,
      value,
      STYLE_KEY.normal,
      1,
      null,
      label,
    );
    text.label = label;
    return new UIScrollingText(text, dir, value, global);
  }

  update(global: GlobalState): void {
    this.stepEvent(global);
  }

  protected stepEvent(global: GlobalState): void {
    this.timer++;
    this.self.text = this.value;

    if (this.timer % 6 === 0) {
      this.self.alpha = approach(this.self.alpha, 0, 0.05);

      if (this.dir === "up") {
        this.self.position.y -= 4;
      } else if (this.dir === "down") {
        this.self.position.y += 4;
      }
      this.self.position.x += 0.4;

      // to compesate the x position to keep it in its x positiion while the scaling down that happens, fix later
      this.self.scale.set(this.self.scale.x - 0.01, this.self.scale.y - 0.01);
    }
    if (this.self.alpha <= 0) {
      this.self.alpha = 0;
      this.self.visible = false;
      this.self.destroy();
      this.destroyInstRef(global);
    }
  }
}

export class UIGeneralText extends GameObject {
  declare self: Text;
  declare title: string;
  value = "";
  private constructor(text: Text) {
    super();
    this.title = text.text;
    this.self = text;
    // this.self.label = "uiGeneralText";
    this.initDefaultSizes();
  }

  static async create(x: number, y: number, options: TextOptions) {
    const { anchorPoint, title, textSize, label } = options;
    const text = createText(
      x,
      y,
      anchorPoint || "topLeft",
      title,
      STYLE_KEY.normal,
      textSize || 1,
      null,
      label || "uiGeneralText",
    );
    return new UIGeneralText(text);
  }

  update(global: GlobalState): void {
    this.stepEvent(global);
  }

  protected stepEvent(global: GlobalState): void {
    if (global.gameCanRun === false) {
      this.self.text = "GAME NOT RUNNING";
    }
    this.self.text = `${this.title}${this.value}`;
  }
}

export class BackGroundInstance extends GameObject {
  declare self: TilingSprite;
  constructor(x: number, y: number, bg: TilingSprite) {
    super();
    this.self = bg;
    this.self.position.set(x, y);
  }

  static async create(
    x: number,
    y: number,
    options: { sprite: FromSprite; global: GlobalState },
  ) {
    const { sprite, global } = options;
    const _sprite = await createTiledSprite(
      sprite,
      x,
      y,
      getAppScreenWidth(global.app),
      getAppScreenHeight(global.app),
      5,
      false,
    );
    return new BackGroundInstance(x, y, _sprite);
  }

  update(): void {
    this.stepEvent(-0.1, -0.1);
  }
  protected stepEvent(hsp: number, vsp: number) {
    this.self.tilePosition.x += hsp;
    this.self.tilePosition.y += vsp;
  }
}

export async function instanceCreate<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends { create: (...args: any[]) => Promise<any> },
>(
  x: number,
  y: number,
  cls: C,
  options: Parameters<C["create"]>[2],
): Promise<Awaited<ReturnType<C["create"]>>> {
  return cls.create(x, y, options);
}
