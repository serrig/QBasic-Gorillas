import {
  MatchRecord,
  AggregatedStats,
  DifficultyStats,
  INITIAL_AGGREGATED_STATS,
} from '../types/stats';
import { AIDifficulty, GameMode } from '../types/game';

const DB_NAME = 'GorillasGameDB';
const DB_VERSION = 1;
const STORE_MATCHES = 'matches';
const STORE_SUMMARY = 'summary';
const SUMMARY_KEY = 'global_stats';
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024; // 2 MB max backup payload
const MAX_STRING_LEN = 64;
const MAX_IMPORTED_MATCHES = 500;

const VALID_DIFFICULTIES: AIDifficulty[] = ['ROOKIE', 'VETERAN', 'MASTER'];
const VALID_MODES: GameMode[] = ['1P_VS_CPU', '2P_HOTSEAT', 'SANDBOX'];

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_STRING_LEN);
}

function sanitizeNonNegNumber(value: unknown, fallback: number = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.floor(num);
}

function sanitizeDifficultyStats(raw: unknown): DifficultyStats {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    played: sanitizeNonNegNumber(obj.played),
    won: sanitizeNonNegNumber(obj.won),
    currentStreak: sanitizeNonNegNumber(obj.currentStreak),
    bestStreak: sanitizeNonNegNumber(obj.bestStreak),
    totalWinningShots: sanitizeNonNegNumber(obj.totalWinningShots),
    winningRoundsCount: sanitizeNonNegNumber(obj.winningRoundsCount),
  };
}

export function sanitizeAggregatedStats(raw: unknown): AggregatedStats {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const byDiffRaw =
    obj.byDifficulty && typeof obj.byDifficulty === 'object'
      ? (obj.byDifficulty as Record<string, unknown>)
      : {};
  const winsByGravRaw =
    obj.winsByGravity && typeof obj.winsByGravity === 'object'
      ? (obj.winsByGravity as Record<string, unknown>)
      : {};

  const winsByGravity: Record<string, number> = {
    ...INITIAL_AGGREGATED_STATS.winsByGravity,
  };

  for (const [key, val] of Object.entries(winsByGravRaw)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    const safeKey = sanitizeString(key, '');
    if (safeKey) {
      winsByGravity[safeKey] = sanitizeNonNegNumber(val);
    }
  }

  return {
    totalMatches: sanitizeNonNegNumber(obj.totalMatches),
    totalWins: sanitizeNonNegNumber(obj.totalWins),
    totalLosses: sanitizeNonNegNumber(obj.totalLosses),
    currentStreak: sanitizeNonNegNumber(obj.currentStreak),
    bestStreak: sanitizeNonNegNumber(obj.bestStreak),
    totalRoundsPlayed: sanitizeNonNegNumber(obj.totalRoundsPlayed),
    totalShotsFired: sanitizeNonNegNumber(obj.totalShotsFired),
    totalDirectHits: sanitizeNonNegNumber(obj.totalDirectHits),
    holeInOnes: sanitizeNonNegNumber(obj.holeInOnes),
    bestMinShotsToWin: sanitizeNonNegNumber(obj.bestMinShotsToWin),
    bestHeadwindWin: sanitizeNonNegNumber(obj.bestHeadwindWin),
    sunGasps: sanitizeNonNegNumber(obj.sunGasps),
    sunHits: sanitizeNonNegNumber(obj.sunHits),
    cratersCarved: sanitizeNonNegNumber(obj.cratersCarved),
    friendlyFires: sanitizeNonNegNumber(obj.friendlyFires),
    twoPlayerMatches: sanitizeNonNegNumber(obj.twoPlayerMatches),
    winsByGravity,
    byDifficulty: {
      ROOKIE: sanitizeDifficultyStats(byDiffRaw.ROOKIE),
      VETERAN: sanitizeDifficultyStats(byDiffRaw.VETERAN),
      MASTER: sanitizeDifficultyStats(byDiffRaw.MASTER),
    },
  };
}

