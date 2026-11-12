import React, { useEffect, useRef, useState } from 'react';
import { Scale, ShieldCheck, Cookie, AlertTriangle, X, ExternalLink, Sliders } from 'lucide-react';
import { sound } from '../audio/soundEffects';

export type LegalTab = 'notice' | 'privacy' | 'cookies' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  onOpenCookieSettings: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'notice',
  onClose,
  onOpenCookieSettings,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="legal-modal-title"
      onClose={handleNativeClose}
      className="m-auto bg-slate-900 border-2 border-yellow-400 max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 p-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-yellow-400" />
          <h2 id="legal-modal-title" className="font-pixel text-xs text-yellow-400 tracking-wider">
            INFORMACIÓN LEGAL, PRIVACIDAD Y COOKIES
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            onClose();
          }}
          aria-label="Cerrar diálogo legal"
          className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
          title="Cerrar (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/70 text-[10px] sm:text-xs font-pixel">
        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            setActiveTab('notice');
          }}
          className={`py-2.5 px-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'notice'
              ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5 hidden sm:inline" />
          <span>AVISO LEGAL</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            setActiveTab('privacy');
          }}
          className={`py-2.5 px-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'privacy'
              ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 hidden sm:inline" />
          <span>PRIVACIDAD</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            setActiveTab('cookies');
          }}
          className={`py-2.5 px-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'cookies'
              ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cookie className="w-3.5 h-3.5 hidden sm:inline" />
          <span>COOKIES</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            setActiveTab('terms');
          }}
          className={`py-2.5 px-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'terms'
              ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 hidden sm:inline" />
          <span>TÉRMINOS</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans leading-relaxed text-slate-300">
        {activeTab === 'notice' && (
          <div className="space-y-4">
            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-yellow-400">
                1. OBRA HOMENAJE INDEPENDIENTE Y MARCAS REGISTRADAS
              </h3>
              <p>
                <strong>QBasic Gorillas</strong> es una recreación independiente, gratuita y de código abierto inspirada en el juego clásico de 1991 <em>GORILLA.BAS</em> distribuido originalmente con MS-DOS / QBasic.
              </p>
              <p className="text-slate-400">
                Microsoft®, MS-DOS® y QBasic® son marcas registradas de Microsoft Corporation. Este proyecto <strong>no está afiliado, patrocinado, avalado ni asociado</strong> con Microsoft Corporation. Todo el código fuente, renderizado procedural en Canvas HTML5 y síntesis de audio Web Audio API han sido desarrollados desde cero de forma original.
              </p>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-sky-400">
                2. LICENCIA DE CÓDIGO ABIERTO (APACHE-2.0)
              </h3>
              <p>
                El software se distribuye bajo la licencia <strong>Apache License, Version 2.0</strong>. Puedes consultar, auditar, bifurcar y contribuir al código fuente público en{' '}
                <a
                  href="https://github.com/serrig/QBasic-Gorillas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline inline-flex items-center gap-1"
                >
                  github.com/serrig/QBasic-Gorillas
                  <ExternalLink className="w-3 h-3" />
                </a>.
              </p>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-amber-400">
                3. EXCLUSIÓN DE GARANTÍAS Y LIMITACIÓN DE RESPONSABILIDAD
              </h3>
              <p className="text-slate-400">
                Conforme a la Licencia Apache 2.0, la aplicación se proporciona <strong>«TAL CUAL» (&ldquo;AS IS&rdquo;)</strong>, sin garantías expresas ni implícitas de ningún tipo, incluyendo comerciabilidad o idoneidad para un propósito particular. El autor no se hace responsable de la pérdida accidental de estadísticas locales provocada por el borrado de caché/datos del navegador ni de interrupciones en el alojamiento estático.
              </p>
            </section>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-emerald-400">
                1. ARQUITECTURA 100% LOCAL (ZERO DATA COLLECTION)
              </h3>
              <p>
                En cumplimiento del <strong>RGPD (UE 2016/679)</strong>, la <strong>LOPDGDD</strong> y la <strong>CCPA</strong>, te informamos de que <strong>QBasic Gorillas no recopila, transmite ni almacena datos personales en servidores propios ni de terceros</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>No existen cuentas de usuario, registros, telemetría ni rastreadores publicitarios.</li>
                <li>Los nombres de jugador introducidos (p. ej. &ldquo;Player 1&rdquo;), puntuaciones y récords permanecen exclusivamente en la memoria local de tu navegador/dispositivo mediante <strong>IndexedDB</strong> y <strong>localStorage</strong>.</li>
              </ul>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-sky-400">
                2. SERVICIOS EXTERNOS OPCIONALES (GOOGLE FONTS)
              </h3>
              <p className="text-slate-400">
                Para ofrecer tipografía retro pixelada (<em>Press Start 2P</em> y <em>VT323</em>), la aplicación puede solicitar hojas de estilo a <code>fonts.googleapis.com</code>. Al cargar estas fuentes, tu navegador realiza una petición técnica estándar que expone tu dirección IP a Google LLC. Puedes desactivar esta carga en cualquier momento desde el panel de <strong>Configuración de Cookies</strong> para usar fuentes locales del sistema.
              </p>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-yellow-400">
                3. TUS DERECHOS (ACCESO, PORTABILIDAD Y SUPRESIÓN)
              </h3>
              <p className="text-slate-400">
                Dado que toda tu información reside únicamente en tu dispositivo, tienes control total sobre ella: desde la pestaña <strong>DATOS</strong> del <em>Salón de la Fama (🏆)</em> puedes <strong>exportar</strong> todo tu historial en JSON (portabilidad) o <strong>borrarlo</strong> de forma irreversible (derecho de supresión).
              </p>
            </section>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-4">
            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-yellow-400">
                1. USO DE COOKIES Y ALMACENAMIENTO LOCAL (LSSI-CE / ePRIVACY)
              </h3>
              <p>
                Esta aplicación <strong>no utiliza cookies publicitarias, de seguimiento ni de analítica de terceros</strong>. Únicamente emplea mecanismos de almacenamiento local del navegador (<code>localStorage</code> e <code>IndexedDB</code>) para recordar tus preferencias y guardar tus récords si así lo autorizas.
              </p>
            </section>

            <div className="overflow-x-auto border border-slate-800 bg-slate-950">
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-yellow-400 bg-slate-900">
                    <th className="p-2.5">Clave / Almacén</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Finalidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="p-2.5 text-sky-300">gorillas_legal_consent_v1</td>
                    <td className="p-2.5 text-emerald-400">Esencial</td>
                    <td className="p-2.5 font-sans">Recuerda tu elección de privacidad y cookies (localStorage).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300">GorillasGameDB</td>
                    <td className="p-2.5 text-amber-300">Funcional (Opcional)</td>
                    <td className="p-2.5 font-sans">Base de datos IndexedDB con historial, récords y logros.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300">gorillas_stats_summary / history</td>
                    <td className="p-2.5 text-amber-300">Funcional (Opcional)</td>
                    <td className="p-2.5 font-sans">Respaldo en localStorage si IndexedDB no está disponible.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-sky-300">Google Fonts CSS</td>
                    <td className="p-2.5 text-rose-300">Externo (Opcional)</td>
                    <td className="p-2.5 font-sans">Carga tipografías pixeladas retro desde fonts.googleapis.com.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  sound.playMenuBeep();
                  onClose();
                  onOpenCookieSettings();
                }}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/40 font-pixel text-[10px] flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>CAMBIAR PREFERENCIAS DE COOKIES</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <section className="bg-rose-950/25 border border-rose-800/60 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>AVISO DE FOTOSENSIBILIDAD Y EFECTOS VISUALES</span>
              </h3>
              <p className="text-slate-300">
                Este videojuego contiene destellos luminosos de explosiones, vibración de pantalla (<em>screen shake</em>) y un filtro opcional de líneas CRT que simula monitores antiguos. Si padeces epilepsia fotosensible o eres sensible a luces parpadeantes, consulta a un médico antes de jugar y desactiva el efecto <strong>CRT OFF</strong> en la pantalla de inicio o en Ajustes.
              </p>
            </section>

            <section className="bg-slate-950 border border-slate-800 p-4 space-y-2">
              <h3 className="font-pixel text-[11px] text-yellow-400">
                CONDICIONES DE USO Y CONTENIDO LOCAL
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>El juego está destinado exclusivamente a entretenimiento personal y fines educativos/retro.</li>
                <li>Al ser una aplicación sin servidor, cualquier nombre personalizado introducido para los jugadores es responsabilidad exclusiva del usuario que lo introduce en su dispositivo.</li>
                <li>La importación de copias de seguridad <code>.json</code> está limitada a archivos de hasta 2 MB y validada localmente para proteger la integridad de tu navegador.</li>
              </ul>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
        <span className="text-[10px] font-mono text-slate-500">
          Apache-2.0 · 100% Client-Side
        </span>
        <button
          type="button"
          onClick={() => {
            sound.playMenuBeep();
            onClose();
          }}
          className="py-2 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs font-bold transition-colors cursor-pointer"
        >
          ENTENDIDO
        </button>
      </div>
    </dialog>
  );
};
