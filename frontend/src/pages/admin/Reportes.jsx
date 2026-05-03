import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
function formatDuration(minutes) {
  if (!minutes) return '—';
  const totalSecs = Math.round(Number(minutes) * 60);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length ? parts.join(' ') : '< 1m';
}
function toInputDate(date) {
  return date.toLocaleDateString('en-CA');
}

const TYPE_LABELS = { CARRO: '🚗 Auto', MOTO: '🏍️ Moto', BICICLETA: '🚲 Bici', CAMION: '🚛 Camión' };

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <p className="text-white/40 text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminReportes() {
  const [tickets, setTickets] = useState([]);
  const [sedes, setSedes]     = useState([]);
  const [loading, setLoading] = useState(false);

  // Rango por defecto: último año completo para no perder datos históricos
  const today = new Date();
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const [filters, setFilters] = useState({
    sedeId: '',
    from: toInputDate(yearAgo),
    to:   toInputDate(today),
  });

  useEffect(() => { api.get('/sedes').then(setSedes).catch(console.error); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.sedeId) params.append('sedeId', filters.sedeId);
      if (filters.from)   params.append('from', filters.from);
      if (filters.to)     params.append('to',   filters.to);
      const data = await api.get(`/dashboard/reportes?${params.toString()}`);
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = tickets.reduce((a, t) => a + Number(t.amount || 0), 0);
  const avgRevenue   = tickets.length ? totalRevenue / tickets.length : 0;
  const maxRevenue   = tickets.length ? Math.max(...tickets.map(t => Number(t.amount || 0))) : 0;

  // Group by vehicle type
  const byType = tickets.reduce((acc, t) => {
    const k = t.type || t.vehicle_type || 'OTRO';
    if (!acc[k]) acc[k] = { count: 0, revenue: 0 };
    acc[k].count++;
    acc[k].revenue += Number(t.amount || 0);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Reportes Financieros</h1>
        <p className="text-white/30 text-sm mt-1">Historial completo de tickets cobrados — todas tus sedes</p>
      </div>

      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-44">
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Sede</label>
          <select value={filters.sedeId} onChange={e => setFilters(f => ({ ...f, sedeId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
            <option value="" className="bg-[#111]">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Desde</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Hasta</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" />
        </div>
        <button onClick={load} disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
          {loading ? '⏳ Buscando...' : '🔍 Aplicar Filtros'}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Recaudado"    value={formatCOP(totalRevenue)} color="text-emerald-400" />
        <StatCard icon="🎫" label="Tickets Cerrados"   value={tickets.length}          color="text-white" />
        <StatCard icon="📊" label="Promedio/Ticket"    value={formatCOP(avgRevenue)}   color="text-indigo-400" />
        <StatCard icon="🏆" label="Ticket Más Alto"    value={formatCOP(maxRevenue)}   color="text-amber-400" />
      </div>

      {/* Breakdown por tipo de vehículo */}
      {Object.keys(byType).length > 0 && (
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-4">Desglose por Tipo de Vehículo</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(byType).map(([type, { count, revenue }]) => (
              <div key={type} className="bg-white/5 rounded-xl p-4">
                <p className="text-sm font-bold text-white">{TYPE_LABELS[type] || type}</p>
                <p className="text-emerald-400 font-black text-lg mt-1">{formatCOP(revenue)}</p>
                <p className="text-white/30 text-xs mt-0.5">{count} vehículo{count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-white font-bold text-sm">Detalle de Transacciones</p>
            <span className="text-white/20 text-xs">{tickets.length} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {['#', 'Placa', 'Tipo', 'Sede', 'Entrada', 'Salida', 'Duración', 'Monto', 'Operador'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3"><span className="text-white/20 text-xs font-mono">#{t.id}</span></td>
                    <td className="px-4 py-3"><span className="text-white font-black text-xs tracking-widest">{t.plate}</span></td>
                    <td className="px-4 py-3"><span className="text-white/50 text-xs">{TYPE_LABELS[t.type || t.vehicle_type] || (t.type || t.vehicle_type)}</span></td>
                    <td className="px-4 py-3"><span className="text-indigo-400 text-xs">{t.sede_name}</span></td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400/70 text-xs font-mono whitespace-nowrap">
                        {new Date(t.entry_at).toLocaleString('es-CO', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-400/70 text-xs font-mono whitespace-nowrap">
                        {t.exit_at ? new Date(t.exit_at).toLocaleString('es-CO', { hour12: true, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className="text-white/50 text-xs">{formatDuration(t.minutes_parked)}</span></td>
                    <td className="px-4 py-3"><span className="text-emerald-400 font-black text-xs">{formatCOP(t.amount)}</span></td>
                    <td className="px-4 py-3"><span className="text-white/30 text-xs">{t.created_by_name || '—'}</span></td>
                  </tr>
                ))}
                {!tickets.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <p className="text-4xl mb-3">📊</p>
                      <p className="text-white/20 text-sm">No hay registros para el período seleccionado.</p>
                      <p className="text-white/10 text-xs mt-1">Ajusta el rango de fechas o cambia la sede.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
