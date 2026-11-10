import { describe, it, expect } from 'vitest';
import { generateCity, EGA_BUILDING_COLORS } from './cityGenerator';

describe('cityGenerator', () => {
  it('generates a complete skyline filling canvasWidth and places both gorillas', () => {
    const city = generateCity(1024, 600, 'Kong', 'Godzilla', 2, 1);

    expect(city.buildings.length).toBeGreaterThanOrEqual(8);
    expect(city.buildings.length).toBeLessThanOrEqual(12);

    const totalWidth = city.buildings.reduce((sum, b) => sum + b.width, 0);
    expect(totalWidth).toBe(1024);

    city.buildings.forEach((b) => {
      expect(EGA_BUILDING_COLORS).toContain(b.color);
      expect(b.windowPattern.length).toBeGreaterThanOrEqual(3);
      expect(b.windowPattern[0].length).toBeGreaterThanOrEqual(2);
    });

    expect(city.gorilla1.name).toBe('Kong');
    expect(city.gorilla1.score).toBe(2);
    expect(city.gorilla2.name).toBe('Godzilla');
    expect(city.gorilla2.score).toBe(1);
    expect(city.gorilla2.buildingIndex).toBeGreaterThan(city.gorilla1.buildingIndex);
  });

  it('uses default gorilla names and scores when omitted', () => {
    const city = generateCity(640, 480);
    expect(city.gorilla1.name).toBe('Gorilla 1');
    expect(city.gorilla2.name).toBe('Gorilla 2');
    expect(city.gorilla1.score).toBe(0);
    expect(city.gorilla2.score).toBe(0);
  });
});
