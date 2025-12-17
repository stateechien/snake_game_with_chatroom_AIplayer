import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import ChatRoom from './components/ChatRoom';
import Leaderboard from './components/Leaderboard';
import { GameState, GameStatus, Point } from './types';
import { createSnake, createFood, updateGame } from './services/game';
import { FPS, TOTAL_BOTS, FOOD_COUNT, WORLD_SIZE, BOT_NAMES } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [playerName, setPlayerName] = useState('Player 1');
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Input Refs (avoid closure staleness in loop)
  const inputDir = useRef<Point>({ x: 0, y: -1 });
  const lastProcessedDir = useRef<Point>({ x: 0, y: -1 });

  // Initialize Game
  const startGame = () => {
    const bots = Array.from({ length: TOTAL_BOTS }).map((_, i) => 
      createSnake(`bot-${i}`, BOT_NAMES[i % BOT_NAMES.length])
    );
    const player = createSnake('player-1', playerName, true);
    
    // Starting foods
    const foods = Array.from({ length: FOOD_COUNT }).map(() => createFood());

    setGameState({
      snakes: [player, ...bots],
      foods,
      worldSize: WORLD_SIZE,
      camera: { x: 0, y: 0 },
      gameLoopCount: 0
    });
    
    inputDir.current = { x: 0, y: -1 };
    setStatus(GameStatus.PLAYING);
  };

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
      }

      const current = lastProcessedDir.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (current.y !== 1) inputDir.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (current.y !== -1) inputDir.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (current.x !== 1) inputDir.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (current.x !== -1) inputDir.current = { x: 1, y: 0 };
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    let animationFrameId: number;
    let lastTime = 0;
    const interval = 1000 / FPS;

    const loop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed > interval) {
        setGameState(prev => {
          if (!prev) return null;
          
          // Apply inputs
          lastProcessedDir.current = inputDir.current;
          
          const nextState = updateGame(prev, inputDir.current);
          
          // Check player death
          const player = nextState.snakes.find(s => s.isPlayer);
          if (player && player.isDead) {
            // Delay game over slightly or handle immediately
            // For now, just change status immediately after render
            // setTimeout(() => setStatus(GameStatus.GAME_OVER), 0);
             // We can allow "spectating" or just show game over overlay
          }
          
          return nextState;
        });
        
        lastTime = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status]);

  // Derived state for UI
  const player = gameState?.snakes.find(s => s.isPlayer);
  const isDead = player?.isDead;

  return (
    <div className="w-full h-screen bg-slate-950 flex font-sans overflow-hidden select-none">
      
      {/* Main Game Area */}
      <div className="relative flex-1 h-full">
        
        {/* Render Canvas */}
        {gameState && (
          <GameCanvas 
            gameState={gameState} 
            className="w-full h-full block" 
          />
        )}

        {/* UI Overlays */}
        {status === GameStatus.PLAYING && gameState && (
          <>
            {/* Top Right Leaderboard */}
            <div className="absolute top-4 right-4 z-10">
              <Leaderboard snakes={gameState.snakes} />
            </div>

            {/* Top Left Stats */}
            <div className="absolute top-4 left-4 z-10 text-white drop-shadow-md">
               <h1 className="text-xl font-bold italic tracking-tighter">SNAKE.IO <span className="text-red-500">100</span></h1>
               <div className="text-sm text-slate-300">
                 FPS: {FPS} | Ping: 23ms
               </div>
               {player && (
                 <div className="mt-2 text-2xl font-bold text-yellow-400">
                   Score: {player.score}
                 </div>
               )}
            </div>

            {/* Minimap Placeholder (Visual only for now) */}
            <div className="absolute bottom-4 left-4 w-32 h-32 bg-slate-900/50 border border-slate-700 rounded-full flex items-center justify-center">
               <span className="text-[10px] text-slate-500">Minimap Active</span>
            </div>
            
             {/* Death Screen Overlay */}
             {isDead && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
                <div className="bg-slate-900 p-8 rounded-xl border border-red-500/50 text-center shadow-2xl">
                  <h2 className="text-4xl font-bold text-red-500 mb-2">YOU DIED</h2>
                  <p className="text-slate-300 mb-6">Final Score: {player?.score}</p>
                  <button 
                    onClick={() => setStatus(GameStatus.MENU)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-all transform hover:scale-105"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Menu Screen */}
        {status === GameStatus.MENU && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
             <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center mb-8">
                  <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                    SNAKE.IO 100
                  </h1>
                  <p className="text-slate-400">Battle Royale Simulation</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nickname</label>
                    <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-green-500 focus:outline-none transition-colors"
                      placeholder="Enter name..."
                    />
                  </div>
                  
                  <div className="p-3 bg-slate-900/50 rounded text-xs text-slate-400 border border-slate-800">
                    <p className="mb-1">⚠️ <strong>Simulation Mode</strong></p>
                    <p>You are about to join a room with 99 AI Agents. Chat is powered by Gemini to simulate real player interactions.</p>
                  </div>

                  <button 
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-lg shadow-lg transform transition hover:-translate-y-1"
                  >
                    JOIN SERVER
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Chat */}
      <div className="w-80 h-full border-l border-slate-800 bg-slate-900 hidden md:block z-20 shadow-xl">
        {status === GameStatus.PLAYING && gameState ? (
          <ChatRoom gameState={gameState} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
            Chat available in-game
          </div>
        )}
      </div>

    </div>
  );
};

export default App;