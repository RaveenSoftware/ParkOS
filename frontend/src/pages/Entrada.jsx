import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const TYPES = [
  { value: 'CARRO',     label: 'Carro',     icon: '🚗', desc: 'Automóvil / camioneta' },
  { value: 'MOTO',      label: 'Moto',      icon: '🏍️', desc: 'Motocicleta / scooter' },
  { value: 'BICICLETA', label: 'Bicicleta', icon: '🚲', desc: 'Bicicleta convencional' },
  { value: 'CAMION',    label: 'Camión',    icon: '🚛', desc: 'Camión / furgón' },
];

const STATUS_CFG = {
  LIBRE:    { bg: '#052e16', border: '#16a34a', text: '#4ade80' },
  OCUPADA:  { bg: '#3b0a0a', border: '#dc2626', text: '#f87171' },
  ABONADO:  { bg: '#1e1b4b', border: '#6366f1', text: '#818cf8' },
  INACTIVA: { bg: '#111',    border: '#374151', text: '#6b7280' },
};

export default function Entrada() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('parkos_user') || '{}'); } catch { return {}; } })();

  // Form state
  const [plate,      setPlate]      = useState('');
  const [type,       setType]       = useState('CARRO');
  const [clientName, setClientName] = useState('');
  const [clientDoc,  setClientDoc]  = useState('');
  const [spotId,     setSpotId]     = useState(null);

  // Spots map state
  const [spots,   setSpots]   = useState([]);
  const [maxRow,  setMaxRow]  = useState(0);
  const [maxCol,  setMaxCol]  = useState(0);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [noMap,   setNoMap]   = useState(false);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error,   setError]   = useState('');

  // Para ADMIN_TENANT y SUPERADMIN, la sede se selecciona en el Sidebar y se guarda en parkos_pos_sedeId
  const sedeId = localStorage.getItem('parkos_pos_sedeId') || user.sedeId;

  const loadSpots = useCallback(async () => {
    if (!sedeId) return;
    setLoadingSpots(true);
    try {
      const data = await api.get(`/spots/${sedeId}`);
      setSpots(data.spots || []);
      setMaxRow(data.maxRow || 0);
      setMaxCol(data.maxCol || 0);
      setNoMap((data.spots || []).length === 0);
    } catch {
      setNoMap(true);
    } finally {
      setLoadingSpots(false);
    }
  }, [sedeId]);

  useEffect(() => { loadSpots(); }, [loadSpots]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        plate:      plate.toUpperCase().trim(),
        type,
        clientName: clientName.trim() || null,
        clientDoc:  clientDoc.trim()  || null,
        spotId:     spotId || null,
      };
      const ticket = await api.post('/tickets/entry', payload);
      setSuccess(ticket);
      setPlate('');
      setClientName('');
      setClientDoc('');
      setSpotId(null);
      loadSpots(); // refresh map
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSuccess(null);
    setError('');
    loadSpots();
  }

  // Build spot grid map
  const spotMap = {};
  spots.forEach(s => { spotMap[`${s.row_pos}_${s.col_pos}`] = s; });

  const selectedSpot = spots.find(s => s.id === spotId);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Registrar Entrada</h1>
        <p className="text-gray-400 text-sm mt-1">Complete los datos del vehículo y seleccione la plaza de parqueo</p>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">✅</span>
            <div className="flex-1">
              <p className="text-emerald-400 font-black text-lg">Entrada registrada exitosamente</p>
              <p className="text-white font-black text-2xl tracking-widest mt-1">{success.plate}</p>
              <p className="text-gray-400 text-sm mt-1">
                Ticket #{success.id} · {success.type} · {new Date(success.entry_at).toLocaleTimeString('es-CO')}
                {success.spot_id && <span className="ml-2 text-indigo-400">· Plaza asignada</span>}
              </p>
              {(success.client_name || success.client_doc) && (
                <p className="text-gray-300 text-sm mt-1">
                  {success.client_name && <span>👤 {success.client_name}</span>}
                  {success.client_doc  && <span className="ml-3">🪪 {success.client_doc}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleReset}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
            >
              + Registrar Otro
            </button>
            <button
              onClick={() => navigate('/pos/tickets')}
              className="bg-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
            >
              Ver Vehículos Dentro →
            </button>
            <button
              onClick={() => navigate('/pos/mapa')}
              className="bg-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
            >
              🅿️ Ver Mapa
            </button>
          </div>
        </div>
      )}

      {!success && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── LEFT: FORM ── */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-white/5 p-7">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Plate */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Placa del Vehículo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  placeholder="ABC-123"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-2xl font-black text-center tracking-[0.3em] placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all uppercase"
                />
              </div>

              {/* Vehicle type */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Tipo de Vehículo <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(({ value, label, icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        type === value
                          ? 'border-indigo-500 bg-indigo-600/20 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div>
                        <p className="font-bold text-sm leading-none">{label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client data */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">
                  Datos del Cliente
                  <span className="ml-2 text-gray-600 normal-case font-normal">(para factura)</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">👤 Nombre del cliente</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Consumidor Final"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">🪪 Cédula / NIT</label>
                    <input
                      type="text"
                      value={clientDoc}
                      onChange={e => setClientDoc(e.target.value)}
                      placeholder="999.999.999"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Selected spot indicator */}
              {selectedSpot && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Plaza seleccionada</p>
                    <p className="text-white font-black text-lg">{selectedSpot.spot_code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpotId(null)}
                    className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                  >
                    ✕ Quitar
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !plate.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black py-4 rounded-xl transition-all text-sm tracking-wide shadow-lg shadow-indigo-600/30"
              >
                {loading ? '⏳ Registrando...' : '🚗 Registrar Entrada'}
              </button>
            </form>
          </div>

          {/* ── RIGHT: SPOT MAP ── */}
          <div className="bg-[#1a1f2e] rounded-2xl border border-white/5 p-7 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mapa de Plazas</p>
                <p className="text-white/30 text-[10px] mt-0.5">Selecciona una plaza libre</p>
              </div>
              <button
                type="button"
                onClick={loadSpots}
                className="text-xs text-gray-500 hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                ↻ Actualizar
              </button>
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {[
                { label: 'Libre',    bg: '#052e16', border: '#16a34a', text: '#4ade80' },
                { label: 'Ocupada',  bg: '#3b0a0a', border: '#dc2626', text: '#f87171' },
                { label: 'Abonado',  bg: '#1e1b4b', border: '#6366f1', text: '#818cf8' },
              ].map(({ label, bg, border, text }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border" style={{ backgroundColor: bg, borderColor: border }} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-indigo-400 bg-indigo-400/20" />
                <span className="text-[10px] text-gray-500">Seleccionada</span>
              </div>
            </div>

            {loadingSpots ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
              </div>
            ) : noMap || spots.length === 0 ? (
              <div className="flex-1 flex items-center justify-center flex-col gap-3">
                <span className="text-4xl opacity-20">🅿️</span>
                <p className="text-white/30 text-sm text-center">
                  No hay mapa diseñado para esta sede.
                </p>
                <p className="text-white/20 text-xs text-center">
                  El administrador debe diseñar el mapa primero.<br />
                  Igual puedes registrar la entrada sin plaza.
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-72">
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${maxCol + 1}, 3rem)`, width: 'max-content' }}
                >
                  {Array.from({ length: maxRow + 1 }, (_, row) =>
                    Array.from({ length: maxCol + 1 }, (_, col) => {
                      const key = `${row}_${col}`;
                      const spot = spotMap[key];
                      if (!spot) return <div key={key} className="w-12 h-12" />;

                      if (spot.spot_type === 'BLOQUE') {
                        return (
                          <div key={key} className="w-12 h-12 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center">
                            <span className="text-white/10 text-sm">🧱</span>
                          </div>
                        );
                      }

                      const isSelected  = spot.id === spotId;
                      const isLibre     = spot.status === 'LIBRE';
                      const isClickable = isLibre || isSelected;
                      const cfg = STATUS_CFG[spot.status] || STATUS_CFG.LIBRE;

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!isClickable}
                          onClick={() => setSpotId(isSelected ? null : spot.id)}
                          title={
                            spot.status === 'OCUPADA'
                              ? `Ocupada: ${spot.occupied_plate}`
                              : spot.status === 'ABONADO'
                              ? `Abonado: ${spot.subscriber_name || ''}`
                              : spot.spot_code
                          }
                          className={`w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-400/25 scale-105 shadow-lg shadow-indigo-500/30'
                              : isLibre
                              ? 'hover:scale-105 hover:brightness-125 cursor-pointer'
                              : 'cursor-not-allowed opacity-80'
                          }`}
                          style={
                            isSelected
                              ? {}
                              : { backgroundColor: cfg.bg, borderColor: cfg.border }
                          }
                        >
                          <span
                            className="text-[8px] font-black uppercase tracking-widest leading-none"
                            style={{ color: isSelected ? '#a5b4fc' : cfg.text }}
                          >
                            {spot.spot_code}
                          </span>
                          {spot.status === 'OCUPADA' ? (
                            <span className="text-[6px] text-red-300/70 leading-none mt-0.5 max-w-full px-0.5 truncate">
                              {spot.occupied_plate}
                            </span>
                          ) : (
                            <span className="text-[10px] mt-0.5">
                              {spot.spot_type === 'CARRO'         ? '🚗'
                             : spot.spot_type === 'MOTO'          ? '🏍️'
                             : spot.spot_type === 'BICICLETA'     ? '🚲'
                             : spot.spot_type === 'CAMION'        ? '🚛'
                             : spot.spot_type === 'DISCAPACITADO' ? '♿'
                             : '🅿️'}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Spot stats */}
            {spots.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs">
                {[
                  { label: 'Libres',   count: spots.filter(s => s.status === 'LIBRE'   && s.spot_type !== 'BLOQUE').length, color: '#4ade80' },
                  { label: 'Ocupadas', count: spots.filter(s => s.status === 'OCUPADA' && s.spot_type !== 'BLOQUE').length, color: '#f87171' },
                  { label: 'Total',    count: spots.filter(s => s.spot_type !== 'BLOQUE').length,                          color: '#9ca3af' },
                ].map(({ label, count, color }) => (
                  <div key={label}>
                    <span className="font-black" style={{ color }}>{count}</span>
                    <span className="text-gray-600 ml-1">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
