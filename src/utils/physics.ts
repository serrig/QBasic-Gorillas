import { Crater, Gorilla, Building, SunState } from '../types/game';

// Physics constants
export const VELOCITY_SCALE = 5.6; // converts 1-100 power to pixels/sec (calibrated for wide screens)
export const GRAVITY_SCALE = 38.0; // scale standard 9.8 m/s^2 into screen pixel acceleration
export const WIND_SCALE = 14.5; // tuned so wind creates challenge without forming impassable walls

export interface TrajectoryPoint {
  x: number;
  y: number;
}

/**
 * Converts angle (-90 to +90) and power (1-100) into initial velocity vector.
 * Player 1 throws to the right (+X), Player 2 throws to the left (-X).
 * Positive angle: launches upward into the sky.
 * Negative angle: launches downward toward lower buildings/streets.
 */
export function calculateLaunchVelocity(
  playerNumber: 1 | 2,
  angleDegrees: number,
  power: number
): { vx: number; vy: number } {
  // Support negative angles down to -90 (downward) and positive angles up to +90 (upward)
  const clampedAngle = Math.max(-90, Math.min(90, angleDegrees));
  const rad = (clampedAngle * Math.PI) / 180;
  const speed = (power / 100) * 160 * VELOCITY_SCALE;

  const horizontalDirection = playerNumber === 1 ? 1 : -1;
  const vx = Math.cos(rad) * speed * horizontalDirection;
  const vy = -Math.sin(rad) * speed; // Negative is UP in screen coords, Positive is DOWN

  return { vx, vy };
}

/**
 * Checks if projectile at (x, y) with radius strikes the sun
 */
export function checkSunCollision(
  x: number,
  y: number,
  radius: number,
  sun: SunState
): { isHit: boolean; isNear: boolean } {
  const dx = x - sun.x;
  const dy = y - sun.y;
  const dist = Math.hypot(dx, dy);

  const isHit = dist <= 32 + radius;
  const isNear = dist <= 95 + radius;

  return { isHit, isNear };
}

/**
 * Checks if projectile at (x, y) strikes a gorilla.
 * Hitbox is slightly generous for fun gameplay.
 */
export function checkGorillaCollision(
  x: number,
  y: number,
  radius: number,
  gorilla: Gorilla
): boolean {
  // Gorilla center is at (gorilla.x, gorilla.y - gorilla.height / 2)
  const gx = gorilla.x;
  const gy = gorilla.y - gorilla.height / 2;
  const dist = Math.hypot(x - gx, y - gy);

  return dist <= gorilla.width / 2 + radius;
}

/**
 * Checks if point (x, y) is inside any existing explosion crater
 */
