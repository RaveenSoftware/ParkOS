import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
function formatDuration(minutes) {
  if (!minutes) return '—';
  const m = Math.round(Number(minutes));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
function toInputDate(date) {
  return date.toLocaleDateString('en-CA');
}

const TYPE_LABELS = { CARRO: 'Auto', MOTO: 'Moto', BICICLETA: 'Bici', CAMION: 'Camión' };

export default function AdminReportes() {
  const [tickets, setTickets] = useState([]);
  const [sedes, setSedes]     = useState([]);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const [filters, setFilters] = useState({
    sedeId: '', from: toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: toInputDate(today),
  });

  // Cargar sedes al montar
  useEffect(() => { api.get('/sedes').then(setSedes).catch(console.error); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.sedeId) params.append('sedeId', filters.sedeId);
      if (filters.from)   params.append('from', filters.from);
      if (filters.to)     params.append('to', filters.to);
      const data = await api.get(`/dashboard/reportes?${params.toString()}`);
      setTickets(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = tickets.reduce((a, t) => a + Number(t.amount || 0), 0);
  const avgRevenue   = tickets.length ? totalRevenue / tickets.length : 0;

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Reportes Financieros</h1>
        <p className="text-white/30 text-sm mt-1">Historial de tickets cerrados — solo tus sedes</p>
      </div>

      {/* Filtros */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-36">
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Sede</label>
          <select value={filters.sedeId} onChange={e => setFilters(f => ({ ...f, sedeId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
            <option value="" className="bg-[#111]">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Desde</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Hasta</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
        </div>
        <button onClick={load} disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
          {loading ? 'Buscando...' : 'Aplicar Filtros'}
        </button>
      </div>

      {/* KPIs del período */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Recaudado', value: formatCOP(totalRevenue), color: 'text-green-400' },
          { label: 'Tickets Cerrados', value: tickets.length, color: 'text-white' },
          { label: 'Promedio por Ticket', value: formatCOP(avgRevenue), color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" /></div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['#','Placa','Tipo','Sede','Entrada','Salida','Duración','Monto','Operador'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-white/30 text-xs font-medium uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5"><span className="text-white/20 text-xs font-mono">#{t.id}</span></td>
                    <td className="px-4 py-3.5"><span className="text-white font-black text-xs tracking-widest font-mono">{t.plate}</span></td>
                    <td className="px-4 py-3.5"><span className="text-white/50 text-xs">{TYPE_LABELS[t.type] || t.type}</span></td>
                    <td className="px-4 py-3.5"><span className="text-blue-400 text-xs">{t.sede_name}</span></td>
                    <td className="px-4 py-3.5">
                      <span className="text-white/50 text-xs font-mono whitespace-nowrap">
                        {new Date(t.entry_at).toLocaleString('es-CO', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white/30 text-xs font-mono whitespace-nowrap">
                        {t.exit_at ? new Date(t.exit_at).toLocaleString('es-CO', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-white/50 text-xs">{formatDuration(t.minutes_parked)}</span></td>
                    <td className="px-4 py-3.5"><span className="text-green-400 font-bold text-xs">{formatCOP(t.amount)}</span></td>
                    <td className="px-4 py-3.5"><span className="text-white/30 text-xs">{t.created_by_name || '—'}</span></td>
                  </tr>
                ))}
                {!tickets.length && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-white/20 text-sm">No hay registros para el período seleccionado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5">
            <span className="text-white/20 text-xs">{tickets.length} registros</span>
          </div>
        </div>
      )}
    </div>
  );
}
