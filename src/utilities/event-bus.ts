import type { SoundLibrary } from "./soundLibrary";

export type GameEventMap = {
  "UI/BALANCE_UPDATE": { balance: number };
  "UI/WIN_UPDATE": { winAmount: number };
  "UI/GAME_STATUS": { canRun: boolean };
  "UI/TOGGLE_MUSIC": { enabled: boolean };
  "SOUND/PLAY": {
    sound: SoundLibrary;
    volume?: number;
    loop?: boolean;
    pitch?: number;
  };
  "SOUND/TRACK_FADE": {
    from: number;
    to: number;
    durationMs: number;
  };
  "SOUND/TRACK_STOP": Record<string, never>;
  "SOUND/TRACK_RESET": {
    sound: SoundLibrary;
    volume?: number;
    loop?: boolean;
    autoPlay?: boolean;
  };
  "SPIN/START": { source: "button" | "auto" };
  "SPIN/STOP": { quickStop: boolean };
  "WIN/RESULT": { amount: number; multiplier: number };
};

type Handler<T> = (payload: T) => void;

type HandlerMap<Events extends Record<string, unknown>> = {
  [K in keyof Events]?: Set<Handler<Events[K]>>;
};

class EventBus<Events extends Record<string, unknown>> {
  private listeners: HandlerMap<Events> = {};

  on<K extends keyof Events>(
    event: K,
    handler: Handler<Events[K]>,
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.listeners[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }
}

export const eventBus = new EventBus<GameEventMap>();
