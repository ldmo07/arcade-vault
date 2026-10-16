export interface SerpentinaCallbacks {
  onScore: (score: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (score: number) => void; // una vez por partida (derrota o victoria)
  onEat?: () => void; // una llamada por fruta comida
  onCrash?: () => void; // una llamada al chocar, justo antes de onGameOver
}

export interface SerpentinaHandle {
  setPaused: (paused: boolean) => void;
  destroy: () => void; // cancela rAF y quita listeners; idempotente
}

export type Direction = "up" | "down" | "left" | "right";

export interface Cell {
  col: number;
  row: number;
}

export type FruitName =
  | "banana"
  | "orange"
  | "grape"
  | "garlic"
  | "eggplant"
  | "strawberry"
  | "cherry"
  | "carrot"
  | "mushroom"
  | "broccoli"
  | "watermelon"
  | "pepper"
  | "kiwi"
  | "lemon"
  | "peach"
  | "peanut"
  | "apple"
  | "tomato"
  | "berries"
  | "grapes2"
  | "pineapple"
  | "melon";

export interface Fruit extends Cell {
  sprite: FruitName;
}

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
