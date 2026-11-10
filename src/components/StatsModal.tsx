import React, { useState, useEffect, useRef } from 'react';
import { AggregatedStats, MatchRecord, INITIAL_AGGREGATED_STATS } from '../types/stats';
import { statsDb, MAX_BACKUP_BYTES } from '../services/statsDatabase';
import { sound } from '../audio/soundEffects';
import {
  Trophy,
  Flame,
  Crosshair,
  Wind,
  Sun,
  Globe,
  History,
  Download,
  Upload,
  RotateCcw,
  X,
  Target,
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'records' | 'history' | 'backup';

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<AggregatedStats>(INITIAL_AGGREGATED_STATS);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stats from IndexedDB whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aggStats, recentMatches] = await Promise.all([
        statsDb.getAggregatedStats(),
        statsDb.getRecentMatches(20),
      ]);
      setStats(aggStats);
      setMatches(recentMatches);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    sound.playMenuBeep();
    try {
      const json = await statsDb.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gorillas-stats-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BACKUP_BYTES) {
      setImportStatus('Error: El archivo supera los 2 MB permitidos');
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }

    try {
      const text = await file.text();
      const updated = await statsDb.importBackup(text);
      setStats(updated);
      const recentMatches = await statsDb.getRecentMatches(20);
      setMatches(recentMatches);
      setImportStatus('¡Datos importados con éxito!');
      sound.playVictory();
      setTimeout(() => setImportStatus(null), 3000);
    } catch {
      setImportStatus('Error: Archivo inválido');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleReset = async () => {
    if (window.confirm('¿Seguro que deseas reiniciar todas las estadísticas a cero? Esta acción no se puede deshacer.')) {
      sound.playMenuBeep();
      const reset = await statsDb.clearAllStats();
      setStats(reset);
      setMatches([]);
    }
  };

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const total1P = stats.totalWins + stats.totalLosses;
  const overallWinRate = total1P > 0 ? Math.round((stats.totalWins / total1P) * 100) : 0;
  const accuracy = stats.totalShotsFired > 0 ? Math.round((stats.totalDirectHits / stats.totalShotsFired) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-yellow-400 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="font-pixel text-xs text-yellow-400 tracking-wider">
              GORILLAS HALL OF FAME & ESTADÍSTICAS
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playMenuBeep();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/70 text-xs font-pixel">
          <button
            onClick={() => {
              sound.playMenuBeep();
              setActiveTab('overview');
            }}
            className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 hidden sm:inline" />
            <span>NIVELES</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              setActiveTab('records');
            }}
            className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'records'
                ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 hidden sm:inline" />
            <span>RÉCORDS</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              setActiveTab('history');
            }}
            className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 hidden sm:inline" />
            <span>HISTORIAL</span>
          </button>

          <button
            onClick={() => {
              sound.playMenuBeep();
              setActiveTab('backup');
            }}
            className={`py-2.5 px-3 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 hidden sm:inline" />
            <span>DATOS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-slate-200 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-pixel text-xs animate-pulse">
              CARGANDO DATOS DESDE INDEXEDDB...
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & DIFFICULTIES */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Top Key Metrics Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <span className="text-[10px] font-pixel text-slate-400 block mb-1">PARTIDAS</span>
                      <span className="text-xl font-mono font-bold text-white tabular-nums">
                        {stats.totalMatches}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <span className="text-[10px] font-pixel text-sky-400 block mb-1">VICTORIAS</span>
                      <span className="text-xl font-mono font-bold text-sky-300 tabular-nums">
                        {stats.totalWins}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">({overallWinRate}%)</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-pixel text-amber-400 mb-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>RACHA</span>
                      </div>
                      <span className="text-xl font-mono font-bold text-amber-300 tabular-nums">
                        {stats.currentStreak}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">Récord: {stats.bestStreak}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5">
                      <span className="text-[10px] font-pixel text-emerald-400 block mb-1">PRECISIÓN</span>
                      <span className="text-xl font-mono font-bold text-emerald-300 tabular-nums">
                        {accuracy}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">{stats.totalDirectHits}/{stats.totalShotsFired} tiros</span>
                    </div>
                  </div>

                  {/* Difficulty Breakdown */}
                  <div>
                    <h3 className="font-pixel text-[11px] text-yellow-400 mb-2.5 flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>RENDIMIENTO POR NIVEL DE DIFICULTAD</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['ROOKIE', 'VETERAN', 'MASTER'] as const).map((diff) => {
                        const dStat = stats.byDifficulty[diff];
                        const winRate = dStat.played > 0 ? Math.round((dStat.won / dStat.played) * 100) : 0;
                        const avgShots = dStat.winningRoundsCount > 0
                          ? (dStat.totalWinningShots / dStat.winningRoundsCount).toFixed(1)
                          : '-';

                        const colorClass =
                          diff === 'ROOKIE'
                            ? 'border-emerald-500/50 bg-emerald-950/20'
                            : diff === 'VETERAN'
                            ? 'border-yellow-500/50 bg-yellow-950/20'
                            : 'border-rose-500/50 bg-rose-950/20';

                        const titleColor =
                          diff === 'ROOKIE'
                            ? 'text-emerald-400'
                            : diff === 'VETERAN'
                            ? 'text-yellow-400'
                            : 'text-rose-400';

                        return (
                          <div key={diff} className={`border p-3.5 space-y-2.5 ${colorClass}`}>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className={`font-pixel text-xs ${titleColor}`}>{diff}</span>
                              <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                                {dStat.won}/{dStat.played}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs font-mono">
                              <div className="flex justify-between text-slate-400">
                                <span>Tasa Victorias:</span>
                                <span className="text-white font-bold tabular-nums">{winRate}%</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Racha actual:</span>
                                <span className="text-amber-300 font-bold tabular-nums">{dStat.currentStreak} (Máx: {dStat.bestStreak})</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Media tiros/ronda:</span>
                                <span className="text-sky-300 font-bold tabular-nums">{avgShots}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2 Players Stats */}
                  <div className="bg-slate-950 border border-slate-800 p-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Partidas 2 Jugadores (Hotseat local):</span>
                    <span className="text-white font-bold font-pixel text-xs tabular-nums">{stats.twoPlayerMatches} jugadas</span>
                  </div>
                </div>
              )}

              {/* TAB 2: RECORDS & ARCADE FEATS */}
              {activeTab === 'records' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sniper / Precision Feats */}
                    <div className="bg-slate-950 border border-slate-800 p-4 space-y-3">
                      <h4 className="font-pixel text-[11px] text-yellow-400 flex items-center gap-1.5">
                        <Crosshair className="w-4 h-4 text-sky-400" />
                        <span>PRECISIÓN DE TIRO</span>
                      </h4>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400">Récord de Ronda Rápida:</span>
                          <span className="text-emerald-400 font-bold font-pixel text-xs tabular-nums">
                            {stats.bestMinShotsToWin > 0 ? `${stats.bestMinShotsToWin} disparos` : '-'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400">KOs en 1er Tiro (Hole-in-One):</span>
                          <span className="text-yellow-400 font-bold font-pixel text-xs tabular-nums">
                            {stats.holeInOnes}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Impactos directos al rival:</span>
                          <span className="text-white font-bold tabular-nums">
                            {stats.totalDirectHits}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Wind & Demolition Feats */}
                    <div className="bg-slate-950 border border-slate-800 p-4 space-y-3">
                      <h4 className="font-pixel text-[11px] text-yellow-400 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-cyan-400" />
                        <span>FÍSICA & DEMOLICIÓN</span>
                      </h4>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400">Récord Viento en Contra Vencido:</span>
                          <span className="text-cyan-300 font-bold font-pixel text-xs tabular-nums">
                            {stats.bestHeadwindWin > 0 ? `-${stats.bestHeadwindWin} MPH` : '-'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400">Cráteres excavados en edificios:</span>
                          <span className="text-amber-400 font-bold font-pixel text-xs tabular-nums">
                            {stats.cratersCarved}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Autogoles (viento bumerán):</span>
                          <span className="text-rose-400 font-bold tabular-nums">
                            {stats.friendlyFires}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sun Interactions */}
                    <div className="bg-slate-950 border border-slate-800 p-4 space-y-3">
                      <h4 className="font-pixel text-[11px] text-yellow-400 flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>INTERACCIONES CON EL SOL</span>
                      </h4>

                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between items-center py-1 border-b border-slate-900">
                          <span className="text-slate-400">Sustos al Sol (:O al pasar cerca):</span>
                          <span className="text-yellow-300 font-bold font-pixel text-xs tabular-nums">
                            {stats.sunGasps}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-400">Impactos directos al Sol (X_X):</span>
                          <span className="text-rose-400 font-bold font-pixel text-xs tabular-nums">
                            {stats.sunHits}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Planetary Gravity Wins */}
                    <div className="bg-slate-950 border border-slate-800 p-4 space-y-3">
                      <h4 className="font-pixel text-[11px] text-yellow-400 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>VICTORIAS POR GRAVEDAD</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(stats.winsByGravity).map(([name, count]) => {
                          const shortName = name.split(' ')[0];
                          return (
                            <div key={name} className="bg-slate-900/60 p-2 border border-slate-800 text-center">
                              <span className="text-slate-400 block text-[10px]">{shortName}</span>
                              <span className="text-white font-bold font-pixel text-xs tabular-nums">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: MATCH HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {matches.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-pixel text-xs">
                      NO HAY PARTIDAS REGISTRADAS TODAVÍA.
                      <p className="font-sans text-xs text-slate-400 mt-2">
                        Completa tu primera partida para ver el historial aquí.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matches.map((m) => {
                        const isWin = m.winnerPlayer === 1;
                        const dateStr = new Date(m.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={m.id}
                            className={`p-3 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 font-mono text-xs ${
                              isWin
                                ? 'bg-sky-950/20 border-sky-500/40'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-pixel text-[10px] ${
                                    isWin ? 'text-sky-300' : 'text-slate-400'
                                  }`}
                                >
                                  {m.winnerName.toUpperCase()} GANA
                                </span>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-400 text-[11px]">{dateStr}</span>
                              </div>
                              <div className="text-slate-300 text-xs">
                                <span>{m.p1Name} ({m.p1Score})</span> vs <span>{m.p2Name} ({m.p2Score})</span>
                                <span className="text-slate-500 ml-2">
                                  [{m.gameMode === '1P_VS_CPU' ? `CPU ${m.difficulty}` : '2P'}]
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right shrink-0">
                              <div className="text-slate-400 text-[11px]">
                                <div>{m.totalShots} disparos</div>
                                <div className="text-slate-500 text-[10px]">{m.gravityName.split(' ')[0]}</div>
                              </div>
                              <span
                                className={`font-pixel text-xs px-2 py-1 ${
                                  isWin ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {isWin ? 'VICTORIA' : 'DERROTA'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BACKUP & DATA MANAGEMENT */}
              {activeTab === 'backup' && (
                <div className="space-y-5">
                  <div className="bg-slate-950 border border-slate-800 p-4 space-y-2">
                    <h4 className="font-pixel text-xs text-yellow-400 flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>COPIAS DE SEGURIDAD (PORTABILIDAD)</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Todas tus estadísticas se guardan de forma nativa en la base de datos <strong>IndexedDB</strong> de tu navegador o dispositivo. Puedes exportarlas a un archivo JSON para conservarlas o transferirlas cuando convirtamos el juego en app de escritorio o móvil.
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                      <button
                        onClick={handleExport}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>EXPORTAR DATOS (.JSON)</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                      >
                        <Upload className="w-4 h-4" />
                        <span>RESTAURAR COPIA (.JSON)</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </div>

                    {importStatus && (
                      <div className="text-xs font-mono text-yellow-400 pt-2 animate-pulse">
                        {importStatus}
                      </div>
                    )}
                  </div>

                  {/* Reset Zone */}
                  <div className="bg-rose-950/20 border border-rose-900/60 p-4 space-y-2">
                    <h4 className="font-pixel text-xs text-rose-400 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      <span>ZONA DE PELIGRO</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-sans">
                      Borra permanentemente todo el historial de partidas y estadísticas de IndexedDB.
                    </p>
                    <button
                      onClick={handleReset}
                      className="py-2 px-3.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-pixel text-[11px] transition-colors border border-rose-700 cursor-pointer"
                    >
                      REINICIAR TODAS LAS ESTADÍSTICAS
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={() => {
              sound.playMenuBeep();
              onClose();
            }}
            className="py-2 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-pixel text-xs font-bold transition-colors cursor-pointer"
          >
            VOLVER AL JUEGO
          </button>
        </div>
      </div>
    </div>
  );
};
