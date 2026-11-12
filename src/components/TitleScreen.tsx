import React, { useState, useEffect } from 'react';
import { GameMode, AIDifficulty, GameSettings } from '../types/game';
import { Play, User, Users, Compass, Volume2, VolumeX, Monitor, HelpCircle, Trophy } from 'lucide-react';
import { sound } from '../audio/soundEffects';
import type { LegalTab } from './LegalModal';

interface TitleScreenProps {
  onStartGame: (
    mode: GameMode,
    difficulty: AIDifficulty,
    p1Name: string,
    p2Name: string,
    targetScore: number,
    settings: Partial<GameSettings>
  ) => void;
  initialSettings: GameSettings;
  onOpenStats?: () => void;
  onOpenLegal?: (tab?: LegalTab) => void;
  onOpenCookieSettings?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  initialSettings,
  onOpenStats,
  onOpenLegal,
  onOpenCookieSettings,
}) => {
  const [mode, setMode] = useState<GameMode>('1P_VS_CPU');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('VETERAN');
  const [p1Name, setP1Name] = useState<string>('Player 1');
  const [p2Name, setP2Name] = useState<string>('Gorilla AI');
  const [targetScore, setTargetScore] = useState<number>(3);
  const [crtEffect, setCrtEffect] = useState<boolean>(initialSettings.crtEffect);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSettings.soundEnabled);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // Sync default P2 name when mode changes
  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    if (newMode === '1P_VS_CPU') {
      setP2Name('Gorilla AI');
    } else if (newMode === '2P_HOTSEAT') {
      setP2Name('Player 2');
    } else {
      setP2Name('Target Dummy');
    }
    sound.playMenuBeep();
  };

  // Keyboard shortcut to start game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!showHowToPlay && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          handleStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleStart = () => {
    sound.playRoundStart();
    onStartGame(mode, difficulty, p1Name.trim() || 'Player 1', p2Name.trim() || 'Player 2', targetScore, {
      crtEffect,
      soundEnabled,
    });
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-between p-6 bg-slate-950 text-slate-100 select-none overflow-y-auto ${
        crtEffect ? 'crt-overlay crt-vignette' : ''
      }`}
    >
      {/* Background Animated EGA Skyline Silhouette */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0000AA" />
              <stop offset="100%" stopColor="#000022" />
            </linearGradient>
          </defs>
          <rect width="1000" height="400" fill="url(#skyGrad)" />
          {/* Skyline silhouette */}
          <rect x="0" y="160" width="100" height="240" fill="#00AAAA" />
          <rect x="110" y="100" width="90" height="300" fill="#AA0000" />
          <rect x="210" y="200" width="80" height="200" fill="#AAAAAA" />
          <rect x="300" y="80" width="110" height="320" fill="#00AAAA" />
          <rect x="420" y="180" width="90" height="220" fill="#AA0000" />
          <rect x="520" y="120" width="120" height="280" fill="#AAAAAA" />
          <rect x="650" y="220" width="85" height="180" fill="#00AAAA" />
          <rect x="745" y="90" width="105" height="310" fill="#AA0000" />
          <rect x="860" y="150" width="140" height="250" fill="#AAAAAA" />
        </svg>
      </div>

      {/* Top Header / Tribute Line */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-yellow-400 font-pixel">IBM PC / MS-DOS</span>
          <span aria-hidden="true">·</span>
          <span>QBASIC GORILLA.BAS (1991)</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sound.setMuted(!next);
              if (next) sound.playMenuBeep();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span className="text-[11px] font-mono">{soundEnabled ? 'SOUND ON' : 'MUTED'}</span>
          </button>

          <button
            onClick={() => {
              setCrtEffect(!crtEffect);
              sound.playMenuBeep();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-mono">{crtEffect ? 'CRT ON' : 'CRT OFF'}</span>
          </button>

          <button
            onClick={() => {
              setShowHowToPlay(!showHowToPlay);
              sound.playMenuBeep();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono">AYUDA</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              onOpenStats?.();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-yellow-300 hover:text-yellow-100 bg-slate-900 border border-yellow-500/50 hover:border-yellow-400 transition-colors cursor-pointer"
            title="Ver estadísticas y récords"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] font-mono">RÉCORDS</span>
          </button>
        </div>
      </div>

      {/* Center Hero: Bespoke Inline SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center my-auto py-4 text-center max-w-3xl">
        <div className="relative mb-3">
          {/* Smiling Sun Mascot SVG */}
          <div className="absolute -top-12 -right-10 w-16 h-16 animate-pulse">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <circle cx="50" cy="50" r="32" fill="#FFFF00" stroke="#000000" strokeWidth="4" />
              {/* Rays */}
              <line x1="50" y1="10" x2="50" y2="2" stroke="#FFFF55" strokeWidth="5" />
              <line x1="50" y1="90" x2="50" y2="98" stroke="#FFFF55" strokeWidth="5" />
              <line x1="10" y1="50" x2="2" y2="50" stroke="#FFFF55" strokeWidth="5" />
              <line x1="90" y1="50" x2="98" y2="50" stroke="#FFFF55" strokeWidth="5" />
              <line x1="22" y1="22" x2="16" y2="16" stroke="#FFFF55" strokeWidth="5" />
              <line x1="78" y1="78" x2="84" y2="84" stroke="#FFFF55" strokeWidth="5" />
              <line x1="78" y1="22" x2="84" y2="16" stroke="#FFFF55" strokeWidth="5" />
              <line x1="22" y1="78" x2="16" y2="84" stroke="#FFFF55" strokeWidth="5" />
              {/* Eyes & smile */}
              <circle cx="42" cy="46" r="4" fill="#000000" />
              <circle cx="58" cy="46" r="4" fill="#000000" />
              <path d="M 40 56 Q 50 68 60 56" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>

          {/* Bespoke Retro Title SVG Lockup */}
          <svg viewBox="0 0 680 110" className="w-full max-w-[580px] drop-shadow-[0_10px_25px_rgba(0,170,170,0.4)]">
            {/* 3D Extrusion Shadow */}
            <text
              x="344"
              y="74"
              textAnchor="middle"
              className="font-pixel text-[46px] fill-[#000055]"
            >
              GORILLAS
            </text>
            <text
              x="342"
              y="72"
              textAnchor="middle"
              className="font-pixel text-[46px] fill-[#005555]"
            >
              GORILLAS
            </text>
            {/* Main Text */}
            <text
              x="340"
              y="70"
              textAnchor="middle"
              className="font-pixel text-[46px] fill-[#FFFF55] stroke-[#AA0000] stroke-[2px]"
            >
              GORILLAS
            </text>
            <text
              x="340"
              y="102"
              textAnchor="middle"
              className="font-pixel text-[13px] fill-[#00AAAA] tracking-[0.35em]"
            >
              CITY SKYLINE ARTILLERY
            </text>
          </svg>
        </div>

        {/* Game Mode Selection */}
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 p-5 mt-2 space-y-4 text-left">
          {/* Mode Switcher */}
          <div>
            <label className="block text-[11px] font-pixel text-slate-400 mb-2">
              SELECT GAME MODE
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleModeChange('1P_VS_CPU')}
                className={`flex flex-col items-center justify-center p-3 border transition-colors ${
                  mode === '1P_VS_CPU'
                    ? 'bg-sky-950 border-sky-400 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-5 h-5 mb-1 text-sky-400" />
                <span className="font-pixel text-[10px]">1P VS CPU</span>
                <span className="text-[10px] text-slate-400 font-sans mt-0.5">Solo vs AI</span>
              </button>

              <button
                onClick={() => handleModeChange('2P_HOTSEAT')}
                className={`flex flex-col items-center justify-center p-3 border transition-colors ${
                  mode === '2P_HOTSEAT'
                    ? 'bg-rose-950 border-rose-400 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-5 h-5 mb-1 text-rose-400" />
                <span className="font-pixel text-[10px]">2 PLAYERS</span>
                <span className="text-[10px] text-slate-400 font-sans mt-0.5">Pass & Play</span>
              </button>

              <button
                onClick={() => handleModeChange('SANDBOX')}
                className={`flex flex-col items-center justify-center p-3 border transition-colors ${
                  mode === 'SANDBOX'
                    ? 'bg-amber-950 border-amber-400 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-5 h-5 mb-1 text-amber-400" />
                <span className="font-pixel text-[10px]">SANDBOX</span>
                <span className="text-[10px] text-slate-400 font-sans mt-0.5">Free Practice</span>
              </button>
            </div>
          </div>

          {/* Conditional Options: AI Difficulty or Player Names */}
          {mode === '1P_VS_CPU' && (
            <div>
              <label className="block text-[11px] font-pixel text-slate-400 mb-2">
                AI DIFFICULTY
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ROOKIE', 'VETERAN', 'MASTER'] as AIDifficulty[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDifficulty(lvl);
                      sound.playMenuBeep();
                    }}
                    className={`py-2 px-3 text-[11px] font-pixel border text-center transition-colors ${
                      difficulty === lvl
                        ? 'bg-yellow-500 text-slate-950 border-yellow-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player Names & Match Target Score */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-pixel text-slate-400 mb-1">
                PLAYER 1 NAME
              </label>
              <input
                type="text"
                maxLength={12}
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-sky-300 font-pixel focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-pixel text-slate-400 mb-1">
                {mode === '1P_VS_CPU' ? 'CPU NAME' : 'PLAYER 2 NAME'}
              </label>
              <input
                type="text"
                maxLength={12}
                value={p2Name}
                disabled={mode === '1P_VS_CPU'}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-rose-300 font-pixel focus:border-rose-400 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* First to N wins */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-pixel text-slate-400">
              FIRST TO WIN
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setTargetScore(num);
                    sound.playMenuBeep();
                  }}
                  className={`w-9 py-1 text-xs font-mono font-bold border transition-colors ${
                    targetScore === num
                      ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {num}
                </button>
              ))}
              <span className="text-[11px] text-slate-400 font-pixel ml-1">ROUNDS</span>
            </div>
          </div>

          {/* Primary Start CTA Button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-slate-950 font-pixel text-sm tracking-widest shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START GAME</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              onOpenStats?.();
            }}
            className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-yellow-400 font-pixel text-xs border border-yellow-500/40 hover:border-yellow-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>SALÓN DE LA FAMA & ESTADÍSTICAS</span>
          </button>
          
          <div className="text-center">
            <span className="text-[10px] font-pixel text-yellow-500 animate-pulse">
              PRESS SPACE OR ENTER TO START
            </span>
          </div>
        </div>
      </div>

      {/* Single Flat Control-Hint Line & Legal Links */}
      <div className="relative z-10 w-full text-center space-y-1.5 pb-2">
        <div className="text-xs text-slate-400 font-mono tracking-tight">
          ↑/↓ Adjust Angle · ←/→ Adjust Velocity · Space / Enter Throw · Esc Pause
        </div>
        {(onOpenLegal || onOpenCookieSettings) && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-500">
            {onOpenLegal && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sound.playMenuBeep();
                    onOpenLegal('notice');
                  }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  Aviso Legal
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playMenuBeep();
                    onOpenLegal('privacy');
                  }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  Privacidad
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playMenuBeep();
                    onOpenLegal('terms');
                  }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  Términos y Salud
                </button>
              </>
            )}
            {onOpenCookieSettings && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playMenuBeep();
                    onOpenCookieSettings();
                  }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  Configurar Cookies
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-pixel text-xs text-yellow-400">HOW TO PLAY GORILLAS</h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                [X]
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
              <p>
                <strong className="text-yellow-400 font-pixel text-[11px]">OBJECTIVE:</strong> Two gorillas stand atop a procedurally generated city skyline. Your goal is to eliminate your opponent by hurling explosive bananas over or through skyscrapers!
              </p>
              <div className="space-y-1.5 border-t border-slate-800 pt-2 font-mono">
                <div className="flex gap-2">
                  <span className="text-sky-400 font-bold">1. ANGLE:</span>
                  <span>Set launch angle: -90° (downward drive) to +90° (skyward lob).</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-yellow-400 font-bold">2. VELOCITY:</span>
                  <span>Set throw power from 1 to 100.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-rose-400 font-bold">3. WIND:</span>
                  <span>Watch the wind gauge in the sky and control bar! Wind alternates dynamically.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 font-bold">4. CRATERS:</span>
                  <span>Bananas blast circular craters in skyscrapers. You can shoot right through carved holes!</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">5. SUN:</span>
                  <span>Fly a banana near the smiling sun to make it gasp!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-pixel text-xs transition-colors"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