export function isPointInsideCrater(x: number, y: number, craters: Crater[]): boolean {
  for (const crater of craters) {
    const distSq = (x - crater.x) ** 2 + (y - crater.y) ** 2;
    if (distSq < (crater.radius - 2) ** 2) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if projectile collides with any building, taking into account craters
 */
export function checkBuildingCollision(
  x: number,
  y: number,
  buildings: Building[],
  craters: Crater[]
): boolean {
  // If already inside a carved crater, it passes through!
  if (isPointInsideCrater(x, y, craters)) {
    return false;
  }

  for (const b of buildings) {
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      return true;
    }
  }
  return false;
}

/**
 * Predicts trajectory points for the sandbox / guide mode
 */
export function computeTrajectoryPreview(
  startX: number,
  startY: number,
  vx0: number,
  vy0: number,
  gravity: number,
  wind: number,
  canvasWidth: number,
  canvasHeight: number,
  buildings: Building[],
  craters: Crater[]
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  let x = startX;
  let y = startY;
  let vx = vx0;
  let vy = vy0;
  const dt = 0.016; // 60fps step
  const maxSteps = 160;

  for (let i = 0; i < maxSteps; i++) {
    points.push({ x, y });

    // Apply physics
    vx += wind * WIND_SCALE * dt;
    vy += gravity * GRAVITY_SCALE * dt;
    x += vx * dt;
    y += vy * dt;

    if (y > canvasHeight || x < -20 || x > canvasWidth + 20) {
      break;
    }

    if (checkBuildingCollision(x, y, buildings, craters)) {
      points.push({ x, y });
      break;
    }
  }

  return points;
}

/**
 * AI logic: Solves for angle & velocity to target opponent
 */
export function calculateAIMove(
  shooter: Gorilla,
  target: Gorilla,
  wind: number,
  gravity: number,
  difficulty: 'ROOKIE' | 'VETERAN' | 'MASTER',
  lastShotError?: { undershot: boolean; deltaDist: number }
): { angle: number; power: number } {
  const dx = Math.abs(target.x - shooter.x);
  const dy = target.y - shooter.y; // height difference

  // Ideal base angle between 48° and 68°
  let baseAngle = 55 + Math.floor((Math.random() - 0.5) * 10);

  // If there's strong tailwind or headwind, adjust angle
  // Wind > 0 blows to the right (tailwind for P1, headwind for P2)
  // Since CPU is Player 2 (throwing left):
  // Positive wind pushes right (against CPU throw)
  // Negative wind pushes left (helps CPU throw)
  const cpuWindEffect = -wind; // positive if pushing CPU's banana toward P1

  if (cpuWindEffect > 6) {
    baseAngle -= 8; // lower flatter arc to cut through
  } else if (cpuWindEffect < -6) {
    baseAngle += 6; // higher arc
  }

  const rad = (baseAngle * Math.PI) / 180;
  const effectiveG = gravity * GRAVITY_SCALE;

  // Ballistic velocity formula: v = sqrt( (g * x^2) / (2 * cos^2(theta) * (x * tan(theta) - y)) )
  const denom = 2 * Math.pow(Math.cos(rad), 2) * (dx * Math.tan(rad) - dy);
  let idealSpeed = 0;

  if (denom > 0) {
    idealSpeed = Math.sqrt((effectiveG * dx * dx) / denom);
  } else {
    idealSpeed = 450;
  }

  // Adjust for wind: wind acceleration adds ~ (cpuWindEffect * WIND_SCALE * time)
  const estFlightTime = (2 * idealSpeed * Math.sin(rad)) / effectiveG;
  const windOffset = cpuWindEffect * WIND_SCALE * 0.5 * estFlightTime;
  idealSpeed = Math.max(100, idealSpeed - windOffset * 0.4);

  // Convert speed back to 1-100 power scale
  let calculatedPower = Math.round((idealSpeed / (160 * VELOCITY_SCALE)) * 100);

  // Apply last shot correction if available
  if (lastShotError) {
    if (lastShotError.undershot) {
      calculatedPower += Math.min(12, Math.max(3, Math.round(lastShotError.deltaDist / 40)));
    } else {
      calculatedPower -= Math.min(12, Math.max(3, Math.round(lastShotError.deltaDist / 40)));
    }
  }

  // Apply error based on difficulty
  let angleError = 0;
  let powerError = 0;

  if (difficulty === 'ROOKIE') {
    angleError = (Math.random() - 0.5) * 22; // ±11°
    powerError = (Math.random() - 0.5) * 26; // ±13 power
  } else if (difficulty === 'VETERAN') {
    angleError = (Math.random() - 0.5) * 8; // ±4°
    powerError = (Math.random() - 0.5) * 10; // ±5 power
  } else {
    // MASTER
    angleError = (Math.random() - 0.5) * 2.5; // ±1.25°
    powerError = (Math.random() - 0.5) * 3; // ±1.5 power
  }

  const finalAngle = Math.max(15, Math.min(85, Math.round(baseAngle + angleError)));
  const finalPower = Math.max(15, Math.min(120, Math.round(calculatedPower + powerError)));

  return { angle: finalAngle, power: finalPower };
}

/**
 * Calculates dynamic wind for the next turn, with algorithmic safeguards:
 * 1. Frequently changes sides (guaranteed reversal after 2-3 turns on the same side).
 * 2. Capped based on gorilla separation distance so full-power shots can always reach.
 * 3. Prevents high-intensity wind (>8) from persisting across multiple turns.
 */
export function calculateNextWind(
  currentWind: number,
  consecutiveSameSideTurns: number,
  gorillaDistance: number
): { nextWind: number; newConsecutiveTurns: number } {
  // Safe max wind magnitude scaled inversely to gorilla distance
  // On wide screens (distance > 800px), caps wind so headwind cannot form an impassable barrier
  const safeMaxWind = Math.max(
    5,
    Math.min(12, Math.round(12 * (720 / Math.max(500, gorillaDistance))))
  );

  const currentSign = Math.sign(currentWind); // 1, -1, or 0
  let flipSide = false;

  if (consecutiveSameSideTurns >= 3) {
    // Hard guarantee: cannot stay on the same side for more than 3 turns
    flipSide = true;
  } else if (consecutiveSameSideTurns >= 2) {
    // Very high probability to switch sides
    flipSide = Math.random() < 0.85;
  } else if (Math.abs(currentWind) >= 8) {
    // Strong gusts shouldn't repeat on the same side
    flipSide = Math.random() < 0.75;
  } else {
    // Normal turns have a 55% chance to cross zero
    flipSide = Math.random() < 0.55;
  }

  let nextWind = 0;

  if (currentSign === 0) {
    // Calm air -> pick either side randomly
    const newSign = Math.random() < 0.5 ? 1 : -1;
    const mag = 2 + Math.floor(Math.random() * (safeMaxWind - 1));
    nextWind = newSign * mag;
  } else if (flipSide) {
    // Switch to opposite side
    const newSign = -currentSign;
    // 15% chance to settle into calm (0) for 1 turn
    if (Math.random() < 0.15) {
      nextWind = 0;
    } else {
      const mag = 1 + Math.floor(Math.random() * safeMaxWind);
      nextWind = newSign * mag;
    }
  } else {
    // Stay on same side, but moderate the magnitude so it doesn't get stuck at extremes
    let mag = Math.abs(currentWind) + Math.floor((Math.random() - 0.5) * 6);
    mag = Math.max(1, Math.min(safeMaxWind, mag));
    nextWind = currentSign * mag;
  }

  const newSign = Math.sign(nextWind);
  let newConsecutiveTurns = 1;
  if (newSign === 0) {
    newConsecutiveTurns = 0;
  } else if (newSign === currentSign) {
    newConsecutiveTurns = consecutiveSameSideTurns + 1;
  } else {
    newConsecutiveTurns = 1;
  }

  return { nextWind, newConsecutiveTurns };
}
