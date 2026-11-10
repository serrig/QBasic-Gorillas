/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GameMode,
  AIDifficulty,
  GameState,
  Building,
  Crater,
  Gorilla,
  Projectile,
  GameSettings,
} from './types/game';
import { generateCity } from './utils/cityGenerator';
import { calculateLaunchVelocity, calculateAIMove, calculateNextWind } from './utils/physics';
import { sound } from './audio/soundEffects';
import { GorillaCanvas } from './components/GorillaCanvas';
import { ControlPanel } from './components/ControlPanel';
import { TitleScreen } from './components/TitleScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { statsDb } from './services/statsDatabase';
import { MatchRecord } from './types/stats';

const DEFAULT_SETTINGS: GameSettings = {
  gravity: 9.8,
  gravityName: 'Earth (9.8 m/s²)',
  targetScore: 3,
  showTrajectoryTrail: false,
  crtEffect: true,
  soundEnabled: true,
  soundVolume: 0.45,
  difficulty: 'VETERAN',
};

export default function App() {
  // Game lifecycle state
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('1P_VS_CPU');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('VETERAN');

  // Match and Round tracking
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [targetScore, setTargetScore] = useState<number>(3);
  const [totalShotsThisRound, setTotalShotsThisRound] = useState<number>(0);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Cumulative match statistics tracker for IndexedDB
  const matchStatsRef = useRef({
    p1Shots: 0,
    p2Shots: 0,
    holeInOnes: 0,
    minShotsInWinningRound: 0,
    maxHeadwindWon: 0,
    sunGasps: 0,
    sunHits: 0,
    cratersCarved: 0,
    friendlyFires: 0,
  });

  // Skyline & Gorillas
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [craters, setCraters] = useState<Crater[]>([]);
  const [gorilla1, setGorilla1] = useState<Gorilla>({
    playerNumber: 1,
    name: 'Player 1',
    x: 180,
    y: 350,
    width: 32,
    height: 34,
    buildingIndex: 1,
    isHit: false,
    armState: 'idle',
    score: 0,
  });
  const [gorilla2, setGorilla2] = useState<Gorilla>({
    playerNumber: 2,
    name: 'Gorilla AI',
    x: 780,
    y: 350,
    width: 32,
    height: 34,
    buildingIndex: 7,
    isHit: false,
    armState: 'idle',
    score: 0,
  });

  // Turn and inputs
  const [currentTurn, setCurrentTurn] = useState<1 | 2>(1);
  const [angle, setAngle] = useState<number>(45);
  const [power, setPower] = useState<number>(60);
  const [wind, setWind] = useState<number>(0);

  // Active Projectile
  const [activeProjectile, setActiveProjectile] = useState<Projectile | null>(null);

  // Round Winner / Loser
  const [roundWinner, setRoundWinner] = useState<Gorilla | null>(null);
  const [roundLoser, setRoundLoser] = useState<Gorilla | null>(null);

  // CPU Memory for learning in Veteran/Master difficulty
  const lastCpuErrorRef = useRef<{ undershot: boolean; deltaDist: number } | undefined>(undefined);
  const cpuThinkingTimeoutRef = useRef<number | null>(null);
  const consecutiveWindTurnsRef = useRef<number>(1);

  // Generate safe initial wind based on distance
  const getInitialWind = useCallback((gorillaDistance: number) => {
    const safeMax = Math.max(4, Math.min(8, Math.round(10 * (720 / Math.max(500, gorillaDistance)))));
    const sign = Math.random() < 0.5 ? 1 : -1;
    const mag = 1 + Math.floor(Math.random() * safeMax);
    return sign * mag;
  }, []);

  // Initialize a new city skyline & round
  const initRound = useCallback(
    (
      p1Score: number = gorilla1.score,
      p2Score: number = gorilla2.score,
      startingPlayer: 1 | 2 = 1
    ) => {
      // Clear timers
      if (cpuThinkingTimeoutRef.current) {
        clearTimeout(cpuThinkingTimeoutRef.current);
      }

      const canvasWidth = window.innerWidth || 1024;
      const canvasHeight = window.innerHeight || 600;

      const city = generateCity(
        canvasWidth,
        canvasHeight,
        gorilla1.name,
        gorilla2.name,
        p1Score,
        p2Score
      );

      const distance = Math.abs(city.gorilla2.x - city.gorilla1.x);
      const initialWind = getInitialWind(distance);
      consecutiveWindTurnsRef.current = 1;

      setBuildings(city.buildings);
      setCraters([]);
      setGorilla1(city.gorilla1);
      setGorilla2(city.gorilla2);
      setCurrentTurn(startingPlayer);
      setWind(initialWind);
      setActiveProjectile(null);
      setTotalShotsThisRound(0);
      setRoundWinner(null);
      setRoundLoser(null);
      setGameState('PLAYING');

      // Reset default aiming angle
      setAngle(45);
      setPower(60);
      lastCpuErrorRef.current = undefined;
    },
    [gorilla1.name, gorilla1.score, gorilla2.name, gorilla2.score, getInitialWind]
  );

  // Start new match from Title Screen
  const handleStartGame = (
    mode: GameMode,
    difficulty: AIDifficulty,
    p1Name: string,
    p2Name: string,
    matchTargetScore: number,
    partialSettings: Partial<GameSettings>
  ) => {
    setGameMode(mode);
    setAiDifficulty(difficulty);
    setTargetScore(matchTargetScore);
    setRoundNumber(1);

    const mergedSettings = { ...settings, ...partialSettings, difficulty };
    setSettings(mergedSettings);

    // Reset match statistics for IndexedDB
    matchStatsRef.current = {
      p1Shots: 0,
      p2Shots: 0,
      holeInOnes: 0,
      minShotsInWinningRound: 0,
      maxHeadwindWon: 0,
      sunGasps: 0,
      sunHits: 0,
      cratersCarved: 0,
      friendlyFires: 0,
    };

    const canvasWidth = window.innerWidth || 1024;
    const canvasHeight = window.innerHeight || 600;

    const city = generateCity(canvasWidth, canvasHeight, p1Name, p2Name, 0, 0);
    const distance = Math.abs(city.gorilla2.x - city.gorilla1.x);
    const initialWind = getInitialWind(distance);
    consecutiveWindTurnsRef.current = 1;

    setBuildings(city.buildings);
    setCraters([]);
    setGorilla1(city.gorilla1);
    setGorilla2(city.gorilla2);
    setCurrentTurn(1);
    setWind(initialWind);
    setActiveProjectile(null);
    setTotalShotsThisRound(0);
    setRoundWinner(null);
    setRoundLoser(null);
    setGameState('PLAYING');
    setAngle(45);
    setPower(60);
  };

  // Launch Banana Projectile
  const handleFire = useCallback(() => {
    if (gameState !== 'PLAYING' || activeProjectile) return;

    const shooter = currentTurn === 1 ? gorilla1 : gorilla2;
    const { vx, vy } = calculateLaunchVelocity(shooter.playerNumber, angle, power);

    // Initial banana position (near the gorilla's raised hand)
    const startX = shooter.x + (shooter.playerNumber === 1 ? 14 : -14);
    const startY = shooter.y - 28;

    sound.playThrow();

    if (shooter.playerNumber === 1) {
      matchStatsRef.current.p1Shots += 1;
    } else {
      matchStatsRef.current.p2Shots += 1;
    }

    setActiveProjectile({
      x: startX,
      y: startY,
      vx,
      vy,
      rotation: 0,
      spinSpeed: 14,
      trail: [{ x: startX, y: startY }],
      shooter: shooter.playerNumber,
    });

    setTotalShotsThisRound((prev) => prev + 1);
  }, [gameState, activeProjectile, currentTurn, gorilla1, gorilla2, angle, power]);

  // Next Turn logic
  const advanceTurn = useCallback(() => {
    setActiveProjectile(null);

    // Next turn
    const nextPlayer: 1 | 2 = currentTurn === 1 ? 2 : 1;
    setCurrentTurn(nextPlayer);

    // Dynamic wind calculation: frequently alternates sides and avoids impassable walls
    const distance = Math.abs(gorilla2.x - gorilla1.x);
    setWind((prevWind) => {
      const { nextWind, newConsecutiveTurns } = calculateNextWind(
        prevWind,
        consecutiveWindTurnsRef.current,
        distance
      );
      consecutiveWindTurnsRef.current = newConsecutiveTurns;
      return nextWind;
    });

    // Reset arm states
    setGorilla1((g) => ({ ...g, armState: 'idle' }));
    setGorilla2((g) => ({ ...g, armState: 'idle' }));
  }, [currentTurn, gorilla1.x, gorilla2.x]);

  // Handle Banana hit building
  const handleBananaHitBuilding = useCallback(
    (crater: Crater) => {
      setCraters((prev) => [...prev, crater]);
      matchStatsRef.current.cratersCarved += 1;

      // If CPU was shooting, log error offset
      if (currentTurn === 2 && gameMode === '1P_VS_CPU') {
        const delta = crater.x - gorilla1.x;
        // If delta > 0, CPU banana landed to the right of Gorilla 1 (overshot / didn't travel far enough left)
        lastCpuErrorRef.current = {
          undershot: delta > 0,
          deltaDist: Math.abs(delta),
        };
      }

      setTimeout(() => {
        advanceTurn();
      }, 500);
    },
    [advanceTurn, currentTurn, gameMode, gorilla1.x]
  );

  // Handle Banana hit gorilla
  const handleBananaHitGorilla = useCallback(
    (victimNumber: 1 | 2) => {
      const currentProj = activeProjectile;
      setActiveProjectile(null);

      const isP1Victim = victimNumber === 1;
      const winnerNumber: 1 | 2 = isP1Victim ? 2 : 1;

      // Track friendly fire if shooter hit themselves
      if (currentProj && currentProj.shooter === victimNumber) {
        matchStatsRef.current.friendlyFires += 1;
      }

      // Track headwind overcome on winning shot
      const winnerHadHeadwind = winnerNumber === 1 ? wind < 0 : wind > 0;
      if (winnerHadHeadwind) {
        matchStatsRef.current.maxHeadwindWon = Math.max(
          matchStatsRef.current.maxHeadwindWon,
          Math.abs(wind)
        );
      }

      // Track round shot efficiency and hole-in-ones
      const shotsThisRound = totalShotsThisRound;
      if (shotsThisRound === 1) {
        matchStatsRef.current.holeInOnes += 1;
      }
      if (
        matchStatsRef.current.minShotsInWinningRound === 0 ||
        (shotsThisRound > 0 && shotsThisRound < matchStatsRef.current.minShotsInWinningRound)
      ) {
        matchStatsRef.current.minShotsInWinningRound = shotsThisRound || 1;
      }

      // Update hit state and scores
      const updatedP1 = {
        ...gorilla1,
        isHit: isP1Victim,
        score: winnerNumber === 1 ? gorilla1.score + 1 : gorilla1.score,
      };
      const updatedP2 = {
        ...gorilla2,
        isHit: !isP1Victim,
        score: winnerNumber === 2 ? gorilla2.score + 1 : gorilla2.score,
      };

      setGorilla1(updatedP1);
      setGorilla2(updatedP2);

      const winner = winnerNumber === 1 ? updatedP1 : updatedP2;
      const loser = winnerNumber === 1 ? updatedP2 : updatedP1;

      setRoundWinner(winner);
      setRoundLoser(loser);

      // Check if match won
      const isMatchOver = winner.score >= targetScore && gameMode !== 'SANDBOX';

      if (isMatchOver) {
        // Record completed match to IndexedDB
        const record: MatchRecord = {
          id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date: Date.now(),
          gameMode,
          difficulty: aiDifficulty,
          p1Name: gorilla1.name,
          p2Name: gorilla2.name,
          winnerPlayer: winnerNumber,
          winnerName: winner.name,
          p1Score: updatedP1.score,
          p2Score: updatedP2.score,
          targetScore,
          totalRounds: roundNumber,
          p1Shots: matchStatsRef.current.p1Shots,
          p2Shots: matchStatsRef.current.p2Shots,
          totalShots: matchStatsRef.current.p1Shots + matchStatsRef.current.p2Shots,
          gravity: settings.gravity,
          gravityName: settings.gravityName,
          holeInOnes: matchStatsRef.current.holeInOnes,
          minShotsInWinningRound: matchStatsRef.current.minShotsInWinningRound || 1,
          maxHeadwindWon: matchStatsRef.current.maxHeadwindWon,
          sunGasps: matchStatsRef.current.sunGasps,
          sunHits: matchStatsRef.current.sunHits,
          cratersCarved: matchStatsRef.current.cratersCarved,
          friendlyFires: matchStatsRef.current.friendlyFires,
        };

        statsDb.recordMatch(record).catch((err) => {
          console.error('Error saving match record to IndexedDB:', err);
        });
      }

      setTimeout(() => {
        setGameState(isMatchOver ? 'MATCH_VICTORY' : 'ROUND_OVER');
      }, 1100);
    },
    [gorilla1, gorilla2, targetScore, gameMode, activeProjectile, wind, totalShotsThisRound, aiDifficulty, roundNumber, settings.gravity, settings.gravityName]
  );

  // Handle Banana out of bounds
  const handleBananaOutOfBounds = useCallback(() => {
    setTimeout(() => {
      advanceTurn();
    }, 400);
  }, [advanceTurn]);

  // Track Sun interactions
  const handleSunGasp = useCallback(() => {
    matchStatsRef.current.sunGasps += 1;
  }, []);

  const handleSunHit = useCallback(() => {
    matchStatsRef.current.sunHits += 1;
  }, []);

  // CPU Automated Turn
  useEffect(() => {
    if (
      gameState === 'PLAYING' &&
      gameMode === '1P_VS_CPU' &&
      currentTurn === 2 &&
      !activeProjectile
    ) {
      // Calculate realistic AI decision
      const aiMove = calculateAIMove(
        gorilla2,
        gorilla1,
        wind,
        settings.gravity,
        aiDifficulty,
        lastCpuErrorRef.current
      );

      // Add a natural thinking delay
      const thinkDelay = 800 + Math.random() * 600;

      cpuThinkingTimeoutRef.current = window.setTimeout(() => {
        setAngle(aiMove.angle);
        setPower(aiMove.power);

        // Slight micro-pause before release
        setTimeout(() => {
          handleFire();
        }, 300);
      }, thinkDelay);

      return () => {
        if (cpuThinkingTimeoutRef.current) {
          clearTimeout(cpuThinkingTimeoutRef.current);
        }
      };
    }
  }, [
    gameState,
    gameMode,
    currentTurn,
    activeProjectile,
    gorilla1,
    gorilla2,
    wind,
    settings.gravity,
    aiDifficulty,
    handleFire,
  ]);

  // Restart next round in current match
  const handleNextRound = () => {
    setRoundNumber((r) => r + 1);
    // Loser gets first shot in next round!
    const startingPlayer = roundLoser ? roundLoser.playerNumber : 1;
    initRound(gorilla1.score, gorilla2.score, startingPlayer);
  };

  // Restart match entirely (reset scores to 0)
  const handleRestartMatch = () => {
    setRoundNumber(1);
    matchStatsRef.current = {
      p1Shots: 0,
      p2Shots: 0,
      holeInOnes: 0,
      minShotsInWinningRound: 0,
      maxHeadwindWon: 0,
      sunGasps: 0,
      sunHits: 0,
      cratersCarved: 0,
      friendlyFires: 0,
    };
    initRound(0, 0, 1);
  };

  // Return to title screen
  const handleReturnToTitle = () => {
    if (cpuThinkingTimeoutRef.current) {
      clearTimeout(cpuThinkingTimeoutRef.current);
    }
    setActiveProjectile(null);
    setGameState('TITLE_MENU');
    setShowSettingsModal(false);
    setShowStatsModal(false);
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Toggle Pause
  const handleTogglePause = () => {
    setGameState((prev) => (prev === 'PAUSED' ? 'PLAYING' : 'PAUSED'));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          initialSettings={settings}
          onStartGame={handleStartGame}
          onOpenStats={() => setShowStatsModal(true)}
        />
      )}

      {/* Main Game Arena */}
      {gameState !== 'TITLE_MENU' && (
        <>
          {/* Active Canvas Playfield */}
          <GorillaCanvas
            buildings={buildings}
            craters={craters}
            gorilla1={gorilla1}
            gorilla2={gorilla2}
            currentTurn={currentTurn}
            currentAngle={angle}
            currentPower={power}
            wind={wind}
            settings={settings}
            gameState={gameState}
            activeProjectile={activeProjectile}
            onBananaHitBuilding={handleBananaHitBuilding}
            onBananaHitGorilla={handleBananaHitGorilla}
            onBananaOutOfBounds={handleBananaOutOfBounds}
            onSunGasp={handleSunGasp}
            onSunHit={handleSunHit}
            onDragAimChange={(newAngle, newPower) => {
              if (currentTurn === 1 || gameMode === '2P_HOTSEAT') {
                setAngle(newAngle);
                setPower(newPower);
              }
            }}
          />

          {/* World-Matched, Low-Occlusion HUD Overlay */}
          <ControlPanel
            gorilla1={gorilla1}
            gorilla2={gorilla2}
            currentTurn={currentTurn}
            angle={angle}
            power={power}
            wind={wind}
            onChangeAngle={setAngle}
            onChangePower={setPower}
            onFire={handleFire}
            isFiring={activeProjectile !== null}
            gameMode={gameMode}
            gameState={gameState}
            targetScore={targetScore}
            soundMuted={!settings.soundEnabled}
            onToggleSound={() => {
              const next = !settings.soundEnabled;
              sound.setMuted(!next);
              setSettings((s) => ({ ...s, soundEnabled: next }));
            }}
            onOpenSettings={() => setShowSettingsModal(true)}
            onResetRound={() => initRound(gorilla1.score, gorilla2.score, currentTurn)}
            onTogglePause={handleTogglePause}
            onOpenStats={() => setShowStatsModal(true)}
          />
        </>
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => setGameState('PLAYING')}
          onRestartRound={() => initRound(gorilla1.score, gorilla2.score, currentTurn)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onReturnToTitle={handleReturnToTitle}
          onOpenStats={() => setShowStatsModal(true)}
        />
      )}

      {/* Round Won or Match Victory Modal */}
      {(gameState === 'ROUND_OVER' || gameState === 'MATCH_VICTORY') &&
        roundWinner &&
        roundLoser && (
          <GameOverModal
            winner={roundWinner}
            loser={roundLoser}
            isMatchVictory={gameState === 'MATCH_VICTORY'}
            roundNumber={roundNumber}
            gameMode={gameMode}
            targetScore={targetScore}
            totalShotsThisRound={totalShotsThisRound}
            onNextRound={handleNextRound}
            onRestartMatch={handleRestartMatch}
            onReturnToTitle={handleReturnToTitle}
            onOpenStats={() => setShowStatsModal(true)}
          />
        )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
          onReturnToTitle={handleReturnToTitle}
        />
      )}

      {/* Stats & Hall of Fame Modal (IndexedDB) */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
      />
    </main>
  );
}
