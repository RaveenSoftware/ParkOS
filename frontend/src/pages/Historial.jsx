import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatMinutes(mins) {
  if (!mins || mins < 0) mins = 0;
  if (mins < 60) return `${Math.floor(mins)} min`;
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
}

const TYPE_ICON = { CARRO: '🚗', MOTO: '🏍️', BICICLETA: '🚲', CAMION: '🚛' };

export default function Historial() {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState('');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Historial</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tickets.length} vehículo{tickets.length !== 1 ? 's' : ''} registrados ·
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
            <div key={i} className="h-20 bg-[#1a1f2e] rounded-2xl animate-pulse border border-white/5" />
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
              className="bg-[#1a1f2e] border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-5 hover:border-white/10 transition-all"
            >
              <span className="text-3xl shrink-0">{TYPE_ICON[ticket.vehicle_type] ?? '🚗'}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white font-black text-lg tracking-widest">{ticket.plate}</span>
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded font-bold">{ticket.vehicle_type}</span>
                  {ticket.invoice_num && (
                    <span className="text-[10px] text-indigo-400/70 font-mono">{ticket.invoice_num.substring(0, 20)}…</span>
                  )}
                </div>

                <div className="flex gap-4 mt-1 flex-wrap">
                  {ticket.client_name && (
                    <span className="text-gray-400 text-xs">👤 {ticket.client_name}</span>
                  )}
                  {ticket.client_doc && (
                    <span className="text-gray-400 text-xs">🪪 {ticket.client_doc}</span>
                  )}
                  <span className="text-gray-600 text-xs">
                    ⏱ {formatMinutes(ticket.minutes_parked)}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {ticket.exit_at
                      ? new Date(ticket.exit_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-emerald-400 font-black text-lg">{formatCOP(ticket.amount)}</p>
                <p className="text-gray-600 text-xs">Ticket #{ticket.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
