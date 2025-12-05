import React from 'react';
import { GameState, WeaponType } from '../types';
import { WEAPON_STATS } from '../constants';

interface UIOverlayProps {
  gameState: GameState;
  onRestart: () => void;
  onSelectWeapon: (w: WeaponType) => void;
  onStart: () => void;
  onPause: () => void;
  onQuit: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
    gameState, 
    onRestart, 
    onSelectWeapon, 
    onStart, 
    onPause, 
    onQuit 
}) => {
  
  // Start Screen
  if (!gameState.isGameStarted) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50 text-white">
            <h1 className="text-7xl font-black text-yellow-500 mb-4 tracking-tighter drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                LAST STAND
            </h1>
            <h2 className="text-3xl text-gray-400 mb-12 font-light tracking-widest">CUTE APOCALYPSE</h2>
            
            <button 
                onClick={onStart}
                className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black text-xl font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(234,179,8,0.4)]"
            >
                START DEFENSE
            </button>
            
            <div className="mt-12 grid grid-cols-4 gap-6 text-center text-sm text-gray-500 max-w-4xl">
                 <div>
                    <div className="text-2xl mb-2">🔫</div>
                    <p>Press 1</p>
                    <p>Pistol</p>
                 </div>
                 <div>
                    <div className="text-2xl mb-2">💣</div>
                    <p>Press 2</p>
                    <p>Grenade</p>
                 </div>
                 <div>
                    <div className="text-2xl mb-2">🔥</div>
                    <p>Press 3</p>
                    <p>Fire Gun</p>
                 </div>
                 <div>
                    <div className="text-2xl mb-2">🔊</div>
                    <p>Press 4</p>
                    <p>Repulsor</p>
                 </div>
            </div>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Health & Score */}
        <div className="flex gap-4">
             <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg min-w-[200px]">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Health</div>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 ${gameState.health > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.max(0, gameState.health)}%` }}
                        />
                    </div>
                    <span className="font-mono font-bold text-lg">{Math.max(0, Math.ceil(gameState.health))}</span>
                </div>
            </div>

            <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Score</div>
                <div className="text-2xl font-bold font-mono text-yellow-400 leading-none">{gameState.score.toLocaleString()}</div>
            </div>

             <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Wave</div>
                <div className="text-2xl font-bold font-mono text-purple-400 leading-none">#{gameState.wave}</div>
            </div>
        </div>

        {/* Right: Controls */}
        <div className="pointer-events-auto flex gap-2">
            <button onClick={onPause} className="p-3 bg-black/50 hover:bg-gray-700 rounded-lg text-white border border-white/10 transition-colors">
                {gameState.isPaused ? '▶️' : '⏸️'}
            </button>
            <button onClick={onQuit} className="p-3 bg-red-900/50 hover:bg-red-800 rounded-lg text-white border border-white/10 transition-colors">
                ❌
            </button>
        </div>
      </div>

      {/* Pause Menu */}
      {gameState.isPaused && !gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
              <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center space-y-4 min-w-[300px]">
                  <h2 className="text-3xl font-bold text-white mb-6">PAUSED</h2>
                  <button onClick={onPause} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">RESUME</button>
                  <button onClick={onQuit} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">QUIT TO MENU</button>
              </div>
          </div>
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto backdrop-blur-md z-50">
          <div className="text-center space-y-8 max-w-lg w-full p-10 bg-gray-900 border-2 border-red-500/50 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-fade-in-up">
            <div>
                <h1 className="text-7xl font-black text-red-500 tracking-tighter drop-shadow-lg mb-2">OVERRUN</h1>
                <p className="text-gray-400 text-lg">The city has fallen.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-800">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-sm uppercase">Score</span>
                    <span className="text-3xl text-white font-mono font-bold">{gameState.score}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-500 text-sm uppercase">Waves</span>
                    <span className="text-3xl text-white font-mono font-bold">{gameState.wave}</span>
                </div>
            </div>

            <div className="space-y-3">
                <button
                onClick={onRestart}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg"
                >
                TRY AGAIN
                </button>
                <button
                onClick={onQuit}
                className="w-full py-3 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
                >
                Main Menu
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Weapons */}
      {!gameState.isGameOver && (
        <div className="pointer-events-auto flex justify-center gap-6 mb-8">
          {Object.values(WeaponType).map((weapon, index) => {
            const isSelected = gameState.selectedWeapon === weapon;
            const stats = WEAPON_STATS[weapon];
            
            return (
              <button
                key={weapon}
                onClick={() => onSelectWeapon(weapon)}
                className={`
                  relative group flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 transition-all duration-200 overflow-hidden
                  ${isSelected 
                    ? 'bg-gray-800 border-yellow-400 -translate-y-2 shadow-[0_10px_20px_rgba(0,0,0,0.5)]' 
                    : 'bg-black/60 border-gray-700 hover:bg-gray-800 hover:border-gray-500'
                  }
                `}
              >
                <div className="text-3xl md:text-4xl mb-1 z-10">{stats.icon}</div>
                <div className={`text-[10px] font-bold uppercase z-10 ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {stats.name}
                </div>
                
                {/* Number Key */}
                <div className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono font-bold z-10">
                    {index + 1}
                </div>

                {/* Selection Glow */}
                {isSelected && (
                    <div className="absolute inset-0 bg-yellow-400/10 z-0 animate-pulse" />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs p-3 rounded-lg w-40 text-center pointer-events-none border border-gray-700 shadow-xl">
                    <p className="font-bold text-yellow-500 mb-1">{stats.name}</p>
                    <p className="text-gray-300 leading-tight">{stats.description}</p>
                    {stats.cooldown > 20 && (
                        <p className="mt-2 text-[10px] text-red-400 uppercase font-bold tracking-wider">Cooldown: {(stats.cooldown/60).toFixed(1)}s</p>
                    )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};