export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  name: string;
  color: string;
  body: Point[];
  velocity: Point;
  isDead: boolean;
  score: number;
  isPlayer: boolean;
  target?: Point; // For AI pathfinding
}

export interface Food {
  id: string;
  position: Point;
  color: string;
  value: number;
}

export interface GameState {
  snakes: Snake[];
  foods: Food[];
  worldSize: number;
  camera: Point;
  gameLoopCount: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSystem?: boolean;
  timestamp: number;
}

export enum GameStatus {
  MENU,
  PLAYING,
  GAME_OVER
}