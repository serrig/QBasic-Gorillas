export type GameMode = '1P_VS_CPU' | '2P_HOTSEAT' | 'SANDBOX';

export type AIDifficulty = 'ROOKIE' | 'VETERAN' | 'MASTER';

export type GameState = 
  | 'TITLE_MENU' 
  | 'PLAYING' 
  | 'BANANA_IN_FLIGHT' 
  | 'ROUND_OVER' 
  | 'MATCH_VICTORY' 
  | 'PAUSED';

export interface Point {
  x: number;
  y: number;
}

export interface Building {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  windowPattern: boolean[][]; // true = lit window, false = dark
}

export interface Crater {
  x: number;
  y: number;
  radius: number;
}

export interface Gorilla {
  playerNumber: 1 | 2;
  name: string;
  x: number; // center x
  y: number; // rooftop y (feet position)
  width: number;
  height: number;
  buildingIndex: number;
  isHit: boolean;
  armState: 'idle' | 'throw_left' | 'throw_right' | 'victory_left' | 'victory_right';
  score: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spinSpeed: number;
  trail: Point[];
  shooter: 1 | 2;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'debris' | 'star';
}

export interface SunState {
  x: number;
  y: number;
  expression: 'smile' | 'surprised' | 'shocked';
  surprisedTimer: number;
  blinkTimer: number;
  isBlinking: boolean;
}

export interface GameSettings {
  gravity: number; // default 9.8
  gravityName: string; // 'Earth (9.8 m/s²)', 'Moon (1.6 m/s²)', etc.
  targetScore: number; // default 3 wins to win match
  showTrajectoryTrail: boolean;
  crtEffect: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  difficulty: AIDifficulty;
}

export interface ShotRecord {
  shooter: 1 | 2;
  angle: number;
  velocity: number;
  wind: number;
  result: 'hit_opponent' | 'hit_self' | 'hit_building' | 'out_of_bounds';
}