export function sanitizeMatchRecord(raw: unknown, index: number = 0): MatchRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const gameMode: GameMode = VALID_MODES.includes(obj.gameMode as GameMode)
    ? (obj.gameMode as GameMode)
    : '1P_VS_CPU';

  const difficulty: AIDifficulty = VALID_DIFFICULTIES.includes(obj.difficulty as AIDifficulty)
    ? (obj.difficulty as AIDifficulty)
    : 'VETERAN';

  const winnerPlayer: 1 | 2 = obj.winnerPlayer === 2 ? 2 : 1;
  const gravityNum = Number(obj.gravity);

  return {
    id: sanitizeString(obj.id, `match_${Date.now()}_${index}`),
    date: sanitizeNonNegNumber(obj.date, Date.now()),
    gameMode,
    difficulty,
    p1Name: sanitizeString(obj.p1Name, 'Player 1'),
    p2Name: sanitizeString(obj.p2Name, 'Gorilla AI'),
    winnerPlayer,
    winnerName: sanitizeString(obj.winnerName, winnerPlayer === 1 ? 'Player 1' : 'Gorilla AI'),
    p1Score: sanitizeNonNegNumber(obj.p1Score),
    p2Score: sanitizeNonNegNumber(obj.p2Score),
    targetScore: Math.max(1, sanitizeNonNegNumber(obj.targetScore, 3)),
    totalRounds: Math.max(1, sanitizeNonNegNumber(obj.totalRounds, 1)),
    p1Shots: sanitizeNonNegNumber(obj.p1Shots),
    p2Shots: sanitizeNonNegNumber(obj.p2Shots),
    totalShots: sanitizeNonNegNumber(obj.totalShots),
    gravity: Number.isFinite(gravityNum) && gravityNum > 0 ? gravityNum : 9.8,
    gravityName: sanitizeString(obj.gravityName, 'Earth (9.8 m/s²)'),
    holeInOnes: sanitizeNonNegNumber(obj.holeInOnes),
    minShotsInWinningRound: sanitizeNonNegNumber(obj.minShotsInWinningRound),
    maxHeadwindWon: sanitizeNonNegNumber(obj.maxHeadwindWon),
    sunGasps: sanitizeNonNegNumber(obj.sunGasps),
    sunHits: sanitizeNonNegNumber(obj.sunHits),
    cratersCarved: sanitizeNonNegNumber(obj.cratersCarved),
    friendlyFires: sanitizeNonNegNumber(obj.friendlyFires),
  };
}

