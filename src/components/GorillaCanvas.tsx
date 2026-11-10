import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Building,
  Crater,
  Gorilla,
  Particle,
  Projectile,
  SunState,
  GameSettings,
  GameState,
} from '../types/game';
import {
  WINDOW_LIT_COLOR,
  WINDOW_UNLIT_COLOR,
} from '../utils/cityGenerator';
import {
  checkBuildingCollision,
  checkGorillaCollision,
  checkSunCollision,
  computeTrajectoryPreview,
  GRAVITY_SCALE,
  WIND_SCALE,
  VELOCITY_SCALE,
} from '../utils/physics';
import { sound } from '../audio/soundEffects';

interface GorillaCanvasProps {
  buildings: Building[];
  craters: Crater[];
  gorilla1: Gorilla;
  gorilla2: Gorilla;
  currentTurn: 1 | 2;
  currentAngle: number;
  currentPower: number;
  wind: number;
  settings: GameSettings;
  gameState: GameState;
  activeProjectile: Projectile | null;
  onBananaMove?: (pos: { x: number; y: number }) => void;
  onBananaHitBuilding: (crater: Crater) => void;
  onBananaHitGorilla: (victim: 1 | 2) => void;
  onBananaOutOfBounds: () => void;
  onDragAimChange?: (angle: number, power: number) => void;
  onSunGasp?: () => void;
  onSunHit?: () => void;
}

