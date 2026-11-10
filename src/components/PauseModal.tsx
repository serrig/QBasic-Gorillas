import React, { useEffect } from 'react';
import { Play, RotateCcw, Settings, Home, Trophy } from 'lucide-react';
import { sound } from '../audio/soundEffects';

interface PauseModalProps {
  onResume: () => void;
  onRestartRound: () => void;
  onOpenSettings: () => void;
  onReturnToTitle: () => void;
  onOpenStats?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestartRound,
  onOpenSettings,
  onReturnToTitle,
  onOpenStats,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-yellow-400 max-w-sm w-full p-6 text-center space-y-5 shadow-2xl">
        <div>
          <span className="text-[11px] font-pixel text-yellow-400 tracking-widest block mb-1">
            GAME PAUSED
          </span>
          <h2 className="text-xl font-pixel text-white">STANDBY</h2>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              sound.playMenuBeep();
              onResume();
            }}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs tracking-wider font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              onRestartRound();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART ROUND</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              onOpenSettings();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>SETTINGS & PHYSICS</span>
          </button>

          {onOpenStats && (
            <button
              onClick={() => {
                sound.playMenuBeep();
                onOpenStats();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-pixel text-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer border border-yellow-500/30"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>ESTADÍSTICAS & RÉCORDS</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playMenuBeep();
              onReturnToTitle();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
