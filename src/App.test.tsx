import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

describe('App Integration', () => {
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const stepFrames = (count: number = 1, stepMs: number = 25) => {
    let time = performance.now();
    for (let i = 0; i < count; i++) {
      const batch = [...rafCallbacks];
      rafCallbacks = [];
      time += stepMs;
      batch.forEach((cb) => cb(time));
    }
  };

  it('starts on TitleScreen, opens Stats modal, starts game, toggles sound/settings/pause, and returns to Title', async () => {
    render(<App />);

    // Open and close Stats modal from TitleScreen
    fireEvent.click(screen.getByText('RÉCORDS'));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByText(/GORILLAS HALL OF FAME/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('VOLVER AL JUEGO'));

    // Click Start Game
    fireEvent.click(screen.getByText(/START GAME/i));
    expect(screen.getByText('THROW (SPACE)')).toBeInTheDocument();

    // Toggle Sound Mute in HUD
    fireEvent.click(screen.getByTitle('Mute Sound'));
    expect(screen.getByTitle('Unmute Sound')).toBeInTheDocument();

    // Regenerate Skyline in HUD
    fireEvent.click(screen.getByTitle('Regenerate Skyline'));

    // Open Settings Modal via HUD button, change gravity, close
    fireEvent.click(screen.getByTitle('Settings'));
    expect(screen.getByText(/GAME SETTINGS & PHYSICS/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Moon/i));
    fireEvent.click(screen.getByText(/RESUME GAME/i));

    // Open Pause Modal via HUD button, restart round, pause again, quit to title
    fireEvent.click(screen.getByTitle('Pause'));
    expect(screen.getByText(/GAME PAUSED/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/RESTART ROUND/i));

    fireEvent.click(screen.getByTitle('Pause'));
    fireEvent.click(screen.getByText(/QUIT TO TITLE/i));
    expect(screen.getByText(/START GAME/i)).toBeInTheDocument();
  });

  it('completes rounds, triggers CPU turn, and records Match Victory', async () => {
    render(<App />);

    // Set target score to 1 round for fast match completion
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText(/START GAME/i));

    // Shoot straight down (-90 deg) so banana hits Gorilla 1 immediately
    const angleInput = screen.getByLabelText('Launch Angle');
    fireEvent.change(angleInput, { target: { value: '-90' } });

    fireEvent.click(screen.getByText('THROW (SPACE)'));
    expect(screen.getByText('IN FLIGHT...')).toBeInTheDocument();

    act(() => {
      stepFrames(3, 20);
      vi.advanceTimersByTime(1500);
    });

    // Since target score is 1, Match Victory modal appears
    expect(screen.getByText(/MATCH CHAMPION/i)).toBeInTheDocument();

    // Open Stats from GameOverModal
    fireEvent.click(screen.getByText(/SALÓN DE LA FAMA/i));
    expect(screen.getByText(/GORILLAS HALL OF FAME/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('VOLVER AL JUEGO'));

    // Restart match from GameOverModal
    fireEvent.click(screen.getByText(/PLAY REMATCH/i));
    expect(screen.getByText('THROW (SPACE)')).toBeInTheDocument();
  });

  it('handles multi-round matches (NEXT ROUND), out-of-bounds shots, and CPU automated shot', () => {
    render(<App />);

    // Default target score is 3 rounds; start game
    fireEvent.click(screen.getByText(/START GAME/i));

    // Shoot straight down (-90 deg) to end Round 1
    const angleInput = screen.getByLabelText('Launch Angle');
    fireEvent.change(angleInput, { target: { value: '-90' } });
    fireEvent.click(screen.getByText('THROW (SPACE)'));

    act(() => {
      stepFrames(3, 20);
      vi.advanceTimersByTime(1500);
    });

    // Round 1 complete modal appears -> click NEXT ROUND
    expect(screen.getByText(/ROUND 1 COMPLETE/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/NEXT ROUND/i));

    // Switch to Moon gravity so 100 power flies out of bounds
    fireEvent.click(screen.getByTitle('Settings'));
    fireEvent.click(screen.getByText(/Moon/i));
    fireEvent.click(screen.getByText(/RESUME GAME/i));

    fireEvent.change(screen.getByLabelText('Launch Angle'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Launch Velocity'), { target: { value: '100' } });

    fireEvent.click(screen.getByText('THROW (SPACE)'));

    // Step frames until banana flies out of bounds right
    act(() => {
      stepFrames(60, 45);
      vi.advanceTimersByTime(600);
    });

    // Now it's CPU's turn (currentTurn === 2), advance timers so CPU thinks and fires
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getAllByText(/IN FLIGHT|WAITING/i).length).toBeGreaterThan(0);
  });
});
