import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { GorillaCanvas } from './GorillaCanvas';
import { Building, Gorilla, GameSettings, Projectile } from '../types/game';

const buildings: Building[] = [
  {
    id: 0,
    x: 0,
    y: 350,
    width: 300,
    height: 250,
    color: '#00AAAA',
    windowPattern: [
      [true, false],
      [false, true],
    ],
  },
  {
    id: 1,
    x: 300,
    y: 300,
    width: 400,
    height: 300,
    color: '#AA0000',
    windowPattern: [[true, true]],
  },
  {
    id: 2,
    x: 700,
    y: 350,
    width: 324,
    height: 250,
    color: '#AAAAAA',
    windowPattern: [[true, false]],
  },
];

const gorilla1: Gorilla = {
  playerNumber: 1,
  name: 'Player 1',
  x: 150,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 0,
  isHit: false,
  armState: 'idle',
  score: 0,
};

const gorilla2: Gorilla = {
  playerNumber: 2,
  name: 'Gorilla AI',
  x: 850,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 2,
  isHit: false,
  armState: 'idle',
  score: 0,
};

const settings: GameSettings = {
  gravity: 9.8,
  gravityName: 'Earth (9.8 m/s²)',
  targetScore: 3,
  showTrajectoryTrail: true,
  crtEffect: true,
  soundEnabled: true,
  soundVolume: 0.45,
  difficulty: 'VETERAN',
};

