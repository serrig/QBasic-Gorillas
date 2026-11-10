import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { GameSettings } from '../types/game';

const defaultSettings: GameSettings = {
  gravity: 9.8,
  gravityName: 'Earth (9.8 m/s²)',
  targetScore: 3,
  showTrajectoryTrail: false,
  crtEffect: true,
  soundEnabled: true,
  soundVolume: 0.45,
  difficulty: 'VETERAN',
};

describe('TitleScreen', () => {
  it('switches game modes, difficulty, target score, toggles How To Play, and starts game', () => {
    const onStartGame = vi.fn();
    const onOpenStats = vi.fn();

    render(
      <TitleScreen
        initialSettings={defaultSettings}
        onStartGame={onStartGame}
        onOpenStats={onOpenStats}
      />
    );

    // Switch to 2 PLAYERS and SANDBOX and back to 1P VS CPU
    fireEvent.click(screen.getByText('2 PLAYERS'));
    expect(screen.getByDisplayValue('Player 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('SANDBOX'));
    expect(screen.getByDisplayValue('Target Dummy')).toBeInTheDocument();

    fireEvent.click(screen.getByText('1P VS CPU'));
    expect(screen.getByDisplayValue('Gorilla AI')).toBeInTheDocument();

    // Select difficulty MASTER
    fireEvent.click(screen.getByText('MASTER'));

    // Select target score 5 rounds
    fireEvent.click(screen.getByText('5'));

    // Toggle Sound and CRT in header
    fireEvent.click(screen.getByText('SOUND ON'));
    expect(screen.getByText('MUTED')).toBeInTheDocument();
    fireEvent.click(screen.getByText('CRT ON'));
    expect(screen.getByText('CRT OFF')).toBeInTheDocument();

    // Open and close How To Play modal via AYUDA button
    fireEvent.click(screen.getByText('AYUDA'));
    expect(screen.getByText(/HOW TO PLAY GORILLAS/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('GOT IT'));
    expect(screen.queryByText(/HOW TO PLAY GORILLAS/i)).not.toBeInTheDocument();

    // Open Stats
    fireEvent.click(screen.getByText('RÉCORDS'));
    expect(onOpenStats).toHaveBeenCalledTimes(1);

    // Start game via button
    fireEvent.click(screen.getByText(/START GAME/i));
    expect(onStartGame).toHaveBeenCalledWith(
      '1P_VS_CPU',
      'MASTER',
      'Player 1',
      'Gorilla AI',
      5,
      expect.objectContaining({
        crtEffect: false,
        soundEnabled: false,
      })
    );

    // Start game via Enter key
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onStartGame).toHaveBeenCalledTimes(2);
  });
});
