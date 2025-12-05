import { WeaponType } from "./types";

export const GAME_CONFIG = {
  PLAYER_MAX_HEALTH: 100,
  FOV: 400, // Field of view / Focal length
  VIEW_HEIGHT: 150, // Camera height
  GROUND_Y: 0,
  ZOMBIE_SPAWN_Z: 2500, // Spawning further away
  ZOMBIE_ATTACK_Z: 100,
  GRAVITY: 0.8,
};

export const WEAPON_STATS = {
  [WeaponType.PISTOL]: {
    name: 'Pea Shooter',
    damage: 35,
    cooldown: 8, // Faster firing
    color: '#3b82f6',
    description: 'Fast single shot.',
    icon: '🔫'
  },
  [WeaponType.GRENADE]: {
    name: 'Pineapple',
    damage: 120,
    radius: 200,
    cooldown: 120, // 2 seconds
    color: '#10b981',
    description: 'Area damage. Slow reload.',
    icon: '💣'
  },
  [WeaponType.FLAMETHROWER]: {
    name: 'Fire Lance',
    damage: 80, // High damage single hit
    cooldown: 50, // Significant cooldown
    color: '#f97316',
    pushback: 0,
    description: 'Penetrates lines of zombies.',
    icon: '🔥'
  },
  [WeaponType.REPULSOR]: {
    name: 'Repulsor',
    damage: 0,
    cooldown: 300, // Very long cooldown (5 seconds)
    color: '#a855f7', // Purple
    pushback: 600,
    description: 'Push BACK all zombies!',
    icon: '🔊'
  }
};

export const COLORS = {
  SKY_TOP: '#020617', // Darker night
  SKY_BOTTOM: '#1e1b4b',
  GROUND_NEAR: '#1c1917',
  GROUND_FAR: '#000000',
  ROAD: '#292524',
  ROAD_MARKING: '#fbbf24',
  RUIN_DARK: '#1c1917',
  RUIN_LIGHT: '#44403c',
  BUILDING_BASE: '#0f172a',
  BUILDING_ACCENT: '#1e293b',
  WINDOW_LIT: '#fef3c7',
  WINDOW_DARK: '#020617',
  ZOMBIE_BODY: '#84cc16', // Lime green
  ZOMBIE_EYE: '#ffffff',
  BLOOD: '#10b981', // Alien blood
};