import { describe, it, expect, beforeEach } from 'vitest';
import {
  statsDb,
  StatsDatabase,
  sanitizeAggregatedStats,
  sanitizeMatchRecord,
  MAX_BACKUP_BYTES,
} from './statsDatabase';
import { MatchRecord } from '../types/stats';

function createSampleMatch(overrides: Partial<MatchRecord> = {}): MatchRecord {
  return {
    id: `match_${Date.now()}_${Math.random()}`,
    date: Date.now(),
    gameMode: '1P_VS_CPU',
    difficulty: 'VETERAN',
    p1Name: 'Player 1',
    p2Name: 'Gorilla AI',
    winnerPlayer: 1,
    winnerName: 'Player 1',
    p1Score: 3,
    p2Score: 1,
    targetScore: 3,
    totalRounds: 4,
    p1Shots: 8,
    p2Shots: 7,
    totalShots: 15,
    gravity: 9.8,
    gravityName: 'Earth (9.8 m/s²)',
    holeInOnes: 1,
    minShotsInWinningRound: 1,
    maxHeadwindWon: 9,
    sunGasps: 2,
    sunHits: 1,
    cratersCarved: 5,
    friendlyFires: 0,
    ...overrides,
  };
}

describe('statsDatabase and security sanitizers', () => {
  beforeEach(async () => {
    localStorage.clear();
    await statsDb.clearAllStats();
  });

  describe('security sanitizers', () => {
    it('sanitizes malformed or negative numbers and prototype pollution keys in stats', () => {
      const dirty = {
        totalMatches: -50,
        totalWins: '12',
        totalLosses: NaN,
        winsByGravity: {
          'Earth (9.8 m/s²)': 5,
          __proto__: 999,
          constructor: 999,
        },
        byDifficulty: {
          ROOKIE: { played: 4, won: 3, currentStreak: -2 },
        },
      };

      const clean = sanitizeAggregatedStats(dirty);
      expect(clean.totalMatches).toBe(0);
      expect(clean.totalWins).toBe(12);
      expect(clean.totalLosses).toBe(0);
      expect(clean.byDifficulty.ROOKIE.played).toBe(4);
      expect(clean.byDifficulty.ROOKIE.won).toBe(3);
      expect(clean.byDifficulty.ROOKIE.currentStreak).toBe(0);
    });

    it('sanitizes match records and truncates excessively long player names', () => {
      expect(sanitizeMatchRecord(null)).toBeNull();
      expect(sanitizeMatchRecord('invalid')).toBeNull();

      const longName = 'A'.repeat(200);
      const record = sanitizeMatchRecord({
        id: '',
        gameMode: 'INVALID_MODE',
        difficulty: 'INVALID_DIFF',
        p1Name: longName,
        winnerPlayer: 99,
        gravity: -10,
      });

      expect(record).not.toBeNull();
      expect(record!.gameMode).toBe('1P_VS_CPU');
      expect(record!.difficulty).toBe('VETERAN');
      expect(record!.p1Name.length).toBe(64);
      expect(record!.winnerPlayer).toBe(1);
      expect(record!.gravity).toBe(9.8);
    });
  });

  describe('IndexedDB operations', () => {
    it('records 1P wins and losses, updates streaks, and retrieves recent matches', async () => {
      const m1 = createSampleMatch({ id: 'm1', date: 1000, difficulty: 'VETERAN', winnerPlayer: 1 });
      const m2 = createSampleMatch({
        id: 'm2',
        date: 2000,
        difficulty: 'VETERAN',
        winnerPlayer: 2,
        winnerName: 'Gorilla AI',
      });
      const m3 = createSampleMatch({
        id: 'm3',
        date: 3000,
        gameMode: '2P_HOTSEAT',
        winnerPlayer: 1,
      });
      const m4 = createSampleMatch({
        id: 'm4',
        date: 4000,
        gameMode: '2P_HOTSEAT',
        winnerPlayer: 2,
      });

      await statsDb.recordMatch(m1);
      let agg = await statsDb.getAggregatedStats();
      expect(agg.totalWins).toBe(1);
      expect(agg.currentStreak).toBe(1);
      expect(agg.bestStreak).toBe(1);
      expect(agg.byDifficulty.VETERAN.won).toBe(1);

      await statsDb.recordMatch(m2);
      agg = await statsDb.getAggregatedStats();
      expect(agg.totalLosses).toBe(1);
      expect(agg.currentStreak).toBe(0);
      expect(agg.bestStreak).toBe(1);

      await statsDb.recordMatch(m3);
      await statsDb.recordMatch(m4);
      agg = await statsDb.getAggregatedStats();
      expect(agg.twoPlayerMatches).toBe(2);

      const history = await statsDb.getRecentMatches(10);
      expect(history.length).toBe(4);
      expect(history[0].id).toBe('m4'); // sorted descending by date
    });

    it('exports and imports JSON backups and blocks oversized or invalid payloads', async () => {
      await statsDb.recordMatch(createSampleMatch({ id: 'backup_1', holeInOnes: 3 }));
      const exportedJson = await statsDb.exportBackup();
      expect(exportedJson).toContain('QBasic Gorillas');

      await statsDb.clearAllStats();
      const afterClear = await statsDb.getAggregatedStats();
      expect(afterClear.totalMatches).toBe(0);

      const restored = await statsDb.importBackup(exportedJson);
      expect(restored.totalMatches).toBe(1);
      expect(restored.holeInOnes).toBe(3);

      await expect(statsDb.importBackup('{}')).rejects.toThrow('Formato de archivo inválido');
      const hugePayload = 'x'.repeat(MAX_BACKUP_BYTES + 10);
      await expect(statsDb.importBackup(hugePayload)).rejects.toThrow('2 MB');
    });
  });

  describe('localStorage fallback when IndexedDB is unavailable', () => {
    it('falls back seamlessly to localStorage when window.indexedDB is undefined', async () => {
      const originalIDB = window.indexedDB;
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        configurable: true,
        writable: true,
      });

      try {
        const fallbackDb = new StatsDatabase();
        const match = createSampleMatch({ id: 'local_1', sunHits: 4 });
        await fallbackDb.recordMatch(match);

        const stats = await fallbackDb.getAggregatedStats();
        expect(stats.totalMatches).toBe(1);
        expect(stats.sunHits).toBe(4);

        const recent = await fallbackDb.getRecentMatches(5);
        expect(recent.length).toBe(1);
        expect(recent[0].id).toBe('local_1');

        const backup = await fallbackDb.exportBackup();
        await fallbackDb.clearAllStats();
        expect((await fallbackDb.getAggregatedStats()).totalMatches).toBe(0);

        await fallbackDb.importBackup(backup);
        expect((await fallbackDb.getAggregatedStats()).sunHits).toBe(4);
      } finally {
        Object.defineProperty(window, 'indexedDB', {
          value: originalIDB,
          configurable: true,
          writable: true,
        });
      }
    });
  });
});
