import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Create a rich mock 2D context for HTMLCanvasElement in jsdom
function createMockCanvas2DContext(): CanvasRenderingContext2D {
  const gradientMock = {
    addColorStop: vi.fn(),
  };

  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    font: '',
    textAlign: 'start',
    globalCompositeOperation: 'source-over',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    drawImage: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => gradientMock as unknown as CanvasGradient),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn(() => createMockCanvas2DContext()),
});

// Mock Web Audio API AudioContext
class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';
  frequency = new MockAudioParam();
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = new MockAudioParam();
  connect = vi.fn();
}

class MockBiquadFilterNode {
  type = 'lowpass';
  frequency = new MockAudioParam();
  connect = vi.fn();
}

class MockAudioBufferSourceNode {
  buffer: unknown = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

export class MockAudioContext {
  state: 'running' | 'suspended' = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  createBiquadFilter = vi.fn(() => new MockBiquadFilterNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  createBuffer = vi.fn((_channels: number, length: number) => ({
    getChannelData: vi.fn(() => new Float32Array(length)),
  }));
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  configurable: true,
  value: MockAudioContext,
});

// Mock URL.createObjectURL & URL.revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

// Polyfill HTMLDialogElement.showModal and close for jsdom
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (returnValue?: string) {
      if (returnValue !== undefined) {
        this.returnValue = returnValue;
      }
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