describe('GorillaCanvas', () => {
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    rafCallbacks = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const stepFrames = (count: number = 1, stepMs: number = 16) => {
    let time = 1000;
    for (let i = 0; i < count; i++) {
      const currentBatch = [...rafCallbacks];
      rafCallbacks = [];
      time += stepMs;
      currentBatch.forEach((cb) => cb(time));
    }
  };

  it('renders skyline, craters, trajectory preview, wind gauge, and handles pointer drag aiming', () => {
    const onBananaHitBuilding = vi.fn();
    const onBananaHitGorilla = vi.fn();
    const onBananaOutOfBounds = vi.fn();
    const onDragAimChange = vi.fn();

    const { container } = render(
      <GorillaCanvas
        buildings={buildings}
        craters={[{ x: 350, y: 320, radius: 28 }]}
        gorilla1={gorilla1}
        gorilla2={gorilla2}
        currentTurn={1}
        currentAngle={45}
        currentPower={60}
        wind={6}
        settings={settings}
        gameState="PLAYING"
        activeProjectile={null}
        onBananaHitBuilding={onBananaHitBuilding}
        onBananaHitGorilla={onBananaHitGorilla}
        onBananaOutOfBounds={onBananaOutOfBounds}
        onDragAimChange={onDragAimChange}
      />
    );

    stepFrames(2);

    const canvas = container.querySelector('canvas')!;
    expect(canvas).toBeInTheDocument();

    // Pointer drag aiming near Gorilla 1 (150, 333)
    fireEvent.pointerDown(canvas, { clientX: 150, clientY: 333 });
    fireEvent.pointerMove(canvas, { clientX: 220, clientY: 270 });
    stepFrames(1);
    expect(onDragAimChange).toHaveBeenCalled();

    fireEvent.pointerUp(canvas);
    stepFrames(1);
  });

  it('detects projectile collision with building and triggers onBananaHitBuilding', () => {
    const onBananaHitBuilding = vi.fn();
    const onBananaHitGorilla = vi.fn();
    const onBananaOutOfBounds = vi.fn();

    // Place projectile right inside building 1 (x=350, y=350)
    const proj: Projectile = {
      x: 345,
      y: 350,
      vx: 100,
      vy: 0,
      rotation: 0,
      spinSpeed: 10,
      shooter: 1,
      trail: [],
    };

    render(
      <GorillaCanvas
        buildings={buildings}
        craters={[]}
        gorilla1={{ ...gorilla1, armState: 'throw_right' }}
        gorilla2={gorilla2}
        currentTurn={1}
        currentAngle={45}
        currentPower={60}
        wind={-5}
        settings={settings}
        gameState="PLAYING"
        activeProjectile={proj}
        onBananaHitBuilding={onBananaHitBuilding}
        onBananaHitGorilla={onBananaHitGorilla}
        onBananaOutOfBounds={onBananaOutOfBounds}
      />
    );

    stepFrames(3);
    expect(onBananaHitBuilding).toHaveBeenCalled();
  });

  it('detects projectile collision with gorilla and triggers onBananaHitGorilla', () => {
    const onBananaHitBuilding = vi.fn();
    const onBananaHitGorilla = vi.fn();
    const onBananaOutOfBounds = vi.fn();

    // Place projectile right at Gorilla 2 torso (x=850, y=333)
    const proj: Projectile = {
      x: 848,
      y: 333,
      vx: 20,
      vy: 0,
      rotation: 0,
      spinSpeed: 10,
      shooter: 1,
      trail: [],
    };

    render(
      <GorillaCanvas
        buildings={buildings}
        craters={[]}
        gorilla1={gorilla1}
        gorilla2={gorilla2}
        currentTurn={1}
        currentAngle={45}
        currentPower={60}
        wind={0}
        settings={settings}
        gameState="PLAYING"
        activeProjectile={proj}
        onBananaHitBuilding={onBananaHitBuilding}
        onBananaHitGorilla={onBananaHitGorilla}
        onBananaOutOfBounds={onBananaOutOfBounds}
      />
    );

    stepFrames(3);
    expect(onBananaHitGorilla).toHaveBeenCalledWith(2);
  });

  it('detects sun hit, sun gasp, and out-of-bounds projectile', () => {
    const onBananaHitBuilding = vi.fn();
    const onBananaHitGorilla = vi.fn();
    const onBananaOutOfBounds = vi.fn();
    const onSunGasp = vi.fn();
    const onSunHit = vi.fn();

    // Sun is around x = window.innerWidth / 2 (512), y = 55
    const sunX = (window.innerWidth || 1024) / 2;
    const projNearSun: Projectile = {
      x: sunX,
      y: 55,
      vx: 50,
      vy: 0,
      rotation: 0,
      spinSpeed: 10,
      shooter: 1,
      trail: [],
    };

    const { rerender } = render(
      <GorillaCanvas
        buildings={buildings}
        craters={[]}
        gorilla1={gorilla1}
        gorilla2={{ ...gorilla2, isHit: true }}
        currentTurn={1}
        currentAngle={45}
        currentPower={60}
        wind={0}
        settings={settings}
        gameState="ROUND_OVER"
        activeProjectile={projNearSun}
        onBananaHitBuilding={onBananaHitBuilding}
        onBananaHitGorilla={onBananaHitGorilla}
        onBananaOutOfBounds={onBananaOutOfBounds}
        onSunGasp={onSunGasp}
        onSunHit={onSunHit}
      />
    );

    stepFrames(2);
    expect(onSunHit).toHaveBeenCalled();

    // Out of bounds projectile
    const projOOB: Projectile = {
      x: -200,
      y: 200,
      vx: -100,
      vy: 0,
      rotation: 0,
      spinSpeed: -10,
      shooter: 2,
      trail: [],
    };

    rerender(
      <GorillaCanvas
        buildings={buildings}
        craters={[]}
        gorilla1={gorilla1}
        gorilla2={gorilla2}
        currentTurn={2}
        currentAngle={45}
        currentPower={60}
        wind={0}
        settings={settings}
        gameState="PLAYING"
        activeProjectile={projOOB}
        onBananaHitBuilding={onBananaHitBuilding}
        onBananaHitGorilla={onBananaHitGorilla}
        onBananaOutOfBounds={onBananaOutOfBounds}
        onSunGasp={onSunGasp}
        onSunHit={onSunHit}
      />
    );

    stepFrames(2);
    expect(onBananaOutOfBounds).toHaveBeenCalled();
  });
});
