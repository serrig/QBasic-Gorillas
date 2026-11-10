import React from 'react';
import { GameSettings } from '../types/game';
import { sound } from '../audio/soundEffects';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
  onReturnToTitle?: () => void;
}

const GRAVITY_PRESETS = [
  { name: 'Moon (1.6 m/s²)', value: 1.62 },
  { name: 'Mars (3.7 m/s²)', value: 3.71 },
  { name: 'Earth (9.8 m/s²)', value: 9.8 },
  { name: 'Jupiter (24.8 m/s²)', value: 24.79 },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onReturnToTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-pixel text-xs text-yellow-400 tracking-wider">
            GAME SETTINGS & PHYSICS
          </h2>
          <button
            onClick={() => {
              sound.playMenuBeep();
              onClose();
            }}
            className="text-slate-400 hover:text-white font-mono text-sm px-2 py-1"
          >
            [X]
          </button>
        </div>

        {/* Gravity Setting */}
        <div className="space-y-2">
          <label className="block text-[11px] font-pixel text-slate-300">
            GRAVITY ENVIRONMENT
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GRAVITY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  sound.playMenuBeep();
                  onUpdateSettings({
                    gravity: preset.value,
                    gravityName: preset.name,
                  });
                }}
                className={`py-2 px-3 text-left border text-xs font-mono transition-colors ${
                  Math.abs(settings.gravity - preset.value) < 0.1
                    ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Trajectory Guide */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800">
          <div>
            <span className="block text-xs font-pixel text-slate-300">
              TRAJECTORY ARC PREVIEW
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              Visualizes the predicted ballistic arc
            </span>
          </div>
          <button
            onClick={() => {
              sound.playMenuBeep();
              onUpdateSettings({ showTrajectoryTrail: !settings.showTrajectoryTrail });
            }}
            className={`w-12 h-6 flex items-center px-1 border transition-colors ${
              settings.showTrajectoryTrail
                ? 'bg-emerald-600 border-emerald-400 justify-end'
                : 'bg-slate-800 border-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 bg-white" />
          </button>
        </div>

        {/* CRT Scanline Effect */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800">
          <div>
            <span className="block text-xs font-pixel text-slate-300">
              RETRO CRT SCANLINES
            </span>
            <span className="text-[11px] text-slate-500 font-sans">
              Simulates vintage 1991 arcade monitor scanlines
            </span>
          </div>
          <button
            onClick={() => {
              sound.playMenuBeep();
              onUpdateSettings({ crtEffect: !settings.crtEffect });
            }}
            className={`w-12 h-6 flex items-center px-1 border transition-colors ${
              settings.crtEffect
                ? 'bg-sky-600 border-sky-400 justify-end'
                : 'bg-slate-800 border-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 bg-white" />
          </button>
        </div>

        {/* Audio Volume */}
        <div className="space-y-2 py-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel text-slate-300">
              SOUND EFFECTS VOLUME
            </span>
            <span className="text-xs font-mono text-yellow-400 tabular-nums">
              {settings.soundEnabled ? `${Math.round(settings.soundVolume * 100)}%` : 'MUTED'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundEnabled ? settings.soundVolume : 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const enabled = val > 0;
              sound.setVolume(val);
              sound.setMuted(!enabled);
              onUpdateSettings({
                soundVolume: val,
                soundEnabled: enabled,
              });
            }}
            className="w-full accent-yellow-400 bg-slate-800 h-1.5 cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {onReturnToTitle && (
            <button
              onClick={() => {
                sound.playMenuBeep();
                onReturnToTitle();
              }}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-pixel text-[10px] transition-colors"
            >
              QUIT TO TITLE
            </button>
          )}

          <button
            onClick={() => {
              sound.playMenuBeep();
              onClose();
            }}
            className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs font-bold transition-colors"
          >
            RESUME GAME
          </button>
        </div>
      </div>
    </div>
  );
};
