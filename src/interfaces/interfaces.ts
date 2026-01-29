import { Spine } from "@esotericsoftware/spine-pixi-v8";
import {
  AnimatedSprite,
  Container,
  Graphics,
  Sprite,
  TilingSprite,
} from "pixi.js";

export interface IUpdatable {
  update(delta: number, ...args: unknown[]): void;
}

export interface IRenderable {
  self:
    | Sprite
    | AnimatedSprite
    | Graphics
    | Text
    | TilingSprite
    | Container
    | Spine;
}