export class StatsDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;

  public resetConnection(): void {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    this.initPromise = null;
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }

    this.initPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_MATCHES)) {
            const matchStore = db.createObjectStore(STORE_MATCHES, { keyPath: 'id' });
            matchStore.createIndex('date', 'date', { unique: false });
            matchStore.createIndex('gameMode', 'gameMode', { unique: false });
            matchStore.createIndex('difficulty', 'difficulty', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_SUMMARY)) {
            db.createObjectStore(STORE_SUMMARY);
          }
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onerror = (e) => {
          console.error('Failed to open IndexedDB:', e);
          resolve(null);
        };
      } catch (err) {
        console.error('IndexedDB init error:', err);
        resolve(null);
      }
    });

    return this.initPromise;
  }

  /**
   * Retrieves aggregated lifetime statistics
   */
  async getAggregatedStats(): Promise<AggregatedStats> {
    const db = await this.getDB();
    if (!db) {
      // LocalStorage fallback
      try {
        const raw = localStorage.getItem('gorillas_stats_summary');
        if (raw) return sanitizeAggregatedStats(JSON.parse(raw));
      } catch {}
      return sanitizeAggregatedStats(INITIAL_AGGREGATED_STATS);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_SUMMARY, 'readonly');
        const store = tx.objectStore(STORE_SUMMARY);
        const req = store.get(SUMMARY_KEY);

        req.onsuccess = () => {
          const stats = req.result;
          if (stats) {
            resolve(sanitizeAggregatedStats(stats));
          } else {
            resolve(sanitizeAggregatedStats(INITIAL_AGGREGATED_STATS));
          }
        };

        req.onerror = () => {
          resolve(sanitizeAggregatedStats(INITIAL_AGGREGATED_STATS));
        };
      } catch {
        resolve(sanitizeAggregatedStats(INITIAL_AGGREGATED_STATS));
      }
    });
  }

  /**
   * Records a completed match, saves it to match history, and recalculates aggregated metrics
   */
  async recordMatch(match: MatchRecord): Promise<AggregatedStats> {
    const current = await this.getAggregatedStats();

    // Deep copy current stats
    const updated: AggregatedStats = {
      ...current,
      totalMatches: current.totalMatches + 1,
      totalRoundsPlayed: current.totalRoundsPlayed + match.totalRounds,
      totalShotsFired: current.totalShotsFired + match.totalShots,
      totalDirectHits: current.totalDirectHits + match.p1Score + match.p2Score,
      holeInOnes: current.holeInOnes + match.holeInOnes,
      sunGasps: current.sunGasps + match.sunGasps,
      sunHits: current.sunHits + match.sunHits,
      cratersCarved: current.cratersCarved + match.cratersCarved,
      friendlyFires: current.friendlyFires + match.friendlyFires,
      bestHeadwindWin: Math.max(current.bestHeadwindWin, match.maxHeadwindWon),
      winsByGravity: {
        ...current.winsByGravity,
        [match.gravityName]:
          (current.winsByGravity[match.gravityName] || 0) + (match.winnerPlayer === 1 ? 1 : 0),
      },
      byDifficulty: {
        ROOKIE: { ...current.byDifficulty.ROOKIE },
        VETERAN: { ...current.byDifficulty.VETERAN },
        MASTER: { ...current.byDifficulty.MASTER },
      },
    };

    // Update best min shots to win a round
    if (match.minShotsInWinningRound > 0) {
      if (
        updated.bestMinShotsToWin === 0 ||
        match.minShotsInWinningRound < updated.bestMinShotsToWin
      ) {
        updated.bestMinShotsToWin = match.minShotsInWinningRound;
      }
    }

    const isP1Winner = match.winnerPlayer === 1;

    if (match.gameMode === '1P_VS_CPU') {
      const diffKey = match.difficulty;
      const diffStat = updated.byDifficulty[diffKey];
      diffStat.played += 1;

      if (isP1Winner) {
        updated.totalWins += 1;
        updated.currentStreak += 1;
        if (updated.currentStreak > updated.bestStreak) {
          updated.bestStreak = updated.currentStreak;
        }

        diffStat.won += 1;
        diffStat.currentStreak += 1;
        if (diffStat.currentStreak > diffStat.bestStreak) {
          diffStat.bestStreak = diffStat.currentStreak;
        }

        diffStat.winningRoundsCount += match.p1Score;
        diffStat.totalWinningShots += match.p1Shots;
      } else {
        updated.totalLosses += 1;
        updated.currentStreak = 0;
        diffStat.currentStreak = 0;
      }
    } else if (match.gameMode === '2P_HOTSEAT') {
      updated.twoPlayerMatches += 1;
      if (isP1Winner) {
        updated.totalWins += 1;
      } else {
        updated.totalLosses += 1;
      }
    }

    // Persist to IndexedDB
    const db = await this.getDB();
    if (db) {
      try {
        const tx = db.transaction([STORE_MATCHES, STORE_SUMMARY], 'readwrite');
        const matchStore = tx.objectStore(STORE_MATCHES);
        const summaryStore = tx.objectStore(STORE_SUMMARY);

        matchStore.put(match);
        summaryStore.put(updated, SUMMARY_KEY);

        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.error('Error writing to IndexedDB:', err);
      }
    } else {
      // Fallback to localStorage
      try {
        localStorage.setItem('gorillas_stats_summary', JSON.stringify(updated));
        const historyRaw = localStorage.getItem('gorillas_matches_history') || '[]';
        const history: MatchRecord[] = JSON.parse(historyRaw);
        history.unshift(match);
        localStorage.setItem('gorillas_matches_history', JSON.stringify(history.slice(0, 50)));
      } catch {}
    }

    return updated;
  }

  /**
   * Retrieves the recent matches log (default 15)
   */
  async getRecentMatches(limit: number = 15): Promise<MatchRecord[]> {
    const db = await this.getDB();
    if (!db) {
      try {
        const raw = localStorage.getItem('gorillas_matches_history');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed
              .slice(0, limit)
              .map((m, i) => sanitizeMatchRecord(m, i))
              .filter((m): m is MatchRecord => m !== null);
          }
        }
      } catch {}
      return [];
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_MATCHES, 'readonly');
        const store = tx.objectStore(STORE_MATCHES);
        const index = store.index('date');
        const req = index.openCursor(null, 'prev'); // sorted descending by date
        const results: MatchRecord[] = [];

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
          if (cursor && results.length < limit) {
            const sanitized = sanitizeMatchRecord(cursor.value, results.length);
            if (sanitized) results.push(sanitized);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Exports all matches and summary stats as a downloadable JSON string
   */
  async exportBackup(): Promise<string> {
    const summary = await this.getAggregatedStats();
    const matches = await this.getRecentMatches(MAX_IMPORTED_MATCHES);

    const exportPayload = {
      version: 1,
      appName: 'QBasic Gorillas',
      exportedAt: new Date().toISOString(),
      summary,
      matches,
    };

    return JSON.stringify(exportPayload, null, 2);
  }

  /**
   * Imports a backup JSON file with strict validation & sanitization against malformed/malicious payloads
   */
  async importBackup(jsonString: string): Promise<AggregatedStats> {
    if (typeof jsonString !== 'string' || jsonString.length > MAX_BACKUP_BYTES) {
      throw new Error('El archivo excede el tamaño máximo permitido (2 MB).');
    }

    const parsed = JSON.parse(jsonString, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });

    if (!parsed || typeof parsed !== 'object' || !parsed.summary || typeof parsed.summary !== 'object') {
      throw new Error('Formato de archivo inválido.');
    }

    const summary: AggregatedStats = sanitizeAggregatedStats(parsed.summary);
    const rawMatches: unknown[] = Array.isArray(parsed.matches)
      ? parsed.matches.slice(0, MAX_IMPORTED_MATCHES)
      : [];
    const matches: MatchRecord[] = rawMatches
      .map((m, idx) => sanitizeMatchRecord(m, idx))
      .filter((m): m is MatchRecord => m !== null);

    const db = await this.getDB();
    if (db) {
      const tx = db.transaction([STORE_MATCHES, STORE_SUMMARY], 'readwrite');
      const matchStore = tx.objectStore(STORE_MATCHES);
      const summaryStore = tx.objectStore(STORE_SUMMARY);

      summaryStore.put(summary, SUMMARY_KEY);

      for (const m of matches) {
        matchStore.put(m);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      localStorage.setItem('gorillas_stats_summary', JSON.stringify(summary));
      localStorage.setItem('gorillas_matches_history', JSON.stringify(matches));
    }

    return summary;
  }

  /**
   * Clears all stats and match history back to blank
   */
  async clearAllStats(): Promise<AggregatedStats> {
    const db = await this.getDB();
    if (db) {
      try {
        const tx = db.transaction([STORE_MATCHES, STORE_SUMMARY], 'readwrite');
        tx.objectStore(STORE_MATCHES).clear();
        tx.objectStore(STORE_SUMMARY).clear();
        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        });
      } catch {}
    } else {
      try {
        localStorage.removeItem('gorillas_stats_summary');
        localStorage.removeItem('gorillas_matches_history');
      } catch {}
    }

    return sanitizeAggregatedStats(INITIAL_AGGREGATED_STATS);
  }
}

export const statsDb = new StatsDatabase();
