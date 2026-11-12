import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PauseModal } from './PauseModal';
import { GameOverModal } from './GameOverModal';
import { SettingsModal } from './SettingsModal';
import { StatsModal } from './StatsModal';
import { GameSettings, Gorilla } from '../types/game';
import { statsDb, MAX_BACKUP_BYTES } from '../services/statsDatabase';

const mockGorilla1: Gorilla = {
  playerNumber: 1,
  name: 'Player 1',
  x: 180,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 1,
  isHit: false,
  armState: 'idle',
  score: 2,
};

const mockGorilla2: Gorilla = {
  playerNumber: 2,
  name: 'Gorilla AI',
  x: 780,
  y: 350,
  width: 32,
  height: 34,
  buildingIndex: 7,
  isHit: true,
  armState: 'idle',
  score: 1,
};

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

describe('Modal Components', () => {
  beforeEach(async () => {
    await statsDb.clearAllStats();
  });

  describe('PauseModal', () => {
    it('triggers callbacks on button clicks and Escape key', () => {
      const onResume = vi.fn();
      const onRestartRound = vi.fn();
      const onOpenSettings = vi.fn();
      const onReturnToTitle = vi.fn();
      const onOpenStats = vi.fn();

      render(
        <PauseModal
          onResume={onResume}
          onRestartRound={onRestartRound}
          onOpenSettings={onOpenSettings}
          onReturnToTitle={onReturnToTitle}
          onOpenStats={onOpenStats}
        />
      );

      fireEvent.click(screen.getByText(/RESUME/i));
      expect(onResume).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/RESTART ROUND/i));
      expect(onRestartRound).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/ESTADÍSTICAS & RÉCORDS/i));
      expect(onOpenStats).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/SETTINGS & PHYSICS/i));
      expect(onOpenSettings).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/QUIT TO TITLE/i));
      expect(onReturnToTitle).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onResume).toHaveBeenCalledTimes(2);
    });
  });

  describe('GameOverModal', () => {
    it('renders Round Over view and calls onNextRound', () => {
      const onNextRound = vi.fn();
      const onRestartMatch = vi.fn();
      const onReturnToTitle = vi.fn();
      const onOpenStats = vi.fn();

      render(
        <GameOverModal
          winner={mockGorilla1}
          loser={mockGorilla2}
          isMatchVictory={false}
          roundNumber={2}
          gameMode="1P_VS_CPU"
          targetScore={3}
          totalShotsThisRound={3}
          onNextRound={onNextRound}
          onRestartMatch={onRestartMatch}
          onReturnToTitle={onReturnToTitle}
          onOpenStats={onOpenStats}
        />
      );

      expect(screen.getByText(/ROUND 2 COMPLETE/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/NEXT ROUND/i));
      expect(onNextRound).toHaveBeenCalledTimes(1);
    });

    it('renders Match Victory view and calls onRestartMatch, onOpenStats, and onReturnToTitle', () => {
      const onNextRound = vi.fn();
      const onRestartMatch = vi.fn();
      const onReturnToTitle = vi.fn();
      const onOpenStats = vi.fn();

      render(
        <GameOverModal
          winner={{ ...mockGorilla1, score: 3 }}
          loser={mockGorilla2}
          isMatchVictory={true}
          roundNumber={4}
          gameMode="1P_VS_CPU"
          targetScore={3}
          totalShotsThisRound={1}
          onNextRound={onNextRound}
          onRestartMatch={onRestartMatch}
          onReturnToTitle={onReturnToTitle}
          onOpenStats={onOpenStats}
        />
      );

      expect(screen.getByText(/MATCH CHAMPION/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/PLAY REMATCH/i));
      expect(onRestartMatch).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/RESET SCORES/i));
      expect(onRestartMatch).toHaveBeenCalledTimes(2);

      fireEvent.click(screen.getByText(/SALÓN DE LA FAMA/i));
      expect(onOpenStats).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/TITLE SCREEN/i));
      expect(onReturnToTitle).toHaveBeenCalledTimes(1);
    });
  });

  describe('SettingsModal', () => {
    it('allows changing gravity, trajectory preview, CRT scanlines, volume, legal modal, and closing', () => {
      const onUpdateSettings = vi.fn();
      const onClose = vi.fn();
      const onReturnToTitle = vi.fn();
      const onOpenLegal = vi.fn();

      const { container } = render(
        <SettingsModal
          settings={defaultSettings}
          onUpdateSettings={onUpdateSettings}
          onClose={onClose}
          onReturnToTitle={onReturnToTitle}
          onOpenLegal={onOpenLegal}
        />
      );

      fireEvent.click(screen.getByText(/Moon/i));
      expect(onUpdateSettings).toHaveBeenCalledWith({
        gravity: 1.62,
        gravityName: 'Moon (1.6 m/s²)',
      });

      // Click toggle buttons (Trajectory Arc & CRT Scanlines)
      const toggleButtons = container.querySelectorAll('button.w-12.h-6');
      expect(toggleButtons.length).toBe(2);
      fireEvent.click(toggleButtons[0]);
      expect(onUpdateSettings).toHaveBeenCalledWith({ showTrajectoryTrail: true });
      fireEvent.click(toggleButtons[1]);
      expect(onUpdateSettings).toHaveBeenCalledWith({ crtEffect: false });

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '0.8' } });
      expect(onUpdateSettings).toHaveBeenCalledWith({
        soundVolume: 0.8,
        soundEnabled: true,
      });

      fireEvent.click(screen.getByText('[X]'));
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/QUIT TO TITLE/i));
      expect(onReturnToTitle).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/LEGAL & COOKIES/i));
      expect(onOpenLegal).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText(/RESUME GAME/i));
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('StatsModal', () => {
    it('returns null when closed and renders all 4 tabs and file import/reset flows when open', async () => {
      const onClose = vi.fn();
      const { rerender, container } = render(<StatsModal isOpen={false} onClose={onClose} />);
      expect(screen.queryByText(/GORILLAS HALL OF FAME/i)).not.toBeInTheDocument();

      await statsDb.recordMatch({
        id: 'test_match_1',
        date: Date.now(),
        gameMode: '1P_VS_CPU',
        difficulty: 'VETERAN',
        p1Name: 'Nacho',
        p2Name: 'Gorilla AI',
        winnerPlayer: 1,
        winnerName: 'Nacho',
        p1Score: 3,
        p2Score: 1,
        targetScore: 3,
        totalRounds: 4,
        p1Shots: 6,
        p2Shots: 5,
        totalShots: 11,
        gravity: 9.8,
        gravityName: 'Earth (9.8 m/s²)',
        holeInOnes: 1,
        minShotsInWinningRound: 1,
        maxHeadwindWon: 8,
        sunGasps: 2,
        sunHits: 1,
        cratersCarved: 4,
        friendlyFires: 0,
      });

      rerender(<StatsModal isOpen={true} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText(/RENDIMIENTO POR NIVEL DE DIFICULTAD/i)).toBeInTheDocument();
      });

      // Switch to Récords tab
      fireEvent.click(screen.getByText('RÉCORDS'));
      expect(screen.getByText(/PRECISIÓN DE TIRO/i)).toBeInTheDocument();
      expect(screen.getByText('-8 MPH')).toBeInTheDocument();

      // Switch to Historial tab
      fireEvent.click(screen.getByText('HISTORIAL'));
      expect(screen.getByText(/NACHO GANA/i)).toBeInTheDocument();

      // Switch to Datos (Backup) tab
      fireEvent.click(screen.getByText('DATOS'));
      expect(screen.getByText(/COPIAS DE SEGURIDAD/i)).toBeInTheDocument();

      // Test valid & invalid file imports
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const validBackup = await statsDb.exportBackup();
      const validFile = {
        size: 500,
        text: vi.fn().mockResolvedValue(validBackup),
      } as unknown as File;
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      await waitFor(() => {
        expect(screen.getByText(/¡Datos importados con éxito!/i)).toBeInTheDocument();
      });

      // Test oversized file rejection
      const oversizedFile = {
        size: MAX_BACKUP_BYTES + 1024,
        text: vi.fn().mockResolvedValue('{}'),
      } as unknown as File;
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      await waitFor(() => {
        expect(screen.getByText(/supera los 2 MB/i)).toBeInTheDocument();
      });

      // Test Reset with confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fireEvent.click(screen.getByText(/REINICIAR TODAS LAS ESTADÍSTICAS/i));
      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
      });

      // Test Escape to close
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
