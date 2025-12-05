import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GameState, WeaponType } from './types';
import { GAME_CONFIG } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: GAME_CONFIG.PLAYER_MAX_HEALTH,
    wave: 1,
    isGameOver: false,
    isPaused: false,
    isGameStarted: false,
    selectedWeapon: WeaponType.PISTOL,
    ammo: {
        [WeaponType.PISTOL]: Infinity,
        [WeaponType.GRENADE]: Infinity,
        [WeaponType.FLAMETHROWER]: Infinity,
        [WeaponType.REPULSOR]: Infinity,
    }
  });

  const handleRestart = () => {
    setGameState(prev => ({
        ...prev,
        score: 0,
        health: GAME_CONFIG.PLAYER_MAX_HEALTH,
        wave: 1,
        isGameOver: false,
        isPaused: false,
        isGameStarted: true,
        selectedWeapon: WeaponType.PISTOL,
    }));
  };

  const handleStart = () => {
      handleRestart();
  };

  const handlePause = () => {
      setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleQuit = () => {
      setGameState(prev => ({
          ...prev,
          isGameStarted: false,
          isPaused: false,
          isGameOver: false,
      }));
  };

  const handleSelectWeapon = (weapon: WeaponType) => {
    setGameState(prev => ({ ...prev, selectedWeapon: weapon }));
  };

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!gameState.isGameStarted) return;
          
          if (e.key === '1') handleSelectWeapon(WeaponType.PISTOL);
          if (e.key === '2') handleSelectWeapon(WeaponType.GRENADE);
          if (e.key === '3') handleSelectWeapon(WeaponType.FLAMETHROWER);
          if (e.key === '4') handleSelectWeapon(WeaponType.REPULSOR);
          if (e.key === 'Escape') handlePause();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isGameStarted]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 font-sans select-none">
      <GameCanvas gameState={gameState} setGameState={setGameState} />
      <UIOverlay 
        gameState={gameState} 
        onRestart={handleRestart}
        onSelectWeapon={handleSelectWeapon}
        onStart={handleStart}
        onPause={handlePause}
        onQuit={handleQuit}
      />
    </div>
  );
};

export default App;