export const GorillaCanvas: React.FC<GorillaCanvasProps> = ({
  buildings,
  craters,
  gorilla1,
  gorilla2,
  currentTurn,
  currentAngle,
  currentPower,
  wind,
  settings,
  gameState,
  activeProjectile,
  onBananaHitBuilding,
  onBananaHitGorilla,
  onBananaOutOfBounds,
  onDragAimChange,
  onSunGasp,
  onSunHit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const buildingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 960,
    height: 600,
  });

  // Screen shake
  const shakeRef = useRef<number>(0);
  const hitStopTimerRef = useRef<number>(0);

  // Sun state
  const sunRef = useRef<SunState>({
    x: 480,
    y: 70,
    expression: 'smile',
    surprisedTimer: 0,
    blinkTimer: 180,
    isBlinking: false,
  });

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Victory animation frame counter
  const animFrameRef = useRef<number>(0);

  // Mouse / Touch Aiming Drag state
  const isDraggingAimRef = useRef<boolean>(false);

  // Keep latest props in refs to avoid restarting RAF loop
  const propsRef = useRef({
    buildings,
    craters,
    gorilla1,
    gorilla2,
    currentTurn,
    currentAngle,
    currentPower,
    wind,
    settings,
    gameState,
    activeProjectile,
    onBananaHitBuilding,
    onBananaHitGorilla,
    onBananaOutOfBounds,
    onSunGasp,
    onSunHit,
  });

  useEffect(() => {
    propsRef.current = {
      buildings,
      craters,
      gorilla1,
      gorilla2,
      currentTurn,
      currentAngle,
      currentPower,
      wind,
      settings,
      gameState,
      activeProjectile,
      onBananaHitBuilding,
      onBananaHitGorilla,
      onBananaOutOfBounds,
      onSunGasp,
      onSunHit,
    };
  }, [
    buildings,
    craters,
    gorilla1,
    gorilla2,
    currentTurn,
    currentAngle,
    currentPower,
    wind,
    settings,
    gameState,
    activeProjectile,
    onBananaHitBuilding,
    onBananaHitGorilla,
    onBananaOutOfBounds,
    onSunGasp,
    onSunHit,
  ]);

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
          sunRef.current.x = Math.floor(clientWidth / 2);
          sunRef.current.y = Math.min(80, Math.floor(clientHeight * 0.14));
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Render initial buildings into offscreen canvas
  const redrawBuildingsOffscreen = useCallback(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    let offscreen = buildingCanvasRef.current;
    if (!offscreen) {
      offscreen = document.createElement('canvas');
      buildingCanvasRef.current = offscreen;
    }

    offscreen.width = dimensions.width;
    offscreen.height = dimensions.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw all buildings
    for (const b of buildings) {
      // Main building body
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Building 3D / retro border outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Roof trim
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(b.x, b.y, b.width, 3);

      // Windows
      const winW = 7;
      const winH = 9;
      const spacingX = 14;
      const spacingY = 18;

      const startX = b.x + 8;
      const startY = b.y + 12;

      for (let r = 0; r < b.windowPattern.length; r++) {
        for (let c = 0; c < b.windowPattern[r].length; c++) {
          const wx = startX + c * spacingX;
          const wy = startY + r * spacingY;

          if (wx + winW < b.x + b.width - 4 && wy + winH < b.y + b.height - 8) {
            ctx.fillStyle = b.windowPattern[r][c] ? WINDOW_LIT_COLOR : WINDOW_UNLIT_COLOR;
            ctx.fillRect(wx, wy, winW, winH);

            // Window frame subtle border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(wx, wy, winW, winH);
          }
        }
      }
    }

    // Apply all existing craters using destination-out
    ctx.globalCompositeOperation = 'destination-out';
    for (const crater of craters) {
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }, [buildings, craters, dimensions]);

  // When buildings or craters change, update offscreen canvas
  useEffect(() => {
    redrawBuildingsOffscreen();
  }, [redrawBuildingsOffscreen]);

  // Spawn explosion particles
  const spawnExplosion = useCallback((x: number, y: number, isGorilla: boolean = false) => {
    shakeRef.current = isGorilla ? 18 : 9;
    if (isGorilla) {
      hitStopTimerRef.current = 4; // 4 frames of hitstop
    }

    const count = isGorilla ? 80 : 40;
    const newParticles: Particle[] = [];

    const sparkColors = isGorilla
      ? ['#FF0000', '#FF5500', '#FFFF00', '#FFFFFF', '#FFAA00']
      : ['#FFAA00', '#FFFF55', '#FF4400', '#FFFFFF', '#AAAAAA'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isGorilla ? 4 : 2.5) + Math.random() * (isGorilla ? 9 : 6);
      const isSmoke = Math.random() < 0.35;

      newParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: isSmoke ? '#64748B' : sparkColors[Math.floor(Math.random() * sparkColors.length)],
        size: isSmoke ? 6 + Math.random() * 8 : 2 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: isSmoke ? 35 + Math.random() * 25 : 20 + Math.random() * 20,
        type: isSmoke ? 'smoke' : 'spark',
      });
    }

    particlesRef.current.push(...newParticles);
  }, []);

  // Main Render & Simulation Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animationId = requestAnimationFrame(loop);
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      animFrameRef.current++;

      const {
        gorilla1,
        gorilla2,
        currentTurn,
        currentAngle,
        currentPower,
        wind,
        settings,
        gameState,
        activeProjectile,
        buildings,
        craters,
        onBananaHitBuilding,
        onBananaHitGorilla,
        onBananaOutOfBounds,
      } = propsRef.current;

      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = dimensions;
      if (width === 0 || height === 0) return;

      // Ensure canvas internal resolution matches display
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        redrawBuildingsOffscreen();
      }

      // Handle hitstop
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current--;
        return;
      }

      // Handle Screen Shake
      ctx.save();
      if (shakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * shakeRef.current;
        const shakeY = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(shakeX, shakeY);
        shakeRef.current *= 0.88;
        if (shakeRef.current < 0.5) shakeRef.current = 0;
      }

      // 1. Draw EGA Deep Night Sky Gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#000077'); // EGA Deep Navy
      skyGradient.addColorStop(0.5, '#0000AA'); // Classic QBasic EGA Blue
      skyGradient.addColorStop(1, '#000044'); // Horizon dark blue
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Star field (subtle pixel stars in top half)
      ctx.fillStyle = '#FFFFFF';
      for (let s = 0; s < 40; s++) {
        const sx = ((s * 197 + 43) % width);
        const sy = ((s * 131 + 17) % Math.floor(height * 0.45));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Animated drifting wind streaks in upper sky
      if (wind !== 0) {
        ctx.save();
        ctx.strokeStyle = wind > 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(244, 114, 182, 0.3)';
        ctx.lineWidth = 1.5;
        const windSpeed = wind * 1.5;
        const streakCount = 14;
        for (let w = 0; w < streakCount; w++) {
          const baseY = 35 + ((w * 53 + 19) % Math.floor(height * 0.42));
          const offset = ((animFrameRef.current * windSpeed + w * 140) % (width + 120));
          const drawX = offset < 0 ? width + 120 + offset : offset;
          const streakLen = 15 + Math.min(50, Math.abs(wind) * 3);

          ctx.beginPath();
          ctx.moveTo(drawX - streakLen, baseY);
          ctx.lineTo(drawX + streakLen, baseY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Update and Draw Sun
      const sun = sunRef.current;
      // Handle sun blink
      sun.blinkTimer--;
      if (sun.blinkTimer <= 0) {
        sun.isBlinking = !sun.isBlinking;
        sun.blinkTimer = sun.isBlinking ? 8 : 120 + Math.random() * 120;
      }
      if (sun.surprisedTimer > 0) {
        sun.surprisedTimer--;
        if (sun.surprisedTimer === 0) {
          sun.expression = 'smile';
        }
      }

      // Draw Sun rays
      ctx.save();
      ctx.translate(sun.x, sun.y);
      ctx.strokeStyle = '#FFFF55';
      ctx.lineWidth = 2.5;
      const rayCount = 12;
      const rayAngleOffset = (animFrameRef.current * 0.008) % (Math.PI * 2);
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * (Math.PI * 2)) / rayCount + rayAngleOffset;
        const r1 = 34;
        const r2 = 44 + (i % 2 === 0 ? 5 : 0);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
        ctx.stroke();
      }

      // Sun body
      ctx.fillStyle = '#FFFF55'; // EGA Yellow
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sun face
      if (sun.expression === 'shocked') {
        // Shocked dizzy eyes (X X)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        // Left eye X
        ctx.beginPath();
        ctx.moveTo(-14, -8); ctx.lineTo(-6, 0);
        ctx.moveTo(-6, -8); ctx.lineTo(-14, 0);
        // Right eye X
        ctx.moveTo(6, -8); ctx.lineTo(14, 0);
        ctx.moveTo(14, -8); ctx.lineTo(6, 0);
        ctx.stroke();

        // Wavy mouth
        ctx.beginPath();
        ctx.moveTo(-10, 14);
        ctx.lineTo(-5, 10);
        ctx.lineTo(0, 14);
        ctx.lineTo(5, 10);
        ctx.lineTo(10, 14);
        ctx.stroke();
      } else if (sun.expression === 'surprised') {
        // Wide round eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-9, -4, 4, 0, Math.PI * 2);
        ctx.arc(9, -4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Open "O" mouth
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 12, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal smiling sun
        ctx.fillStyle = '#000000';
        if (sun.isBlinking) {
          // Closed eyelid line
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-13, -3); ctx.lineTo(-5, -3);
          ctx.moveTo(5, -3); ctx.lineTo(13, -3);
          ctx.stroke();
        } else {
          // Dot eyes
          ctx.beginPath();
          ctx.arc(-9, -4, 3, 0, Math.PI * 2);
          ctx.arc(9, -4, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Curved smile
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 4, 14, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw Buildings (from offscreen pre-baked canvas with craters)
      if (buildingCanvasRef.current) {
        ctx.drawImage(buildingCanvasRef.current, 0, 0);
      }

      // 4. Trajectory Preview in Sandbox mode or if enabled in settings
      if (
        (settings.showTrajectoryTrail || gameState === 'PLAYING') &&
        gameState === 'PLAYING' &&
        !activeProjectile
      ) {
        const shooter = currentTurn === 1 ? gorilla1 : gorilla2;
        const rad = (currentAngle * Math.PI) / 180;
        const speed = (currentPower / 100) * 160 * VELOCITY_SCALE;
        const hDir = currentTurn === 1 ? 1 : -1;
        const vx0 = Math.cos(rad) * speed * hDir;
        const vy0 = -Math.sin(rad) * speed;

        const startX = shooter.x + (currentTurn === 1 ? 14 : -14);
        const startY = shooter.y - 28;

        if (settings.showTrajectoryTrail) {
          const previewPoints = computeTrajectoryPreview(
            startX,
            startY,
            vx0,
            vy0,
            settings.gravity,
            wind,
            width,
            height,
            buildings,
            craters
          );

          if (previewPoints.length > 1) {
            ctx.save();
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(255, 255, 85, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(previewPoints[0].x, previewPoints[0].y);
            for (let i = 1; i < previewPoints.length; i++) {
              ctx.lineTo(previewPoints[i].x, previewPoints[i].y);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        // Angle indicator arrow over shooter
        ctx.save();
        ctx.translate(startX, startY);
        ctx.strokeStyle = currentTurn === 1 ? '#38BDF8' : '#F472B6';
        ctx.lineWidth = 3;
        const arrowLen = Math.min(60, 20 + currentPower * 0.4);
        const arrowRad = (currentAngle * Math.PI) / 180;
        const ax = Math.cos(arrowRad) * arrowLen * hDir;
        const ay = -Math.sin(arrowRad) * arrowLen;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        // Arrow head
        const headAngle = Math.atan2(ay, ax);
        const headLen = 8;
        ctx.fillStyle = currentTurn === 1 ? '#38BDF8' : '#F472B6';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - headLen * Math.cos(headAngle - Math.PI / 6),
          ay - headLen * Math.sin(headAngle - Math.PI / 6)
        );
        ctx.lineTo(
          ax - headLen * Math.cos(headAngle + Math.PI / 6),
          ay - headLen * Math.sin(headAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Gorillas
      const drawGorilla = (gorilla: Gorilla, isCurrentTurn: boolean) => {
        ctx.save();
        ctx.translate(gorilla.x, gorilla.y);

        // If gorilla is destroyed, draw remnant crater / smoke
        if (gorilla.isHit) {
          ctx.restore();
          return;
        }

        const isP1 = gorilla.playerNumber === 1;
        const facingDirection = isP1 ? 1 : -1;

        // Victory dance arm alternation
        let armPose = gorilla.armState;
        if (gameState === 'ROUND_OVER' || gameState === 'MATCH_VICTORY') {
          if (!gorilla.isHit) {
            // Victory dance!
            const dancePhase = Math.floor(animFrameRef.current / 12) % 2;
            armPose = dancePhase === 0 ? 'victory_left' : 'victory_right';
          }
        } else if (activeProjectile && activeProjectile.shooter === gorilla.playerNumber) {
          armPose = isP1 ? 'throw_right' : 'throw_left';
        }

        // Breathing bounce
        const breathY = Math.sin(animFrameRef.current * 0.08) * 1.2;

        // Gorilla body color (classic dark brown/charcoal)
        const furColor = isP1 ? '#8B4513' : '#475569';
        const chestColor = isP1 ? '#D2B48C' : '#94A3B8';
        const faceColor = '#E2B184';

        // Turn indicator ring under feet if current turn
        if (isCurrentTurn && gameState === 'PLAYING') {
          ctx.strokeStyle = isP1 ? '#38BDF8' : '#F472B6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Legs / Feet
        ctx.fillStyle = furColor;
        ctx.fillRect(-10, -6, 7, 6);
        ctx.fillRect(3, -6, 7, 6);

        // Body / Torso
        ctx.fillRect(-12, -22 + breathY, 24, 18);

        // Chest plate
        ctx.fillStyle = chestColor;
        ctx.fillRect(-7, -20 + breathY, 14, 12);

        // Head
        ctx.fillStyle = furColor;
        ctx.fillRect(-9, -32 + breathY, 18, 12);

        // Face
        ctx.fillStyle = faceColor;
        ctx.fillRect(-6, -29 + breathY, 12, 8);

        // Eyes (looking towards opponent)
        ctx.fillStyle = '#000000';
        const eyeOffset = facingDirection * 1.5;
        ctx.fillRect(-4 + eyeOffset, -28 + breathY, 2, 2);
        ctx.fillRect(2 + eyeOffset, -28 + breathY, 2, 2);

        // Nostrils / Mouth
        ctx.fillRect(-2 + eyeOffset, -24 + breathY, 4, 1.5);

        // Ears
        ctx.fillStyle = faceColor;
        ctx.fillRect(-11, -30 + breathY, 2.5, 4);
        ctx.fillRect(8.5, -30 + breathY, 2.5, 4);

        // Headband or accessory to distinguish players
        ctx.fillStyle = isP1 ? '#00AAAA' : '#AA0000'; // EGA Cyan for P1, EGA Red for P2
        ctx.fillRect(-9, -33 + breathY, 18, 3);

        // Arms based on pose
        ctx.fillStyle = furColor;
        if (armPose === 'throw_right' || armPose === 'victory_right') {
          // Left arm down, right arm raised high!
          ctx.fillRect(-16, -21 + breathY, 5, 14); // Left arm
          // Raised right arm
          ctx.fillRect(11, -34 + breathY, 5, 16);
          ctx.fillRect(12, -37 + breathY, 6, 6); // Hand
        } else if (armPose === 'throw_left' || armPose === 'victory_left') {
          // Right arm down, left arm raised high!
          ctx.fillRect(11, -21 + breathY, 5, 14); // Right arm
          // Raised left arm
          ctx.fillRect(-16, -34 + breathY, 5, 16);
          ctx.fillRect(-18, -37 + breathY, 6, 6); // Hand
        } else {
          // Idle pose: both arms down at sides
          ctx.fillRect(-16, -21 + breathY, 5, 14);
          ctx.fillRect(11, -21 + breathY, 5, 14);
        }

        // Player Name Tag floating quietly above
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gorilla.name, 0, -42 + breathY);

        ctx.restore();
      };

      drawGorilla(gorilla1, currentTurn === 1);
      drawGorilla(gorilla2, currentTurn === 2);

      // 6. Projectile Physics & Rendering (Active Flying Banana)
      if (activeProjectile) {
        const p = activeProjectile;

        // Apply physics
        p.vx += wind * WIND_SCALE * dt;
        p.vy += settings.gravity * GRAVITY_SCALE * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spinSpeed * dt;

        // Record flight trail
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 25) {
          p.trail.shift();
        }

        // Draw Banana Trail
        ctx.save();
        for (let i = 0; i < p.trail.length; i++) {
          const pt = p.trail[i];
          const trailAlpha = (i / p.trail.length) * 0.6;
          ctx.fillStyle = `rgba(255, 255, 85, ${trailAlpha})`;
          ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
        }
        ctx.restore();

        // Draw Spinning Banana
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // Banana curved body
        ctx.fillStyle = '#FFFF00'; // EGA Bright Yellow
        ctx.beginPath();
        ctx.arc(0, 0, 7, -0.3, Math.PI * 0.9);
        ctx.quadraticCurveTo(0, 2, -6, 0);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#AA5500'; // Darker peel seam
        ctx.stroke();

        // Brown tip
        ctx.fillStyle = '#654321';
        ctx.fillRect(4, -3, 2, 2);
        ctx.restore();

        // Check Sun interaction
        const sunCheck = checkSunCollision(p.x, p.y, 6, sun);
        if (sunCheck.isNear && sun.expression !== 'shocked') {
          if (sun.expression !== 'surprised') {
            sun.expression = 'surprised';
            sun.surprisedTimer = 45;
            sound.playSunGasp();
            propsRef.current.onSunGasp?.();
          }
        }
        if (sunCheck.isHit && sun.expression !== 'shocked') {
          sun.expression = 'shocked';
          sun.surprisedTimer = 120;
          sound.playSunHit();
          spawnExplosion(p.x, p.y, false);
          propsRef.current.onSunHit?.();
        }

        // Check Gorilla collision (P1 or P2)
        const hitG1 = checkGorillaCollision(p.x, p.y, 6, gorilla1);
        const hitG2 = checkGorillaCollision(p.x, p.y, 6, gorilla2);

        if (hitG1 || hitG2) {
          const victim = hitG1 ? 1 : 2;
          spawnExplosion(p.x, p.y, true);
          sound.playExplosion(true);
          onBananaHitGorilla(victim);
          ctx.restore();
          return;
        }

        // Check Building collision
        const hitBuilding = checkBuildingCollision(p.x, p.y, buildings, craters);
        if (hitBuilding) {
          spawnExplosion(p.x, p.y, false);
          sound.playExplosion(false);
          const craterRadius = 24 + Math.floor(Math.random() * 6);
          onBananaHitBuilding({ x: p.x, y: p.y, radius: craterRadius });
          ctx.restore();
          return;
        }

        // Check Out of bounds
        if (p.y > height + 20 || p.x < -80 || p.x > width + 80) {
          onBananaOutOfBounds();
          ctx.restore();
          return;
        }
      }

      // 7. Update and Draw Particles (Explosions & Smoke)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life++;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (pt.type === 'spark') {
          pt.vy += 0.12; // Slight gravity on sparks
          pt.vx *= 0.96;
        } else {
          // Smoke rises and expands
          pt.vy -= 0.04;
          pt.size += 0.15;
          pt.vx *= 0.94;
        }

        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.life >= pt.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. Draw Iconic QBasic Wind Indicator in Sky (below the smiling sun)
      ctx.save();
      const windY = sun.y + 46;
      const windCenterX = sun.x;
      const boxW = 230;
      const boxH = 26;

      ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
      ctx.fillRect(windCenterX - boxW / 2, windY - boxH / 2, boxW, boxH);
      ctx.strokeStyle = '#00AAAA';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(windCenterX - boxW / 2, windY - boxH / 2, boxW, boxH);

      const absWind = Math.abs(wind);

      // Draw center baseline mark
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(windCenterX, windY - 9);
      ctx.lineTo(windCenterX, windY + 9);
      ctx.stroke();

      // Draw directional vector arrow from center
      if (wind !== 0) {
        const arrowMaxLen = 85;
        const arrowLen = (wind / 15) * arrowMaxLen;
        const arrowColor = wind > 0 ? '#38BDF8' : '#F472B6';

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(windCenterX, windY);
        ctx.lineTo(windCenterX + arrowLen, windY);
        ctx.stroke();

        // Arrow head
        const headDir = wind > 0 ? 1 : -1;
        const tipX = windCenterX + arrowLen;
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(tipX, windY);
        ctx.lineTo(tipX - headDir * 7, windY - 4);
        ctx.lineTo(tipX - headDir * 7, windY + 4);
        ctx.closePath();
        ctx.fill();
      }

      // Wind text readout with tabular pixel font
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let windText = 'WIND: CALM (0)';
      if (wind > 0) {
        windText = `WIND: ${absWind} MPH ►`;
        ctx.fillStyle = '#38BDF8';
      } else if (wind < 0) {
        windText = `◄ WIND: ${absWind} MPH`;
        ctx.fillStyle = '#F472B6';
      } else {
        ctx.fillStyle = '#FDE047';
      }

      ctx.fillText(windText, windCenterX, windY - 1);
      ctx.restore();

      ctx.restore(); // Restore shake
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [dimensions, redrawBuildingsOffscreen, spawnExplosion]);

  // Touch and Mouse interactive dragging to aim
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || activeProjectile || !onDragAimChange) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const shooter = currentTurn === 1 ? gorilla1 : gorilla2;
    // Check if clicked near current gorilla
    const dist = Math.hypot(clickX - shooter.x, clickY - (shooter.y - 20));
    if (dist < 70) {
      isDraggingAimRef.current = true;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingAimRef.current || !onDragAimChange) return;

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const shooter = currentTurn === 1 ? gorilla1 : gorilla2;
    const startX = shooter.x;
    const startY = shooter.y - 20;

    const dx = currentX - startX;
    const dy = startY - currentY; // Up is positive

    if (currentTurn === 1) {
      // Facing right: positive dx is forward
      if (dx > 2) {
        const rad = Math.atan2(dy, dx);
        const angle = Math.round((rad * 180) / Math.PI);
        const dist = Math.hypot(dx, dy);
        const power = Math.max(10, Math.min(100, Math.round((dist / 140) * 100)));
        // Support upward positive angles and downward negative angles (-85° to +85°)
        onDragAimChange(Math.max(-85, Math.min(85, angle)), power);
      }
    } else {
      // Facing left: negative dx is forward
      if (dx < -2) {
        const rad = Math.atan2(dy, -dx);
        const angle = Math.round((rad * 180) / Math.PI);
        const dist = Math.hypot(dx, dy);
        const power = Math.max(10, Math.min(100, Math.round((dist / 140) * 100)));
        // Support upward positive angles and downward negative angles (-85° to +85°)
        onDragAimChange(Math.max(-85, Math.min(85, angle)), power);
      }
    }
  };

  const handlePointerUp = () => {
    isDraggingAimRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 ${
        settings.crtEffect ? 'crt-overlay crt-vignette' : ''
      }`}
    >
      <canvas
        ref={mainCanvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-crosshair touch-none select-none"
      />
    </div>
  );
};
