import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, WeaponType, Zombie, Projectile, Particle, Building } from '../types';
import { GAME_CONFIG, WEAPON_STATS, COLORS } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Game State Refs (for performance in loop)
  const lastTimeRef = useRef<number>(0);
  const zombiesRef = useRef<Zombie[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const frameCountRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number, y: number, isDown: boolean }>({ x: 0, y: 0, isDown: false });
  
  // Track cooldowns per weapon
  const weaponCooldownsRef = useRef<Record<WeaponType, number>>({
      [WeaponType.PISTOL]: 0,
      [WeaponType.GRENADE]: 0,
      [WeaponType.FLAMETHROWER]: 0,
      [WeaponType.REPULSOR]: 0,
  });

  const scoreRef = useRef<number>(0);
  const healthRef = useRef<number>(GAME_CONFIG.PLAYER_MAX_HEALTH);
  const waveRef = useRef<number>(1);
  const spawnTimerRef = useRef<number>(0);

  // Initialize buildings once
  useEffect(() => {
    const buildings: Building[] = [];
    const spacing = 300;
    
    // Background City Skyline
    for (let i = -15; i < 15; i++) {
        const dist = 3000 + Math.random() * 500;
        const w = 200 + Math.random() * 200;
        const h = 600 + Math.random() * 800;
        const x = i * spacing + (Math.random() * 100);
        
        // Generate windows
        const windows = [];
        const rows = Math.floor(h / 50);
        const cols = Math.floor(w / 40);
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                if (Math.random() > 0.6) {
                    windows.push({ x: c * 40 + 10, y: r * 50 + 10, on: Math.random() > 0.3 });
                }
            }
        }

        buildings.push({
            x,
            z: dist,
            width: w,
            height: h,
            color: Math.random() > 0.5 ? COLORS.BUILDING_BASE : COLORS.BUILDING_ACCENT,
            windows
        });
    }
    buildingsRef.current = buildings;
  }, []);

  // Sync refs with React state when restarting
  useEffect(() => {
    if (gameState.isGameStarted && !gameState.isGameOver && zombiesRef.current.length === 0 && gameState.wave === 1 && gameState.score === 0) {
        // Only reset if we are starting a fresh game and state reflects that
        resetGame();
    }
  }, [gameState.isGameStarted, gameState.isGameOver, gameState.score]); 

  const resetGame = () => {
    zombiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    healthRef.current = GAME_CONFIG.PLAYER_MAX_HEALTH;
    waveRef.current = 1;
    frameCountRef.current = 0;
    spawnTimerRef.current = 0;
    weaponCooldownsRef.current = {
        [WeaponType.PISTOL]: 0,
        [WeaponType.GRENADE]: 0,
        [WeaponType.FLAMETHROWER]: 0,
        [WeaponType.REPULSOR]: 0,
    };
  };

  // --- 3D Projection Helper ---
  const project = (x: number, y: number, z: number, canvasWidth: number, canvasHeight: number) => {
    const scale = GAME_CONFIG.FOV / (GAME_CONFIG.FOV + z);
    const x2d = (x * scale) + (canvasWidth / 2);
    const y2d = ((y - GAME_CONFIG.VIEW_HEIGHT) * scale) + (canvasHeight / 2) + 150; 
    return { x: x2d, y: y2d, scale };
  };

  // --- Inverse Projection (Screen to World Ground Plane) ---
  const unprojectGround = (screenX: number, screenY: number, canvasWidth: number, canvasHeight: number) => {
    const cy = (canvasHeight / 2) + 150;
    const yOffset = screenY - cy;
    
    if (yOffset >= 0) return { x: 0, z: 10000 }; 

    const scale = yOffset / (-GAME_CONFIG.VIEW_HEIGHT);
    
    if (scale <= 0) return { x: 0, z: 10000 }; 

    const z = (GAME_CONFIG.FOV / scale) - GAME_CONFIG.FOV;
    const x = (screenX - (canvasWidth / 2)) / scale;

    return { x, z };
  };

  const spawnZombie = (canvasWidth: number) => {
    // Spawn from a wide arc in the distance
    const angle = (Math.random() - 0.5) * Math.PI * 0.8; // +/- 72 degrees spread
    const distance = GAME_CONFIG.ZOMBIE_SPAWN_Z;
    
    // Calculate spawn position based on angle
    const x = Math.sin(angle) * distance * 1.5; // Multiply X to widen the spread visually
    const z = distance;

    // Difficulty scaling
    const speed = 1.5 + (waveRef.current * 0.15) + (Math.random() * 0.5);
    const maxHp = 40 + (waveRef.current * 10);

    zombiesRef.current.push({
      id: Math.random().toString(36),
      x,
      y: 0,
      z,
      width: 45,
      height: 75,
      color: COLORS.ZOMBIE_BODY,
      hp: maxHp,
      maxHp: maxHp,
      speed,
      wobbleOffset: Math.random() * Math.PI * 2,
      isDead: false,
      damageFlash: 0
    });
  };

  const createParticle = (x: number, y: number, z: number, type: Particle['type'], count = 1, options?: { vx?: number, vy?: number, vz?: number, size?: number, color?: string, life?: number }) => {
    for (let i = 0; i < count; i++) {
        const speed = type === 'explosion' ? 15 : 5;
        particlesRef.current.push({
            id: Math.random().toString(),
            x, y, z,
            vx: options?.vx ?? (Math.random() - 0.5) * speed,
            vy: options?.vy ?? (Math.random() - 0.5) * speed + (type === 'fire' ? 3 : 0),
            vz: options?.vz ?? (Math.random() - 0.5) * speed,
            life: options?.life ?? 1.0,
            maxLife: options?.life ?? 1.0,
            size: options?.size ?? (type === 'explosion' ? 20 + Math.random() * 20 : 5 + Math.random() * 5),
            color: options?.color ?? (type === 'fire' ? '#f97316' : type === 'blood' ? COLORS.BLOOD : '#ffffff'),
            type
        });
    }
  };

  const handleInput = (canvasWidth: number, canvasHeight: number) => {
    const currentWeapon = gameState.selectedWeapon;
    const stats = WEAPON_STATS[currentWeapon];
    const cooldown = weaponCooldownsRef.current[currentWeapon];

    if (mouseRef.current.isDown && cooldown <= 0) {
        // Target calculation
        const target = unprojectGround(mouseRef.current.x, mouseRef.current.y, canvasWidth, canvasHeight);

        if (currentWeapon === WeaponType.PISTOL) {
            projectilesRef.current.push({
                id: Math.random().toString(),
                x: 10, y: 30, z: 0,
                vx: target.x * 0.15, 
                vy: 0,
                vz: target.z * 0.15,
                type: 'bullet',
                radius: 3
            });
            weaponCooldownsRef.current[currentWeapon] = stats.cooldown;
        } else if (currentWeapon === WeaponType.GRENADE) {
            const dist = Math.sqrt(target.x * target.x + target.z * target.z);
            const timeToTarget = 40; 
            const vx = target.x / timeToTarget;
            const vz = target.z / timeToTarget;
            const vy = 15; 
            
            projectilesRef.current.push({
                id: Math.random().toString(),
                x: 0, y: 40, z: 0,
                vx, vy, vz,
                type: 'grenade',
                radius: 6
            });
            weaponCooldownsRef.current[currentWeapon] = stats.cooldown;
        } else if (currentWeapon === WeaponType.FLAMETHROWER) {
             // Penetrating Line Logic
             const angle = Math.atan2(target.x, target.z);
             const length = 2000;
             const lineEndX = Math.sin(angle) * length;
             const lineEndZ = Math.cos(angle) * length;

             // Visual Beam
             createParticle(0, 30, 0, 'beam', 1, {
                 vx: lineEndX, vy: 0, vz: lineEndZ, 
                 life: 0.2, color: '#f97316', size: 5
             });
             
             // Check collisions with line segment
             zombiesRef.current.forEach(z => {
                 // Simple distance from point to line check
                 // Line from (0,0) to (lineEndX, lineEndZ)
                 // Zombie at (z.x, z.z)
                 const t = ((z.x * lineEndX) + (z.z * lineEndZ)) / (length * length);
                 const clampedT = Math.max(0, Math.min(1, t));
                 const closestX = clampedT * lineEndX;
                 const closestZ = clampedT * lineEndZ;
                 
                 const dx = z.x - closestX;
                 const dz = z.z - closestZ;
                 const dist = Math.sqrt(dx*dx + dz*dz);
                 
                 if (dist < z.width + 20) {
                     z.hp -= stats.damage;
                     z.damageFlash = 5;
                     createParticle(z.x, z.y + 40, z.z, 'fire', 5);
                 }
             });
             weaponCooldownsRef.current[currentWeapon] = stats.cooldown;
        } else if (currentWeapon === WeaponType.REPULSOR) {
            // Push back EVERYONE
            zombiesRef.current.forEach(z => {
                z.z += WEAPON_STATS[WeaponType.REPULSOR].pushback;
                // Add some knockback randomization
                z.x += (Math.random() - 0.5) * 100;
                z.damageFlash = 10;
            });
            
            // Visual Wave
            createParticle(0, 20, 200, 'shockwave', 1, { life: 0.5, size: 10, color: '#a855f7' });
            
            weaponCooldownsRef.current[currentWeapon] = stats.cooldown;
        }
    }
  };

  const updatePhysics = () => {
    if (healthRef.current <= 0) return;

    // Cooldown Management
    Object.keys(weaponCooldownsRef.current).forEach(key => {
        const k = key as WeaponType;
        if (weaponCooldownsRef.current[k] > 0) {
            weaponCooldownsRef.current[k]--;
        }
    });

    // Spawning (More intense)
    spawnTimerRef.current++;
    const spawnRate = Math.max(15, 60 - (waveRef.current * 4)); // Faster spawning
    if (spawnTimerRef.current > spawnRate) {
        const count = 1 + Math.floor(waveRef.current / 4); // Multiple zombies at once in later waves
        for(let i=0; i<count; i++) {
            spawnZombie(window.innerWidth);
        }
        spawnTimerRef.current = 0;
    }

    // Zombies
    zombiesRef.current.forEach(z => {
        if (z.isDead) return;
        
        // Move towards player (0, 0, 0)
        const dx = 0 - z.x;
        const dz = 0 - z.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        if (dist > 0) {
            const nx = dx / dist;
            const nz = dz / dist;
            
            z.x += nx * z.speed;
            z.z += nz * z.speed;
        }

        // Steering (separation)
        zombiesRef.current.forEach(other => {
            if (z === other) return;
            const odx = z.x - other.x;
            const odz = z.z - other.z;
            const odist = Math.sqrt(odx*odx + odz*odz);
            if (odist < 60) {
                z.x += (odx / odist) * 1;
                z.z += (odz / odist) * 1;
            }
        });

        // Wobble
        z.y = Math.abs(Math.sin(frameCountRef.current * 0.1 + z.wobbleOffset)) * 10;

        if (z.damageFlash > 0) z.damageFlash--;

        // Attack Player
        if (z.z < GAME_CONFIG.ZOMBIE_ATTACK_Z) {
            healthRef.current -= 1; 
            setGameState(prev => ({ ...prev, health: healthRef.current }));
            z.isDead = true; 
            createParticle(z.x, z.y + 30, z.z, 'blood', 10);
        }

        // Death check
        if (z.hp <= 0) {
            z.isDead = true;
            scoreRef.current += 100;
            setGameState(prev => ({ ...prev, score: scoreRef.current }));
            createParticle(z.x, z.y + 30, z.z, 'blood', 15);
        }
    });

    zombiesRef.current = zombiesRef.current.filter(z => !z.isDead);

    // Projectiles
    projectilesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.type === 'grenade') {
            p.vy -= GAME_CONFIG.GRAVITY;
            // Floor hit
            if (p.y <= 0) {
                // Explode
                createParticle(p.x, 0, p.z, 'explosion', 30);
                createParticle(p.x, 0, p.z, 'smoke', 20);
                createParticle(p.x, 0, p.z, 'fire', 15);
                
                // AOE Damage
                const radius = WEAPON_STATS[WeaponType.GRENADE].radius || 200;
                zombiesRef.current.forEach(z => {
                    const dx = z.x - p.x;
                    const dz = z.z - p.z;
                    const dist = Math.sqrt(dx*dx + dz*dz);
                    if (dist < radius) {
                        z.hp -= WEAPON_STATS[WeaponType.GRENADE].damage;
                        z.damageFlash = 5;
                        z.z += 80; // Massive knockback
                    }
                });
                p.y = -9999;
            }
        } else if (p.type === 'bullet') {
             // Bullet Logic
             let hit = false;
             zombiesRef.current.forEach(z => {
                 if (!hit && Math.abs(p.x - z.x) < 35 && Math.abs(p.z - z.z) < 35) {
                     z.hp -= WEAPON_STATS[WeaponType.PISTOL].damage;
                     z.damageFlash = 3;
                     createParticle(p.x, p.y, p.z, 'blood', 4);
                     hit = true;
                 }
             });
             if (hit) p.y = -9999;
             if (p.z > 3000) p.y = -9999;
        }
    });
    projectilesRef.current = projectilesRef.current.filter(p => p.y > -100);

    // Particles
    particlesRef.current.forEach(p => {
        if (p.type === 'shockwave') {
            p.size += 30; // Rapidly expanding ring
            p.life -= 0.05;
        } else if (p.type === 'beam') {
            // Beam is static, just fades
            p.life -= 0.1;
        } else {
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            p.life -= 0.02;
            
            if (p.type === 'fire') {
                p.z += 10;
                p.x += (Math.random() - 0.5) * 8;
                p.size += 0.5;
            }
        }
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Wave Management
    if (scoreRef.current > waveRef.current * 1200) {
        waveRef.current++;
        setGameState(prev => ({ ...prev, wave: waveRef.current }));
    }

    if (healthRef.current <= 0 && !gameState.isGameOver) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear
    ctx.fillStyle = COLORS.SKY_TOP;
    ctx.fillRect(0, 0, width, height);
    
    // Draw Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height / 2);
    gradient.addColorStop(0, COLORS.SKY_TOP);
    gradient.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height / 2 + 150);

    // --- City Skyline (Background) ---
    buildingsRef.current.forEach(b => {
        const p = project(b.x, 0, b.z, width, height);
        const w = b.width * p.scale;
        const h = b.height * p.scale;
        
        ctx.fillStyle = b.color;
        ctx.fillRect(p.x - w/2, p.y - h, w, h);

        // Windows
        ctx.fillStyle = COLORS.WINDOW_LIT;
        b.windows.forEach(win => {
            if (win.on) {
                const wx = p.x - w/2 + (win.x * p.scale);
                const wy = p.y - h + (win.y * p.scale);
                const ws = 20 * p.scale;
                const wh = 30 * p.scale;
                ctx.fillRect(wx, wy, ws, wh);
            }
        });
    });


    // --- Ground & Road ---
    ctx.fillStyle = COLORS.GROUND_FAR;
    ctx.fillRect(0, (height/2) + 150, width, height);

    // Draw Road (Trapezoid)
    const roadWidth = 600;
    const p1 = project(-roadWidth, 0, 0, width, height);
    const p2 = project(roadWidth, 0, 0, width, height);
    const p3 = project(roadWidth, 0, 3000, width, height);
    const p4 = project(-roadWidth, 0, 3000, width, height);

    ctx.fillStyle = COLORS.ROAD;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.fill();

    // Road Markings
    ctx.strokeStyle = COLORS.ROAD_MARKING;
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let z=0; z<3000; z+=400) {
        const start = project(0, 0, z + (frameCountRef.current * 2) % 400, width, height);
        const end = project(0, 0, z + 200 + (frameCountRef.current * 2) % 400, width, height);
        if (start.y > (height/2)+150) {
             ctx.moveTo(start.x, start.y);
             ctx.lineTo(end.x, end.y);
        }
    }
    ctx.stroke();

    // --- Ruins ---
    const ruins = [
        {x: -1000, z: 800, w: 400, h: 300},
        {x: 1200, z: 1200, w: 300, h: 500},
        {x: -900, z: 1800, w: 500, h: 200},
    ];
    ruins.forEach(r => {
        const p = project(r.x, 0, r.z, width, height);
        const w = r.w * p.scale;
        const h = r.h * p.scale;
        ctx.fillStyle = COLORS.RUIN_DARK;
        ctx.fillRect(p.x - w/2, p.y - h, w, h);
    });

    // --- Render Entities ---
    const renderList = [
        ...zombiesRef.current.map(e => ({ type: 'zombie', data: e, z: e.z })),
        ...projectilesRef.current.map(e => ({ type: 'projectile', data: e, z: e.z })),
        ...particlesRef.current.map(e => ({ type: 'particle', data: e, z: e.z }))
    ];

    renderList.sort((a, b) => b.z - a.z);

    renderList.forEach(item => {
        const { type, data } = item;
        // @ts-ignore
        const p = project(data.x, data.y, data.z, width, height);

        if (type === 'zombie') {
            const z = data as Zombie;
            const size = z.width * p.scale;
            const h = z.height * p.scale;

            ctx.fillStyle = z.damageFlash > 0 ? '#ffffff' : z.color;
            
            // Draw Body
            ctx.beginPath();
            ctx.roundRect(p.x - size/2, p.y - h, size, h, 10 * p.scale);
            ctx.fill();

            // Head (Just larger top part implied by eyes)
            if (z.damageFlash === 0) {
                const eyeSize = size * 0.25;
                const eyeOffset = size * 0.25;
                const eyeY = p.y - h + (h * 0.3);

                ctx.fillStyle = COLORS.ZOMBIE_EYE;
                ctx.beginPath();
                ctx.arc(p.x - eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x + eyeOffset, eyeY, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Pupils
                ctx.fillStyle = 'black';
                const px = Math.sin(frameCountRef.current * 0.2) * 2;
                ctx.beginPath();
                ctx.arc(p.x - eyeOffset + px, eyeY, eyeSize/3, 0, Math.PI * 2);
                ctx.arc(p.x + eyeOffset + px, eyeY, eyeSize/3, 0, Math.PI * 2);
                ctx.fill();
                
                // Mouth
                ctx.fillStyle = '#1a2e05';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y - h * 0.4, size * 0.2, size * 0.1, 0, 0, Math.PI);
                ctx.fill();
            }

        } else if (type === 'projectile') {
            const proj = data as Projectile;
            if (proj.type === 'grenade') {
                const r = proj.radius * p.scale;
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(p.x, p.y - r, r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const tail = project(proj.x - proj.vx*3, proj.y - proj.vy*3, proj.z - proj.vz*3, width, height);
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3 * p.scale;
                ctx.beginPath();
                ctx.moveTo(tail.x, tail.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        } else if (type === 'particle') {
            const part = data as Particle;
            if (part.type === 'shockwave') {
                const r = part.size * p.scale;
                ctx.strokeStyle = part.color;
                ctx.lineWidth = 5 * p.scale;
                ctx.globalAlpha = part.life;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, r * 2, r * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (part.type === 'beam') {
                // The beam particle actually carries the end vector in vx,vz
                const start = project(0, 0, 0, width, height); // Player
                const end = project(part.vx, 0, part.vz, width, height); // Target
                
                ctx.strokeStyle = part.color;
                ctx.lineWidth = part.size * p.scale * 4; // Thick beam
                ctx.globalAlpha = part.life;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else {
                const r = part.size * p.scale * part.life;
                ctx.globalAlpha = part.life;
                ctx.fillStyle = part.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    });

    // Draw Crosshair with Cooldown Indicator
    if (!gameState.isGameOver) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        
        const weapon = gameState.selectedWeapon;
        const cooldown = weaponCooldownsRef.current[weapon];
        const maxCooldown = WEAPON_STATS[weapon].cooldown;
        
        ctx.strokeStyle = WEAPON_STATS[weapon].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = WEAPON_STATS[weapon].color;
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();

        // Cooldown Ring
        if (cooldown > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const pct = cooldown / maxCooldown;
            ctx.arc(mx, my, 20, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * pct));
            ctx.stroke();
            
            // Text if long cooldown
            if (maxCooldown > 40) {
                 ctx.fillStyle = 'white';
                 ctx.font = '12px monospace';
                 ctx.fillText((cooldown/60).toFixed(1), mx + 25, my);
            }
        }
    }
  };

  const loop = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (time - lastTimeRef.current > 1000 / 60) {
       // Logic only if playing and not paused
       if (gameState.isGameStarted && !gameState.isGameOver && !gameState.isPaused) {
           handleInput(canvas.width, canvas.height);
           updatePhysics();
       }
       
       draw(ctx, canvas.width, canvas.height);
       
       lastTimeRef.current = time;
       frameCountRef.current++;
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.selectedWeapon, gameState.isGameOver, gameState.isPaused, gameState.isGameStarted]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
  }, []);

  const handleMouseDown = useCallback(() => {
      mouseRef.current.isDown = true;
  }, []);

  const handleMouseUp = useCallback(() => {
      mouseRef.current.isDown = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 cursor-none" // Hide default cursor
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};