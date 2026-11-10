import React, { useEffect } from 'react';
import { Gorilla, GameMode } from '../types/game';
import { Trophy, RotateCcw, ArrowRight, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../audio/soundEffects';

interface GameOverModalProps {
  winner: Gorilla;
  loser: Gorilla;
  isMatchVictory: boolean;
  roundNumber: number;
  gameMode: GameMode;
  targetScore: number;
  totalShotsThisRound: number;
  onNextRound: () => void;
  onRestartMatch: () => void;
  onReturnToTitle: () => void;
  onOpenStats?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  loser,
  isMatchVictory,
  roundNumber,
  targetScore,
  totalShotsThisRound,
  onNextRound,
  onRestartMatch,
  onReturnToTitle,
  onOpenStats,
}) => {
  useEffect(() => {
    sound.playVictory();

    if (isMatchVictory) {
      // Launch celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFFF00', '#00AAAA', '#AA0000', '#FFFFFF'],
        });
      } catch {}
    }
  }, [isMatchVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-yellow-400 max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
        {/* Victory Icon / Badge */}
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-yellow-400 text-slate-950 flex items-center justify-center rounded-sm shadow-md">
            <Trophy className="w-8 h-8 fill-current" />
          </div>
        </div>

        {/* Title */}
        <div>
          <span className="text-[11px] font-pixel text-yellow-400 tracking-widest block mb-1">
            {isMatchVictory ? 'MATCH CHAMPION' : `ROUND ${roundNumber} COMPLETE`}
          </span>
          <h2 className="text-xl font-pixel text-white">
            {winner.name.toUpperCase()} WINS!
          </h2>
        </div>

        {/* Score Board Comparison */}
        <div className="bg-slate-950 border border-slate-800 p-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center border-r border-slate-800 pr-2">
            <span className="text-xs font-pixel text-sky-400 truncate max-w-[140px]">
              {winner.name}
            </span>
            <span className="text-3xl font-mono font-bold text-white tabular-nums my-1">
              {winner.score}
            </span>
            <span className="text-[10px] text-emerald-400 font-pixel">WINNER</span>
          </div>

          <div className="flex flex-col items-center pl-2">
            <span className="text-xs font-pixel text-rose-400 truncate max-w-[140px]">
              {loser.name}
            </span>
            <span className="text-3xl font-mono font-bold text-slate-400 tabular-nums my-1">
              {loser.score}
            </span>
            <span className="text-[10px] text-slate-500 font-pixel">DEFEATED</span>
          </div>
        </div>

        {/* Round Metadata - Zero Pill Discipline */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
          <span>Shots: {totalShotsThisRound}</span>
          <span aria-hidden="true">·</span>
          <span>Target: First to {targetScore}</span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {!isMatchVictory ? (
            <button
              onClick={() => {
                sound.playRoundStart();
                onNextRound();
              }}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>NEXT ROUND</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playRoundStart();
                onRestartMatch();
              }}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playMenuBeep();
                onRestartMatch();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET SCORES</span>
            </button>

            <button
              onClick={() => {
                sound.playMenuBeep();
                onReturnToTitle();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>TITLE SCREEN</span>
            </button>
          </div>

          {onOpenStats && (
            <button
              onClick={() => {
                sound.playMenuBeep();
                onOpenStats();
              }}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-yellow-400 font-pixel text-[10px] border border-yellow-500/40 hover:border-yellow-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>SALÓN DE LA FAMA & ESTADÍSTICAS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
