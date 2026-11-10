import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateLaunchVelocity,
  checkSunCollision,
  checkGorillaCollision,
  isPointInsideCrater,
  checkBuildingCollision,
  computeTrajectoryPreview,
  calculateAIMove,
  calculateNextWind,
} from './physics';
import { Building, Crater, Gorilla, SunState } from '../types/game';

describe('physics utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateLaunchVelocity', () => {
    it('calculates positive velocity for Player 1 at 45 degrees', () => {
      const { vx, vy } = calculateLaunchVelocity(1, 45, 50);
      expect(vx).toBeGreaterThan(0);
      expect(vy).toBeLessThan(0); // upward in canvas coordinates
      expect(Math.abs(vx)).toBeCloseTo(Math.abs(vy), 2);
    });

    it('calculates leftward velocity for Player 2', () => {
      const { vx, vy } = calculateLaunchVelocity(2, 45, 50);
      expect(vx).toBeLessThan(0);
      expect(vy).toBeLessThan(0);
    });

    it('supports negative angles (downward shots)', () => {
      const { vx, vy } = calculateLaunchVelocity(1, -30, 60);
      expect(vx).toBeGreaterThan(0);
      expect(vy).toBeGreaterThan(0); // downward in canvas coordinates
    });

    it('clamps angles outside [-90, 90]', () => {
      const over90 = calculateLaunchVelocity(1, 135, 50);
      const at90 = calculateLaunchVelocity(1, 90, 50);
      expect(over90.vx).toBeCloseTo(at90.vx, 4);
      expect(over90.vy).toBeCloseTo(at90.vy, 4);

      const underNeg90 = calculateLaunchVelocity(2, -120, 50);
      const atNeg90 = calculateLaunchVelocity(2, -90, 50);
      expect(underNeg90.vx).toBeCloseTo(atNeg90.vx, 4);
      expect(underNeg90.vy).toBeCloseTo(atNeg90.vy, 4);
    });
  });

  describe('checkSunCollision', () => {
    const sun: SunState = {
      x: 500,
      y: 55,
      expression: 'smile',
      surprisedTimer: 0,
      blinkTimer: 100,
      isBlinking: false,
    };

    it('detects direct hit on the sun', () => {
      const res = checkSunCollision(510, 55, 6, sun);
      expect(res.isHit).toBe(true);
      expect(res.isNear).toBe(true);
    });

    it('detects near miss (gasp) without direct hit', () => {
      const res = checkSunCollision(565, 55, 6, sun);
      expect(res.isHit).toBe(false);
      expect(res.isNear).toBe(true);
    });

    it('returns false for both when projectile is far away', () => {
      const res = checkSunCollision(200, 300, 6, sun);
      expect(res.isHit).toBe(false);
      expect(res.isNear).toBe(false);
    });
  });

  describe('checkGorillaCollision', () => {
    const gorilla: Gorilla = {
      playerNumber: 1,
      name: 'P1',
      x: 200,
      y: 300,
      width: 32,
      height: 34,
      buildingIndex: 1,
      isHit: false,
      armState: 'idle',
      score: 0,
    };

    it('detects collision near gorilla torso', () => {
      expect(checkGorillaCollision(200, 283, 6, gorilla)).toBe(true);
    });

    it('returns false when far from gorilla', () => {
      expect(checkGorillaCollision(100, 100, 6, gorilla)).toBe(false);
    });
  });

  describe('craters and building collisions', () => {
    const buildings: Building[] = [
      {
        id: 0,
        x: 100,
        y: 200,
        width: 80,
        height: 300,
        color: '#00AAAA',
        windowPattern: [[true]],
      },
    ];
    const craters: Crater[] = [{ x: 140, y: 250, radius: 28 }];

    it('detects point inside crater', () => {
      expect(isPointInsideCrater(140, 250, craters)).toBe(true);
      expect(isPointInsideCrater(300, 250, craters)).toBe(false);
    });

    it('allows projectile to pass through carved crater inside a building', () => {
      expect(checkBuildingCollision(140, 250, buildings, craters)).toBe(false);
    });

    it('detects collision with intact part of building', () => {
      expect(checkBuildingCollision(120, 350, buildings, craters)).toBe(true);
    });

    it('returns false when outside all buildings', () => {
      expect(checkBuildingCollision(50, 100, buildings, craters)).toBe(false);
    });
  });

  describe('computeTrajectoryPreview', () => {
    const buildings: Building[] = [
      {
        id: 0,
        x: 300,
        y: 100,
        width: 100,
        height: 400,
        color: '#AA0000',
        windowPattern: [[true]],
      },
    ];

    it('stops when hitting a building', () => {
      const points = computeTrajectoryPreview(100, 200, 300, -50, 9.8, 0, 800, 600, buildings, []);
      expect(points.length).toBeGreaterThan(1);
      const last = points[points.length - 1];
      expect(last.x).toBeGreaterThanOrEqual(300);
    });

    it('stops when going out of bounds', () => {
      const points = computeTrajectoryPreview(10, 100, -500, 0, 9.8, 0, 800, 600, [], []);
      expect(points.length).toBeGreaterThan(1);
      expect(points.length).toBeLessThan(160);
    });
  });

  describe('calculateAIMove', () => {
    const shooter: Gorilla = {
      playerNumber: 2,
      name: 'CPU',
      x: 750,
      y: 320,
      width: 32,
      height: 34,
      buildingIndex: 7,
      isHit: false,
      armState: 'idle',
      score: 0,
    };
    const target: Gorilla = {
      playerNumber: 1,
      name: 'P1',
      x: 180,
      y: 350,
      width: 32,
      height: 34,
      buildingIndex: 1,
      isHit: false,
      armState: 'idle',
      score: 0,
    };

    it('computes valid angle and power across ROOKIE, VETERAN, and MASTER difficulties', () => {
      for (const diff of ['ROOKIE', 'VETERAN', 'MASTER'] as const) {
        const move = calculateAIMove(shooter, target, 0, 9.8, diff);
        expect(move.angle).toBeGreaterThanOrEqual(15);
        expect(move.angle).toBeLessThanOrEqual(85);
        expect(move.power).toBeGreaterThanOrEqual(15);
        expect(move.power).toBeLessThanOrEqual(120);
      }
    });

    it('adjusts for strong positive and negative wind and previous shot error', () => {
      const moveTailwind = calculateAIMove(shooter, target, -9, 9.8, 'MASTER', {
        undershot: true,
        deltaDist: 120,
      });
      const moveHeadwind = calculateAIMove(shooter, target, 9, 9.8, 'MASTER', {
        undershot: false,
        deltaDist: 120,
      });
      expect(moveTailwind.angle).toBeGreaterThanOrEqual(15);
      expect(moveHeadwind.angle).toBeGreaterThanOrEqual(15);
    });

    it('handles extreme target height difference gracefully (denom <= 0 fallback)', () => {
      const veryHighTarget: Gorilla = { ...target, x: 740, y: 10 };
      const move = calculateAIMove(shooter, veryHighTarget, 0, 9.8, 'VETERAN');
      expect(move.power).toBeGreaterThanOrEqual(15);
    });
  });

  describe('calculateNextWind', () => {
    it('forces wind to flip side when consecutiveSameSideTurns >= 3', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const { nextWind, newConsecutiveTurns } = calculateNextWind(8, 3, 600);
      expect(nextWind).toBeLessThanOrEqual(0);
      expect(newConsecutiveTurns).toBe(1);
    });

    it('picks a non-zero wind when currentWind is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.2);
      const { nextWind, newConsecutiveTurns } = calculateNextWind(0, 0, 600);
      expect(nextWind).not.toBe(0);
      expect(newConsecutiveTurns).toBe(1);
    });

    it('can settle into calm (0) when flipping with low random roll', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.05);
      const { nextWind, newConsecutiveTurns } = calculateNextWind(6, 3, 600);
      expect(nextWind).toBe(0);
      expect(newConsecutiveTurns).toBe(0);
    });

    it('increments consecutive turns when staying on the same side', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95);
      const { nextWind, newConsecutiveTurns } = calculateNextWind(4, 1, 600);
      expect(nextWind).toBeGreaterThan(0);
      expect(newConsecutiveTurns).toBe(2);
    });

    it('caps max wind on very wide screens so headwind is never impassable', () => {
      for (let i = 0; i < 20; i++) {
        const { nextWind } = calculateNextWind(5, 1, 1400);
        expect(Math.abs(nextWind)).toBeLessThanOrEqual(6);
      }
    });
  });
});
