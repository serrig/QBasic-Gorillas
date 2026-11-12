import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LegalModal } from './LegalModal';
import { CookieConsentBanner } from './CookieConsentBanner';
import { CookieConsentPreferences } from '../services/consentStorage';

describe('Legal & Cookie Consent Components', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('LegalModal', () => {
    it('does not render when closed and switches across all 4 legal tabs when open', () => {
      const onClose = vi.fn();
      const onOpenCookieSettings = vi.fn();

      const { rerender } = render(
        <LegalModal
          isOpen={false}
          onClose={onClose}
          onOpenCookieSettings={onOpenCookieSettings}
        />
      );
      expect(screen.queryByText(/INFORMACIÓN LEGAL/i)).not.toBeInTheDocument();

      rerender(
        <LegalModal
          isOpen={true}
          initialTab="notice"
          onClose={onClose}
          onOpenCookieSettings={onOpenCookieSettings}
        />
      );

      expect(screen.getByText(/OBRA HOMENAJE INDEPENDIENTE/i)).toBeInTheDocument();

      // Privacy tab
      fireEvent.click(screen.getByText('PRIVACIDAD'));
      expect(screen.getByText(/ARQUITECTURA 100% LOCAL/i)).toBeInTheDocument();

      // Cookies tab
      fireEvent.click(screen.getByText('COOKIES'));
      expect(screen.getByText(/gorillas_legal_consent_v1/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/CAMBIAR PREFERENCIAS DE COOKIES/i));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onOpenCookieSettings).toHaveBeenCalledTimes(1);

      // Terms & Health tab
      fireEvent.click(screen.getByText('TÉRMINOS'));
      expect(screen.getByText(/AVISO DE FOTOSENSIBILIDAD/i)).toBeInTheDocument();

      // Back to Notice tab and close via X button
      fireEvent.click(screen.getByText('AVISO LEGAL'));
      expect(screen.getByText(/OBRA HOMENAJE INDEPENDIENTE/i)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Cerrar diálogo legal'));
      expect(onClose).toHaveBeenCalledTimes(2);

      // Close button
      fireEvent.click(screen.getByText('ENTENDIDO'));
      expect(onClose).toHaveBeenCalledTimes(3);
    });
  });

  describe('CookieConsentBanner', () => {
    it('renders bottom banner on first visit and handles Accept All and Essential Only', () => {
      const onConsentSaved = vi.fn();
      const onOpenConfig = vi.fn();
      const onCloseConfig = vi.fn();
      const onOpenLegal = vi.fn();

      const { rerender } = render(
        <CookieConsentBanner
          consent={null}
          isConfigOpen={false}
          onConsentSaved={onConsentSaved}
          onOpenConfig={onOpenConfig}
          onCloseConfig={onCloseConfig}
          onOpenLegal={onOpenLegal}
        />
      );

      expect(screen.getByText(/COOKIES Y ALMACENAMIENTO LOCAL/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Ver Política Legal y Cookies/i));
      expect(onOpenLegal).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('CONFIGURAR'));
      expect(onOpenConfig).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('SOLO ESENCIALES'));
      expect(onConsentSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
          statsStorage: false,
          externalFonts: false,
        })
      );

      fireEvent.click(screen.getByText('ACEPTAR TODO'));
      expect(onConsentSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          essential: true,
          statsStorage: true,
          externalFonts: true,
        })
      );

      // Open preferences dialog
      const existingConsent: CookieConsentPreferences = {
        essential: true,
        statsStorage: true,
        externalFonts: true,
        consentTimestamp: Date.now(),
        version: 1,
      };

      rerender(
        <CookieConsentBanner
          consent={existingConsent}
          isConfigOpen={true}
          onConsentSaved={onConsentSaved}
          onOpenConfig={onOpenConfig}
          onCloseConfig={onCloseConfig}
          onOpenLegal={onOpenLegal}
        />
      );

      expect(screen.getByText(/PREFERENCIAS DE COOKIES Y PRIVACIDAD/i)).toBeInTheDocument();

      // Toggle switches
      const statsSwitch = screen.getByRole('switch', { name: /estadísticas locales/i });
      fireEvent.click(statsSwitch);
      expect(statsSwitch).toHaveAttribute('aria-checked', 'false');

      const fontsSwitch = screen.getByRole('switch', { name: /tipografías externas/i });
      fireEvent.click(fontsSwitch);
      expect(fontsSwitch).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(screen.getByText('GUARDAR PREFERENCIAS'));
      expect(onConsentSaved).toHaveBeenLastCalledWith(
        expect.objectContaining({
          essential: true,
          statsStorage: false,
          externalFonts: false,
        })
      );
      expect(onCloseConfig).toHaveBeenCalled();

      fireEvent.click(screen.getByLabelText('Cerrar preferencias de cookies'));
      expect(onCloseConfig).toHaveBeenCalled();
    });
  });
});
