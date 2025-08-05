
import React from 'react';
import { Player } from '../types';

interface PlayerItemProps {
  player: Player;
}

export const PlayerItem: React.FC<PlayerItemProps> = ({ player }) => {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-500/20 text-red-300';
      case 'RB': return 'bg-green-500/20 text-green-300';
      case 'WR': return 'bg-blue-500/20 text-blue-300';
      case 'TE': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-slate-600 text-slate-300';
    }
  }

  return (
    <div className="flex items-center justify-between bg-slate-700/50 p-2 rounded-md text-sm">
      <div className="flex min-w-0 items-center gap-2">
         <span className={`flex-shrink-0 w-8 text-center text-xs font-bold rounded-sm py-0.5 ${getPositionColor(player.position)}`}>
           {player.position}
         </span>
        <span className="font-medium text-slate-200 truncate">{player.name}</span>
        {player.draftRound2024 && (
            <span
              className="flex-shrink-0 text-xs text-cyan-400/80 font-mono"
              title={`2024 League Rookie Draft: Round ${player.draftRound2024}`}
            >
              ('24 R{player.draftRound2024})
            </span>
        )}
      </div>
      <span className="flex-shrink-0 pl-2 text-slate-400">{player.team}</span>
    </div>
  );
};
