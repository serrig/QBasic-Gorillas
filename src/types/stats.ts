import { GameMode, AIDifficulty } from './game';

export interface MatchRecord {
  id: string;
  date: number; // timestamp
  gameMode: GameMode;
  difficulty: AIDifficulty;
  p1Name: string;
  p2Name: string;
  winnerPlayer: 1 | 2;
  winnerName: string;
  p1Score: number;
  p2Score: number;
  targetScore: number;
  totalRounds: number;
  p1Shots: number;
  p2Shots: number;
  totalShots: number;
  gravity: number;
  gravityName: string;
  holeInOnes: number; // rounds won on the very first shot
  minShotsInWinningRound: number;
  maxHeadwindWon: number; // max negative wind (for shooter) overcome on a winning shot
  sunGasps: number;
  sunHits: number;
  cratersCarved: number;
  friendlyFires: number;
}

export interface DifficultyStats {
  played: number;
  won: number;
  currentStreak: number;
  bestStreak: number;
  totalWinningShots: number;
  winningRoundsCount: number;
}

export interface AggregatedStats {
  totalMatches: number;
  totalWins: number; // P1 wins
  totalLosses: number; // P1 losses vs CPU or P2 wins in hotseat
  currentStreak: number;
  bestStreak: number;
  totalRoundsPlayed: number;
  totalShotsFired: number;
  totalDirectHits: number;
  holeInOnes: number; // 1-shot round KOs
  bestMinShotsToWin: number;
  sunGasps: number;
  sunHits: number;
  cratersCarved: number;
  friendlyFires: number;
  bestHeadwindWin: number; // highest headwind overcome
  winsByGravity: Record<string, number>;
  byDifficulty: {
    ROOKIE: DifficultyStats;
    VETERAN: DifficultyStats;
    MASTER: DifficultyStats;
  };
  twoPlayerMatches: number;
}

export const INITIAL_DIFFICULTY_STATS: DifficultyStats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalWinningShots: 0,
  winningRoundsCount: 0,
};

export const INITIAL_AGGREGATED_STATS: AggregatedStats = {
  totalMatches: 0,
  totalWins: 0,
  totalLosses: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalRoundsPlayed: 0,
  totalShotsFired: 0,
  totalDirectHits: 0,
  holeInOnes: 0,
  bestMinShotsToWin: 0,
  sunGasps: 0,
  sunHits: 0,
  cratersCarved: 0,
  friendlyFires: 0,
  bestHeadwindWin: 0,
  winsByGravity: {
    'Earth (9.8 m/s²)': 0,
    'Moon (1.6 m/s²)': 0,
    'Mars (3.7 m/s²)': 0,
    'Jupiter (24.8 m/s²)': 0,
  },
  byDifficulty: {
    ROOKIE: { ...INITIAL_DIFFICULTY_STATS },
    VETERAN: { ...INITIAL_DIFFICULTY_STATS },
    MASTER: { ...INITIAL_DIFFICULTY_STATS },
  },
  twoPlayerMatches: 0,
};
