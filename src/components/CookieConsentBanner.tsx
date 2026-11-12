import React, { useEffect, useRef, useState } from 'react';
import { Cookie, ShieldCheck, Sliders, X, Check } from 'lucide-react';
import {
  CookieConsentPreferences,
  DEFAULT_CONSENT_PREFERENCES,
  saveConsent,
} from '../services/consentStorage';
import { sound } from '../audio/soundEffects';

interface CookieConsentBannerProps {
  consent: CookieConsentPreferences | null;
  isConfigOpen: boolean;
  onConsentSaved: (prefs: CookieConsentPreferences) => void;
  onOpenConfig: () => void;
  onCloseConfig: () => void;
  onOpenLegal: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  consent,
  isConfigOpen,
  onConsentSaved,
  onOpenConfig,
  onCloseConfig,
  onOpenLegal,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [statsStorage, setStatsStorage] = useState<boolean>(
    consent?.statsStorage ?? DEFAULT_CONSENT_PREFERENCES.statsStorage
  );
  const [externalFonts, setExternalFonts] = useState<boolean>(
    consent?.externalFonts ?? DEFAULT_CONSENT_PREFERENCES.externalFonts
  );

  useEffect(() => {
    if (consent) {
      setStatsStorage(consent.statsStorage);
      setExternalFonts(consent.externalFonts);
    }
  }, [consent, isConfigOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isConfigOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isConfigOpen]);

  // Light-dismiss fallback for browsers without native `closedby="any"` (e.g., Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleAcceptAll = () => {
    sound.playMenuBeep();
    const saved = saveConsent({ statsStorage: true, externalFonts: true });
    onConsentSaved(saved);
    onCloseConfig();
  };

  const handleEssentialOnly = () => {
    sound.playMenuBeep();
    const saved = saveConsent({ statsStorage: false, externalFonts: false });
    onConsentSaved(saved);
    onCloseConfig();
  };

  const handleSaveCustom = () => {
    sound.playMenuBeep();
    const saved = saveConsent({ statsStorage, externalFonts });
    onConsentSaved(saved);
    onCloseConfig();
  };

  const handleDialogClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = '';
    }
    onCloseConfig();
  };

  return (
    <>
      {/* First-visit bottom consent banner (shown until user makes a choice) */}
      {!consent && !isConfigOpen && (
        <aside
          aria-label="Aviso de cookies y almacenamiento local"
          className="fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-4xl bg-slate-900/95 border-2 border-yellow-400 p-4 shadow-2xl animate-in fade-in duration-200"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-xs text-slate-300 font-sans">
              <div className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="font-pixel text-[11px] text-yellow-400">
                  COOKIES Y ALMACENAMIENTO LOCAL
                </span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Usamos almacenamiento local (<strong>IndexedDB / localStorage</strong>) para guardar tus récords en este dispositivo y fuentes retro opcionales de Google Fonts. <strong>Cero rastreadores ni cookies publicitarias.</strong>{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playMenuBeep();
                    onOpenLegal();
                  }}
                  className="text-sky-400 hover:text-sky-300 underline cursor-pointer font-medium"
                >
                  Ver Política Legal y Cookies
                </button>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playMenuBeep();
                  onOpenConfig();
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-pixel text-[10px] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>CONFIGURAR</span>
              </button>

              <button
                type="button"
                onClick={handleEssentialOnly}
                className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 font-pixel text-[10px] transition-colors cursor-pointer"
              >
                SOLO ESENCIALES
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="py-2 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-[10px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ACEPTAR TODO</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Granular Cookie & Storage Preferences Native Modal Dialog */}
      {isConfigOpen && (
        <dialog
          ref={dialogRef}
          {...({ closedby: 'any' } as Record<string, string>)}
          aria-labelledby="cookie-prefs-title"
          onClose={handleDialogClose}
          className="m-auto bg-slate-900 border-2 border-yellow-400 max-w-lg w-[calc(100%-2rem)] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 p-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 id="cookie-prefs-title" className="font-pixel text-xs text-yellow-400 tracking-wider">
                PREFERENCIAS DE COOKIES Y PRIVACIDAD
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playMenuBeep();
                onCloseConfig();
              }}
              aria-label="Cerrar preferencias de cookies"
              className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preferences List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 text-xs font-sans">
            <p className="text-slate-400 leading-relaxed">
              Personaliza qué tecnologías locales o externas autorizas en este dispositivo. Puedes cambiar tu elección en cualquier momento desde el menú de inicio o ajustes.
            </p>

            {/* 1. Essential */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-emerald-400">
                    ALMACENAMIENTO ESENCIAL
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-1.5 py-0.5">
                    SIEMPRE ACTIVO
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Necesario para recordar tu elección de consentimiento y el funcionamiento básico del juego en memoria.
                </p>
              </div>
            </div>

            {/* 2. Local Stats (IndexedDB) */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-pixel text-[10px] text-yellow-400 block">
                  ESTADÍSTICAS LOCALES (INDEXEDDB)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Guarda tu Salón de la Fama, victorias por nivel, récords de viento y el historial de partidas en tu dispositivo.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={statsStorage}
                aria-label="Activar estadísticas locales en IndexedDB"
                onClick={() => {
                  sound.playMenuBeep();
                  setStatsStorage((prev) => !prev);
                }}
                className={`w-12 h-6 shrink-0 flex items-center px-1 border transition-colors cursor-pointer ${
                  statsStorage
                    ? 'bg-emerald-600 border-emerald-400 justify-end'
                    : 'bg-slate-800 border-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white" />
              </button>
            </div>

            {/* 3. External Fonts (Google Fonts) */}
            <div className="bg-slate-950 border border-slate-800 p-3.5 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="font-pixel text-[10px] text-sky-400 block">
                  TIPOGRAFÍAS RETRO EXTERNAS (GOOGLE FONTS)
                </span>
                <p className="text-slate-400 text-[11px]">
                  Solicita las fuentes pixeladas a Google Fonts. Si lo desactivas, se usarán fuentes monoespaciadas locales sin conexiones externas.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={externalFonts}
                aria-label="Activar tipografías externas de Google Fonts"
                onClick={() => {
                  sound.playMenuBeep();
                  setExternalFonts((prev) => !prev);
                }}
                className={`w-12 h-6 shrink-0 flex items-center px-1 border transition-colors cursor-pointer ${
                  externalFonts
                    ? 'bg-sky-600 border-sky-400 justify-end'
                    : 'bg-slate-800 border-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-pixel text-[10px] transition-colors cursor-pointer"
            >
              SOLO ESENCIALES
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="py-2 px-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-pixel text-[10px] font-bold transition-colors cursor-pointer"
              >
                GUARDAR PREFERENCIAS
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-[10px] font-bold transition-colors cursor-pointer"
              >
                ACEPTAR TODO
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};
