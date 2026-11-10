import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';
import { Gorilla } from '../types/game';

const p1: Gorilla = {
  playerNumber: 1,
  name: 'Player 1',
  x: 180,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 1,
  isHit: false,
  armState: 'idle',
  score: 1,
};

const p2: Gorilla = {
  playerNumber: 2,
  name: 'Gorilla AI',
  x: 780,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 7,
  isHit: false,
  armState: 'idle',
  score: 0,
};

describe('ControlPanel', () => {
  it('handles positive and negative angles, power changes, steppers, keyboard shortcuts, and wind tactical advice', () => {
    const onChangeAngle = vi.fn();
    const onChangePower = vi.fn();
    const onFire = vi.fn();
    const onToggleSound = vi.fn();
    const onOpenSettings = vi.fn();
    const onResetRound = vi.fn();
    const onTogglePause = vi.fn();
    const onOpenStats = vi.fn();

    const { rerender } = render(
      <ControlPanel
        gorilla1={p1}
        gorilla2={p2}
        currentTurn={1}
        angle={45}
        power={60}
        wind={-9}
        onChangeAngle={onChangeAngle}
        onChangePower={onChangePower}
        onFire={onFire}
        isFiring={false}
        gameMode="1P_VS_CPU"
        gameState="PLAYING"
        targetScore={3}
        soundMuted={false}
        onToggleSound={onToggleSound}
        onOpenSettings={onOpenSettings}
        onResetRound={onResetRound}
        onTogglePause={onTogglePause}
        onOpenStats={onOpenStats}
      />
    );

    // Tactical headwind advice displayed for P1 when wind is -9
    expect(screen.getByText(/Strong headwind/i)).toBeInTheDocument();

    // Test typing negative angle '-' then '-25'
    const angleInput = screen.getByLabelText('Launch Angle');
    fireEvent.change(angleInput, { target: { value: '-' } });
    expect((angleInput as HTMLInputElement).value).toBe('-');
    fireEvent.blur(angleInput); // blurring on '-' resets to angle

    fireEvent.change(angleInput, { target: { value: '-25' } });
    expect(onChangeAngle).toHaveBeenCalledWith(-25);
    fireEvent.blur(angleInput);

    // Test Angle stepper buttons (-5, +5)
    fireEvent.click(screen.getByTitle('Decrease angle by 5°'));
    expect(onChangeAngle).toHaveBeenCalledWith(40);
    fireEvent.click(screen.getByTitle('Increase angle by 5°'));
    expect(onChangeAngle).toHaveBeenCalledWith(50);

    // Test Power input and stepper buttons (-10, +10)
    const powerInput = screen.getByLabelText('Launch Velocity');
    fireEvent.change(powerInput, { target: { value: '85' } });
    expect(onChangePower).toHaveBeenCalledWith(85);
    fireEvent.click(screen.getByText('-10'));
    expect(onChangePower).toHaveBeenCalledWith(50);
    fireEvent.click(screen.getByText('+10'));
    expect(onChangePower).toHaveBeenCalledWith(70);

    // Quick utility buttons
    fireEvent.click(screen.getByTitle('Mute Sound'));
    expect(onToggleSound).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('Settings'));
    expect(onOpenSettings).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('Regenerate Skyline'));
    expect(onResetRound).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('Estadísticas y Récords'));
    expect(onOpenStats).toHaveBeenCalled();

    // Keyboard shortcuts
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(onChangeAngle).toHaveBeenCalledWith(46);

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(onChangeAngle).toHaveBeenCalledWith(44);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onChangePower).toHaveBeenCalledWith(61);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onChangePower).toHaveBeenCalledWith(59);

    fireEvent.keyDown(window, { key: ' ' });
    expect(onFire).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    // Test negative angle advice when angle is -15
    rerender(
      <ControlPanel
        gorilla1={p1}
        gorilla2={p2}
        currentTurn={1}
        angle={-15}
        power={60}
        wind={9}
        onChangeAngle={onChangeAngle}
        onChangePower={onChangePower}
        onFire={onFire}
        isFiring={false}
        gameMode="1P_VS_CPU"
        gameState="PLAYING"
        targetScore={3}
        soundMuted={false}
        onToggleSound={onToggleSound}
        onOpenSettings={onOpenSettings}
        onResetRound={onResetRound}
        onTogglePause={onTogglePause}
        onOpenStats={onOpenStats}
      />
    );
    expect(screen.getByText(/NEGATIVE ANGLE/i)).toBeInTheDocument();

    // Test tailwind advice when angle is 45 and wind is +9
    rerender(
      <ControlPanel
        gorilla1={p1}
        gorilla2={p2}
        currentTurn={1}
        angle={45}
        power={60}
        wind={9}
        onChangeAngle={onChangeAngle}
        onChangePower={onChangePower}
        onFire={onFire}
        isFiring={false}
        gameMode="1P_VS_CPU"
        gameState="PLAYING"
        targetScore={3}
        soundMuted={false}
        onToggleSound={onToggleSound}
        onOpenSettings={onOpenSettings}
        onResetRound={onResetRound}
        onTogglePause={onTogglePause}
        onOpenStats={onOpenStats}
      />
    );
    expect(screen.getByText(/STRONG TAILWIND/i)).toBeInTheDocument();

    rerender(
      <ControlPanel
        gorilla1={p1}
        gorilla2={p2}
        currentTurn={1}
        angle={0}
        power={60}
        wind={0}
        onChangeAngle={onChangeAngle}
        onChangePower={onChangePower}
        onFire={onFire}
        isFiring={false}
        gameMode="1P_VS_CPU"
        gameState="PLAYING"
        targetScore={3}
        soundMuted={true}
        onToggleSound={onToggleSound}
        onOpenSettings={onOpenSettings}
        onResetRound={onResetRound}
        onTogglePause={onTogglePause}
        onOpenStats={onOpenStats}
      />
    );
    expect(screen.getByText(/CALM: Standard/i)).toBeInTheDocument();
  });
});
