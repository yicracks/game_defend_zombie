export enum WeaponType {
  PISTOL = 'PISTOL',
  GRENADE = 'GRENADE',
  FLAMETHROWER = 'FLAMETHROWER',
  REPULSOR = 'REPULSOR',
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Entity extends Point3D {
  id: string;
  width: number;
  height: number;
  color: string;
}

export interface Zombie extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  wobbleOffset: number;
  isDead: boolean;
  damageFlash: number; // Frames to flash white when hit
}

export interface Particle extends Point3D {
  id: string;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'fire' | 'explosion' | 'smoke' | 'blood' | 'shockwave' | 'beam';
}

export interface Projectile extends Point3D {
  id: string;
  vx: number;
  vy: number;
  vz: number;
  type: 'bullet' | 'grenade';
  radius: number;
}

export interface Building {
    x: number;
    z: number;
    width: number;
    height: number;
    color: string;
    windows: { x: number; y: number; on: boolean }[];
}

export interface GameState {
  score: number;
  health: number;
  wave: number;
  isGameOver: boolean;
  isPaused: boolean;
  isGameStarted: boolean;
  selectedWeapon: WeaponType;
  ammo: Record<WeaponType, number>;
}