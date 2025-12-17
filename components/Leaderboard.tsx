import React from 'react';
import { Snake } from '../types';

interface LeaderboardProps {
  snakes: Snake[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ snakes }) => {
  const sorted = [...snakes]
    .filter(s => !s.isDead)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="bg-slate-900/80 backdrop-blur rounded p-3 text-xs w-48 border border-slate-700">
      <h3 className="text-slate-400 font-bold uppercase mb-2">Leaderboard</h3>
      <div className="space-y-1">
        {sorted.map((snake, i) => (
          <div key={snake.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-slate-500 w-4 text-right">{i + 1}.</span>
              <span 
                className={`truncate max-w-[100px] font-medium ${snake.isPlayer ? 'text-yellow-400' : 'text-slate-300'}`}
              >
                {snake.name}
              </span>
            </div>
            <span className="text-slate-400">{snake.score}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-700 text-center text-slate-500 text-[10px]">
        {snakes.filter(s => !s.isDead).length} / {snakes.length} Alive
      </div>
    </div>
  );
};

export default Leaderboard;