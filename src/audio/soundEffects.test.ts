import { describe, it, expect } from 'vitest';
import { sound } from './soundEffects';

describe('SoundEffectsManager', () => {
  it('manages mute and volume states with clamping', () => {
    sound.setMuted(true);
    expect(sound.getMuted()).toBe(true);

    sound.setMuted(false);
    expect(sound.getMuted()).toBe(false);

    sound.setVolume(1.5);
    expect(sound.getVolume()).toBe(1);

    sound.setVolume(-0.5);
    expect(sound.getVolume()).toBe(0);

    sound.setVolume(0.5);
    expect(sound.getVolume()).toBe(0.5);
  });

  it('synthesizes all retro sound effects when unmuted and skips when muted', () => {
    sound.setMuted(false);
    expect(() => {
      sound.playThrow();
      sound.playSunGasp();
      sound.playSunHit();
      sound.playExplosion(false);
      sound.playExplosion(true);
      sound.playVictory();
      sound.playMenuBeep();
      sound.playRoundStart();
    }).not.toThrow();

    sound.setMuted(true);
    expect(() => {
      sound.playThrow();
      sound.playSunGasp();
      sound.playSunHit();
      sound.playExplosion(true);
      sound.playVictory();
      sound.playMenuBeep();
      sound.playRoundStart();
    }).not.toThrow();
    sound.setMuted(false);
  });
});
