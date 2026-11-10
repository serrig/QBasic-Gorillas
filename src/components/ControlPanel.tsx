import React, { useEffect, useRef, useState } from 'react';
import { Gorilla, GameMode, GameState } from '../types/game';
import { Volume2, VolumeX, Pause, Play, Settings, RotateCcw, Wind, Trophy } from 'lucide-react';
import { sound } from '../audio/soundEffects';

interface ControlPanelProps {
  gorilla1: Gorilla;
  gorilla2: Gorilla;
  currentTurn: 1 | 2;
  angle: number;
  power: number;
  wind: number;
  onChangeAngle: (val: number) => void;
  onChangePower: (val: number) => void;
  onFire: () => void;
  isFiring: boolean;
  gameMode: GameMode;
  gameState: GameState;
  targetScore: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onResetRound: () => void;
  onTogglePause: () => void;
  onOpenStats?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  gorilla1,
  gorilla2,
  currentTurn,
  angle,
  power,
  wind,
  onChangeAngle,
  onChangePower,
  onFire,
  isFiring,
  gameMode,
  gameState,
  targetScore,
  soundMuted,
  onToggleSound,
  onOpenSettings,
  onResetRound,
  onTogglePause,
  onOpenStats,
}) => {
  const angleInputRef = useRef<HTMLInputElement>(null);
  const [angleText, setAngleText] = useState<string>(angle.toString());

  // Synchronize local angleText when angle changes externally
  useEffect(() => {
    setAngleText(angle.toString());
  }, [angle]);

  const activeGorilla = currentTurn === 1 ? gorilla1 : gorilla2;
  const isCpuTurn = gameMode === '1P_VS_CPU' && currentTurn === 2;

  // Compute tactical wind guidance for active player
  const absWind = Math.abs(wind);
  // For P1 (shooting right / +X): positive wind is tailwind, negative is headwind
  // For P2 (shooting left / -X): negative wind is tailwind, positive is headwind
  const isP1 = currentTurn === 1;
  const isTailwind = isP1 ? wind > 0 : wind < 0;
  const isHeadwind = isP1 ? wind < 0 : wind > 0;

  let windAdvice = 'CALM: Standard ~45° arc for maximum ballistic range.';
  if (angle < 0) {
    windAdvice = `NEGATIVE ANGLE (${angle}°): Drives downward toward lower buildings or street level.`;
  } else if (isTailwind) {
    if (absWind >= 8) {
      windAdvice = `STRONG TAILWIND (+${absWind}): Pushes banana forward! Aim steep (55°–68°) or reduce velocity to avoid overshooting.`;
    } else {
      windAdvice = `LIGHT TAILWIND (+${absWind}): Carries your shot forward. Aim slightly higher (48°–58°) or trim 5–10% velocity.`;
    }
  } else if (isHeadwind) {
    if (absWind >= 8) {
      windAdvice = `STRONG HEADWIND (-${absWind}): Pushes banana back! Aim low (25°–38°) with high velocity to pierce through.`;
    } else {
      windAdvice = `LIGHT HEADWIND (-${absWind}): Slight drag. Aim lower (35°–42°) and add 5–10% velocity.`;
    }
  }

  // Global hotkeys for controls: Up/Down arrow for Angle (-90 to +90), Left/Right arrow for Power, Enter/Space for Fire
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || isFiring || isCpuTurn) return;

      // Ignore if user is currently typing in an input
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Enter') {
          (document.activeElement as HTMLElement).blur();
          onFire();
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onChangeAngle(Math.min(90, angle + 1));
        sound.playMenuBeep();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onChangeAngle(Math.max(-90, angle - 1));
        sound.playMenuBeep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChangePower(Math.min(100, power + 1));
        sound.playMenuBeep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onChangePower(Math.max(1, power - 1));
        sound.playMenuBeep();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onFire();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isFiring, isCpuTurn, angle, power, onChangeAngle, onChangePower, onFire, onTogglePause]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Header: Perimeter Status Cluster & Score Readout */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        {/* Player 1 Status Card */}
        <div
          className={`flex items-center gap-3 px-3 py-2 border transition-all ${
            currentTurn === 1 && gameState === 'PLAYING'
              ? 'bg-sky-950/90 border-sky-400 shadow-md shadow-sky-950/50'
              : 'bg-slate-900/80 border-slate-700/80'
          }`}
        >
          <div className="w-2.5 h-2.5 bg-sky-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-pixel text-sky-300 tracking-wider">
              {gorilla1.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-pixel">
              <span>WINS</span>
              <span className="text-white text-sm font-bold tabular-nums">
                {gorilla1.score}
              </span>
              <span className="text-slate-500 font-sans">/</span>
              <span className="text-slate-400 tabular-nums">{targetScore}</span>
            </div>
          </div>
        </div>

        {/* Center Banner: Turn Notification & Quick Wind Readout */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-slate-900/95 border border-slate-700 px-4 py-1.5 flex items-center gap-3 shadow-lg">
            <span className="text-[11px] font-pixel text-yellow-400 tracking-wide">
              {isFiring
                ? 'BANANA IN FLIGHT...'
                : isCpuTurn
                ? 'CPU COMPUTING TRAJECTORY...'
                : `${activeGorilla.name.toUpperCase()}'S TURN`}
            </span>

            <span className="text-slate-600 font-pixel">|</span>

            {/* Quick Wind Badge in top bar */}
            <div className="flex items-center gap-1.5 font-pixel text-[10px]">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">WIND:</span>
              {wind > 0 ? (
                <span className="text-sky-400 font-bold tracking-tight">
                  {absWind} { '►'.repeat(Math.min(4, Math.ceil(absWind / 3.5))) }
                </span>
              ) : wind < 0 ? (
                <span className="text-rose-400 font-bold tracking-tight">
                  { '◄'.repeat(Math.min(4, Math.ceil(absWind / 3.5))) } {absWind}
                </span>
              ) : (
                <span className="text-yellow-400 font-bold">CALM (0)</span>
              )}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 font-sans font-medium tracking-tight">
            ↑/↓ Angle · ←/→ Power · Space Throw · Esc Pause
          </span>
        </div>

        {/* Player 2 Status Card */}
        <div
          className={`flex items-center gap-3 px-3 py-2 border transition-all ${
            currentTurn === 2 && gameState === 'PLAYING'
              ? 'bg-rose-950/90 border-rose-400 shadow-md shadow-rose-950/50'
              : 'bg-slate-900/80 border-slate-700/80'
          }`}
        >
          <div className="flex flex-col text-right">
            <span className="text-xs font-pixel text-rose-300 tracking-wider">
              {gorilla2.name}
            </span>
            <div className="flex items-center justify-end gap-2 text-xs text-slate-300 font-pixel">
              <span>WINS</span>
              <span className="text-white text-sm font-bold tabular-nums">
                {gorilla2.score}
              </span>
              <span className="text-slate-500 font-sans">/</span>
              <span className="text-slate-400 tabular-nums">{targetScore}</span>
            </div>
          </div>
          <div className="w-2.5 h-2.5 bg-rose-400 shrink-0" />
        </div>
      </div>

      {/* Bottom Control Bar: Low-Occlusion, World-Matched HUD */}
      <div className="flex items-end justify-between gap-4 pointer-events-auto">
        {/* Quick Utilities: Sound, Settings, Pause */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1">
          <button
            onClick={() => {
              onToggleSound();
              sound.playMenuBeep();
            }}
            title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              onTogglePause();
              sound.playMenuBeep();
            }}
            title={gameState === 'PAUSED' ? 'Resume' : 'Pause'}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {gameState === 'PAUSED' ? <Play className="w-4 h-4 text-yellow-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              onOpenSettings();
              sound.playMenuBeep();
            }}
            title="Settings"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              onResetRound();
              sound.playMenuBeep();
            }}
            title="Regenerate Skyline"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onOpenStats && (
            <button
              onClick={() => {
                onOpenStats();
                sound.playMenuBeep();
              }}
              title="Estadísticas y Récords"
              className="p-2 text-yellow-400 hover:text-yellow-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Central Tactical Launcher & Wind Gauge Module */}
        <div className="flex flex-col items-center gap-1 max-w-3xl w-full">
          {/* Tactical Wind Indicator & Angling Advisory Strip */}
          <div className="w-full bg-slate-950/95 border border-cyan-500/60 shadow-xl px-3 py-1.5 flex flex-col md:flex-row items-center justify-between gap-2">
            {/* Visual Wind Speed & Direction Box */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-pixel px-2 py-1 bg-slate-900 border border-slate-700">
                <Wind className="w-4 h-4 text-cyan-300" />
                <span className="text-slate-400">WIND:</span>
                {wind > 0 ? (
                  <span className="text-sky-300 font-bold tabular-nums">
                    {absWind} MPH EAST ►►
                  </span>
                ) : wind < 0 ? (
                  <span className="text-rose-300 font-bold tabular-nums">
                    ◄◄ {absWind} MPH WEST
                  </span>
                ) : (
                  <span className="text-yellow-300 font-bold">
                    0 MPH CALM
                  </span>
                )}
              </div>

              {/* Graphic Wind Balance Bar (center 0) */}
              <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 border border-slate-800 px-2 py-1 h-6 w-32 relative">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-500 z-10" />
                {/* Wind filling */}
                {wind !== 0 && (
                  <div
                    className={`h-2.5 transition-all ${wind > 0 ? 'bg-sky-400' : 'bg-rose-400'}`}
                    style={{
                      width: `${Math.min(50, (absWind / 15) * 50)}%`,
                      marginLeft: wind > 0 ? '50%' : `${50 - Math.min(50, (absWind / 15) * 50)}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Tactical Angle Guidance */}
            <div className="flex items-center gap-1 text-[11px] font-sans text-slate-200 truncate">
              <span className="font-pixel text-[9px] text-yellow-400 shrink-0">AIM ADVICE:</span>
              <span className="truncate">{windAdvice}</span>
            </div>
          </div>

          {/* Primary Controls Row: Angle, Velocity, Throw Button */}
          <div
            className={`w-full bg-slate-900/95 border ${
              currentTurn === 1 ? 'border-sky-500/80' : 'border-rose-500/80'
            } px-4 py-2.5 shadow-2xl flex items-center justify-between gap-4`}
          >
            {/* Angle Input Section */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-pixel text-slate-300">ANGLE</span>
                  {/* Visual trajectory hint icon */}
                  <span className="text-[10px] font-mono text-slate-400">
                    {angle < 0
                      ? '(Downward)'
                      : angle === 0
                      ? '(Horizontal)'
                      : angle >= 60
                      ? '(High Lob)'
                      : angle <= 35
                      ? '(Flat Drive)'
                      : '(Standard)'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-yellow-400 tabular-nums">
                  {angle}°
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={isFiring || isCpuTurn || angle <= -90}
                  onClick={() => {
                    onChangeAngle(Math.max(-90, angle - 5));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Decrease angle by 5°"
                >
                  -5
                </button>
                <button
                  disabled={isFiring || isCpuTurn || angle <= -90}
                  onClick={() => {
                    onChangeAngle(Math.max(-90, angle - 1));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Decrease angle by 1°"
                >
                  -1
                </button>
                <input
                  ref={angleInputRef}
                  type="text"
                  inputMode="numeric"
                  value={angleText}
                  disabled={isFiring || isCpuTurn}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAngleText(val);
                    if (val === '-' || val === '') return;
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      onChangeAngle(Math.max(-90, Math.min(90, parsed)));
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(angleText, 10);
                    if (isNaN(parsed)) {
                      setAngleText(angle.toString());
                    } else {
                      const clamped = Math.max(-90, Math.min(90, parsed));
                      onChangeAngle(clamped);
                      setAngleText(clamped.toString());
                    }
                  }}
                  className="w-16 px-1 py-1 text-center bg-slate-950 border border-slate-700 text-white font-mono text-sm tabular-nums focus:border-yellow-400 focus:outline-none"
                  title="Launch Angle: -90° (downward) to +90° (upward)"
                  aria-label="Launch Angle"
                />
                <button
                  disabled={isFiring || isCpuTurn || angle >= 90}
                  onClick={() => {
                    onChangeAngle(Math.min(90, angle + 1));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Increase angle by 1°"
                >
                  +1
                </button>
                <button
                  disabled={isFiring || isCpuTurn || angle >= 90}
                  onClick={() => {
                    onChangeAngle(Math.min(90, angle + 5));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Increase angle by 5°"
                >
                  +5
                </button>
              </div>
              {/* Range Slider for Angle (-90 to +90) */}
              <input
                type="range"
                min="-90"
                max="90"
                value={angle}
                disabled={isFiring || isCpuTurn}
                onChange={(e) => onChangeAngle(parseInt(e.target.value, 10))}
                className="w-full accent-yellow-400 h-1 bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                title="Launch Angle Slider (-90° to +90°)"
              />
            </div>

            <div className="h-12 w-[1px] bg-slate-800" />

            {/* Velocity / Power Input Section */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-pixel text-slate-300">VELOCITY</span>
                <span className="text-xs font-mono font-bold text-yellow-400 tabular-nums">
                  {power}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={isFiring || isCpuTurn || power <= 5}
                  onClick={() => {
                    onChangePower(Math.max(1, power - 10));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  -10
                </button>
                <button
                  disabled={isFiring || isCpuTurn || power <= 1}
                  onClick={() => {
                    onChangePower(Math.max(1, power - 1));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={power}
                  disabled={isFiring || isCpuTurn}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      onChangePower(Math.max(1, Math.min(100, val)));
                    }
                  }}
                  className="w-14 px-1.5 py-1 text-center bg-slate-950 border border-slate-700 text-white font-mono text-sm tabular-nums focus:border-yellow-400 focus:outline-none"
                  aria-label="Launch Velocity"
                />
                <button
                  disabled={isFiring || isCpuTurn || power >= 100}
                  onClick={() => {
                    onChangePower(Math.min(100, power + 1));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  +1
                </button>
                <button
                  disabled={isFiring || isCpuTurn || power >= 100}
                  onClick={() => {
                    onChangePower(Math.min(100, power + 10));
                    sound.playMenuBeep();
                  }}
                  className="px-1.5 py-1 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  +10
                </button>
              </div>
              {/* Range Slider for Power */}
              <input
                type="range"
                min="1"
                max="100"
                value={power}
                disabled={isFiring || isCpuTurn}
                onChange={(e) => onChangePower(parseInt(e.target.value, 10))}
                className="w-full accent-yellow-400 h-1 bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <div className="h-12 w-[1px] bg-slate-800" />

            {/* Primary Action Button: THROW */}
            <button
              disabled={isFiring || isCpuTurn}
              onClick={onFire}
              className={`px-6 py-3 font-pixel text-xs tracking-wider transition-all shadow-md shrink-0 whitespace-nowrap cursor-pointer ${
                currentTurn === 1
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 active:translate-y-0.5'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950 active:translate-y-0.5'
              } disabled:opacity-50 disabled:pointer-events-none font-bold`}
            >
              {isFiring ? 'IN FLIGHT...' : isCpuTurn ? 'WAITING...' : 'THROW (SPACE)'}
            </button>
          </div>
        </div>

        {/* Legend / Tip Box */}
        <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 text-[10px] text-slate-400 font-mono hidden md:block">
          <div>DRAG GORILLA TO SLINGSHOT AIM</div>
          <div className="text-slate-500">OR USE ANGLE & VELOCITY KEYS</div>
        </div>
      </div>
    </div>
  );
};
