import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

const STATUS_CONFIG = {
  LIBRE:    { bg: '#052e16', border: '#16a34a', text: '#4ade80', label: 'Libre' },
  OCUPADA:  { bg: '#450a0a', border: '#dc2626', text: '#f87171', label: 'Ocupada' },
  ABONADO:  { bg: '#1e1b4b', border: '#6366f1', text: '#818cf8', label: 'Abonado' },
  INACTIVA: { bg: '#111',    border: '#374151', text: '#6b7280', label: 'F. servicio' },
};

const TYPE_ICONS = {
  CARRO: '🚗', MOTO: '🏍️', BICICLETA: '🚲', CAMION: '🚛', DISCAPACITADO: '♿', BLOQUE: '🧱',
};

function formatTime(mins) {
  if (mins === undefined || mins === null || mins < 0) return '';
  const diff = Math.floor(mins);
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}

export default function AdminMapaEstado() {
  const [sedes, setSedes] = useState([]);
  const [selectedSede, setSelectedSede] = useState(null);
  const [spots, setSpots] = useState([]);
  const [maxRow, setMaxRow] = useState(0);
  const [maxCol, setMaxCol] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [stats, setStats] = useState({ libre: 0, ocupada: 0, abonado: 0 });

  // Load sedes
  useEffect(() => {
    api.get('/sedes').then(setSedes).catch(() => {});
  }, []);

  const loadMap = useCallback(async () => {
    if (!selectedSede) return;
    setLoading(true);
    try {
      const data = await api.get(`/spots/${selectedSede}`);
      setSpots(data.spots || []);
      setMaxRow(data.maxRow || 0);
      setMaxCol(data.maxCol || 0);
      setLastUpdate(new Date());
      // Calculate stats
      const s = { libre: 0, ocupada: 0, abonado: 0 };
      (data.spots || []).forEach(sp => {
        if (sp.spot_type === 'BLOQUE') return;
        if (sp.status === 'LIBRE') s.libre++;
        else if (sp.status === 'OCUPADA') s.ocupada++;
        else if (sp.status === 'ABONADO') s.abonado++;
      });
      setStats(s);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedSede]);

  useEffect(() => {
    loadMap();
    const interval = setInterval(loadMap, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [loadMap]);

  // Build grid map
  const spotMap = {};
  spots.forEach(s => { spotMap[`${s.row_pos}_${s.col_pos}`] = s; });

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-white">Monitor de Plazas en Tiempo Real</h1>
          <p className="text-white/30 text-xs mt-0.5">
            {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-CO')}` : 'Seleccione una sede para monitorear'}
            {selectedSede && <span className="ml-2 text-blue-400">↻ cada 10s</span>}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedSede || ''}
            onChange={e => setSelectedSede(e.target.value ? Number(e.target.value) : null)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="">— Seleccionar Sede —</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSede && (
            <button
              onClick={loadMap}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-sm transition-all"
            >
              ↻ Actualizar
            </button>
          )}
        </div>
      </div>

      {selectedSede && (
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-4">
            {[
              { label: 'Libres',   count: stats.libre,   color: '#4ade80', bg: '#052e16' },
              { label: 'Ocupadas', count: stats.ocupada, color: '#f87171', bg: '#450a0a' },
              { label: 'Abonados', count: stats.abonado, color: '#818cf8', bg: '#1e1b4b' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: s.bg, borderColor: s.color + '40' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.count} {s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedSede ? (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <div className="text-6xl opacity-20">🅿️</div>
            <p className="text-white/30 text-sm font-medium">Monitor de Parqueadero</p>
            <p className="text-white/20 text-xs">Seleccione una sede en el menú superior para ver el mapa en tiempo real.</p>
          </div>
        ) : loading && spots.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
          </div>
        ) : spots.length === 0 ? (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <div className="text-6xl opacity-20">🅿️</div>
            <p className="text-white/30 text-sm">No hay mapa diseñado para esta sede.</p>
            <p className="text-white/20 text-xs">Debes diseñar el mapa primero en la pestaña "Diseño de Mapa".</p>
          </div>
        ) : (
          <div
            className="inline-grid gap-2"
            style={{ gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: maxRow + 1 }, (_, row) =>
              Array.from({ length: maxCol + 1 }, (_, col) => {
                const key = `${row}_${col}`;
                const spot = spotMap[key];
                if (!spot) {
                  return <div key={key} className="w-16 h-16" />;
                }
                if (spot.spot_type === 'BLOQUE') {
                  return (
                    <div key={key} className="w-16 h-16 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <span className="text-white/20 text-lg">🧱</span>
                    </div>
                  );
                }
                const cfg = STATUS_CONFIG[spot.status] || STATUS_CONFIG.LIBRE;
                return (
                  <div
                    key={key}
                    className="w-16 h-16 rounded-lg border flex flex-col items-center justify-center relative group cursor-default transition-all"
                    style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                    title={spot.status === 'OCUPADA' ? `${spot.occupied_plate} — ${formatTime(spot.minutes_so_far)}` : cfg.label}
                  >
                    {/* Spot code */}
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cfg.text }}>
                      {spot.spot_code}
                    </span>
                    {/* Icon / plate */}
                    {spot.status === 'OCUPADA' ? (
                      <span className="text-[9px] font-bold text-white/70 mt-0.5 leading-none">{spot.occupied_plate}</span>
                    ) : spot.status === 'ABONADO' ? (
                      <span className="text-xs mt-0.5">♾️</span>
                    ) : (
                      <span className="text-sm mt-0.5">{TYPE_ICONS[spot.spot_type] || '🅿️'}</span>
                    )}

                    {/* Time badge for occupied */}
                    {spot.status === 'OCUPADA' && spot.minutes_so_far !== undefined && (
                      <span className="text-[8px] text-red-400/70 leading-none mt-0.5">{formatTime(spot.minutes_so_far)}</span>
                    )}

                    {/* Hover tooltip */}
                    {spot.status === 'OCUPADA' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-red-500/30 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl pointer-events-none">
                        <p className="font-bold text-red-400">{spot.occupied_plate}</p>
                        <p className="text-white/50 text-[10px]">Dentro: {formatTime(spot.minutes_so_far)}</p>
                      </div>
                    )}
                    {spot.status === 'ABONADO' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-indigo-500/30 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-xl pointer-events-none">
                        <p className="font-bold text-indigo-400">Abonado</p>
                        <p className="text-white/50 text-[10px]">{spot.subscriber_name}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
