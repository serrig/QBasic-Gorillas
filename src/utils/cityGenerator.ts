import { Building, Gorilla } from '../types/game';

// Authentic EGA color palette used in QBasic GORILLA.BAS
export const EGA_BUILDING_COLORS = [
  '#00AAAA', // EGA Cyan
  '#AA0000', // EGA Red
  '#AAAAAA', // EGA Light Gray
  '#008888', // EGA Dark Cyan
  '#880000', // EGA Dark Red
  '#666666', // EGA Medium Gray
];

export const WINDOW_LIT_COLOR = '#FFFF55'; // EGA Bright Yellow
export const WINDOW_UNLIT_COLOR = '#334155'; // Dark slate/gray

export interface CityData {
  buildings: Building[];
  gorilla1: Gorilla;
  gorilla2: Gorilla;
}

export function generateCity(
  canvasWidth: number,
  canvasHeight: number,
  p1Name: string = 'Gorilla 1',
  p2Name: string = 'Gorilla 2',
  p1Score: number = 0,
  p2Score: number = 0
): CityData {
  // Determine number of buildings (typically 8 to 11)
  const targetBuildingCount = Math.max(8, Math.min(12, Math.floor(canvasWidth / 90)));
  const baseWidth = Math.floor(canvasWidth / targetBuildingCount);
  
  const buildings: Building[] = [];
  let currentX = 0;

  for (let i = 0; i < targetBuildingCount; i++) {
    // Last building extends to fill the canvas cleanly
    const width = i === targetBuildingCount - 1 ? canvasWidth - currentX : baseWidth;
    
    // Height between 32% and 72% of canvas height
    // Slight variation, but middle buildings can have interesting skyline dips
    const heightPercent = 0.32 + Math.random() * 0.40;
    const height = Math.floor(canvasHeight * heightPercent);
    const y = canvasHeight - height;

    const color = EGA_BUILDING_COLORS[Math.floor(Math.random() * EGA_BUILDING_COLORS.length)];

    // Generate window grid pattern
    const windowCols = Math.max(2, Math.floor((width - 12) / 14));
    const windowRows = Math.max(3, Math.floor((height - 20) / 20));
    const windowPattern: boolean[][] = [];

    for (let r = 0; r < windowRows; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < windowCols; c++) {
        // 65% chance window is illuminated
        row.push(Math.random() < 0.65);
      }
      windowPattern.push(row);
    }

    buildings.push({
      id: i,
      x: currentX,
      y,
      width,
      height,
      color,
      windowPattern,
    });

    currentX += width;
  }

  // Pick building indices for gorillas
  // P1 on building 1 or 2 (around 15-25% from left)
  const p1BuildingIndex = Math.min(2, Math.max(1, Math.floor(1 + Math.random() * 2)));
  // P2 on building around 70-80% of skyline, keeping separation balanced and reachable
  const p2BuildingIndex = Math.min(
    targetBuildingCount - 2,
    Math.max(
      p1BuildingIndex + 3,
      Math.floor(targetBuildingCount * 0.72) + (Math.random() < 0.5 ? 0 : 1)
    )
  );

  const b1 = buildings[p1BuildingIndex];
  const b2 = buildings[p2BuildingIndex];

  const gorillaWidth = 32;
  const gorillaHeight = 34;

  const gorilla1: Gorilla = {
    playerNumber: 1,
    name: p1Name,
    x: Math.floor(b1.x + b1.width / 2),
    y: b1.y,
    width: gorillaWidth,
    height: gorillaHeight,
    buildingIndex: p1BuildingIndex,
    isHit: false,
    armState: 'idle',
    score: p1Score,
  };

  const gorilla2: Gorilla = {
    playerNumber: 2,
    name: p2Name,
    x: Math.floor(b2.x + b2.width / 2),
    y: b2.y,
    width: gorillaWidth,
    height: gorillaHeight,
    buildingIndex: p2BuildingIndex,
    isHit: false,
    armState: 'idle',
    score: p2Score,
  };

  return { buildings, gorilla1, gorilla2 };
}
