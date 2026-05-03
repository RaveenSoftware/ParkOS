import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatDuration(mins) {
  if (!mins || mins < 0) mins = 0;
  const totalSecs = Math.floor(mins * 60);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

const TYPE_ICON = { CARRO: '🚗', MOTO: '🏍️', BICICLETA: '🚲', CAMION: '🚛' };
const TYPE_COLOR = { CARRO: '#6366f1', MOTO: '#f59e0b', BICICLETA: '#10b981', CAMION: '#ef4444' };

export default function Historial() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/tickets/history');
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t =>
    t.plate.toLowerCase().includes(search.toLowerCase()) ||
    (t.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.client_doc  || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = tickets.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Historial</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tickets.length} registro{tickets.length !== 1 ? 's' : ''} ·
            <span className="text-emerald-400 font-bold ml-1">{formatCOP(totalRevenue)} recaudados</span>
          </p>
        </div>
        <button
          onClick={load}
          className="bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition-all border border-white/10"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por placa, nombre o cédula..."
        className="w-full max-w-sm bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-[#1a1f2e] rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <p className="text-5xl mb-4">📋</p>
          <p className="font-bold text-gray-400">Sin registros</p>
          <p className="text-sm mt-1">El historial aparecerá aquí cuando se cobren salidas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <div
              key={ticket.id}
              className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
            >
              {/* Top bar with vehicle info */}
              <div className="flex items-center gap-4 px-5 py-3 border-b border-white/5"
                style={{ borderLeftWidth: 4, borderLeftColor: TYPE_COLOR[ticket.vehicle_type] || '#6b7280', borderLeftStyle: 'solid' }}>
                <span className="text-2xl shrink-0">{TYPE_ICON[ticket.vehicle_type] ?? '🚗'}</span>
                <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                  <span className="text-white font-black text-xl tracking-widest">{ticket.plate}</span>
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-bold">{ticket.vehicle_type}</span>
                  {ticket.spot_code && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
                      🅿️ {ticket.spot_code}
                    </span>
                  )}
                  {ticket.client_name && (
                    <span className="text-xs text-gray-400">👤 {ticket.client_name}</span>
                  )}
                  {ticket.client_doc && (
                    <span className="text-xs text-gray-500">🪪 {ticket.client_doc}</span>
                  )}
                </div>
                <span className="text-gray-500 text-xs shrink-0">Ticket #{ticket.id}</span>
              </div>

              {/* Timeline: Entry → Exit → Duration → Amount */}
              <div className="grid grid-cols-4 divide-x divide-white/5">
                {/* Entry */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-1 flex items-center gap-1">
                    <span>▶</span> Entrada
                  </p>
                  <p className="text-white text-xs font-semibold leading-snug">{fmtDateTime(ticket.entry_at)}</p>
                </div>

                {/* Exit */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1 flex items-center gap-1">
                    <span>■</span> Salida
                  </p>
                  <p className="text-white text-xs font-semibold leading-snug">{fmtDateTime(ticket.exit_at)}</p>
                </div>

                {/* Duration */}
                <div className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1">
                    <span>⏱</span> Tiempo
                  </p>
                  <p className="text-white text-xs font-semibold">{formatDuration(ticket.minutes_parked)}</p>
                </div>

                {/* Amount */}
                <div className="px-4 py-3 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center justify-end gap-1">
                    <span>💰</span> Cobrado
                  </p>
                  <p className="text-emerald-400 font-black text-base">{formatCOP(ticket.amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
