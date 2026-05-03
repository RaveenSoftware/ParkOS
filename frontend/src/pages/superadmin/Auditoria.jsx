import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const m = Math.round(Number(minutes));
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const TYPE_LABELS = {
  CARRO: 'Auto',
  MOTO: 'Moto',
  CAMION: 'Camión',
  BICICLETA: 'Bici',
};

export default function SuperAdminAuditoria() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/saas/audit-log');
      setLog(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = log.filter(t => {
    const matchSearch =
      t.plate.toLowerCase().includes(search.toLowerCase()) ||
      (t.sede_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.tenant_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const matchDate = !filterDate || new Date(t.entry_at).toLocaleDateString('en-CA') === filterDate;
    return matchSearch && matchStatus && matchDate;
  });

  const totalRevenue = filtered
    .filter(t => t.status === 'CERRADO')
    .reduce((a, t) => a + Number(t.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Log de Auditoría</h1>
          <p className="text-white/30 text-sm mt-1">Registro global de los últimos 200 movimientos del sistema</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* KPIs del filtro actual */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Registros</p>
          <p className="text-2xl font-black text-white">{filtered.length}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Abiertos</p>
          <p className="text-2xl font-black text-blue-400">{filtered.filter(t => t.status === 'ABIERTO').length}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Recaudado (filtro)</p>
          <p className="text-xl font-black text-green-400">{formatCOP(totalRevenue)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Placa, sede o empresa..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
        </div>
        <div className="flex gap-2">
          {[['ALL', 'Todos'], ['ABIERTO', 'Abiertos'], ['CERRADO', 'Cerrados']].map(([v, l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === v ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
              {l}
            </button>
          ))}
        </div>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/60 text-sm focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" />
        {filterDate && (
          <button onClick={() => setFilterDate('')}
            className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/30 hover:text-white text-xs transition-all">
            Limpiar fecha
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['#', 'Placa', 'Tipo', 'Empresa', 'Sede', 'Entrada', 'Salida', 'Duración', 'Monto', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-white/30 text-xs font-medium uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-white/20 text-xs font-mono">#{t.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white font-black text-xs tracking-widest font-mono">{t.plate}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white/50 text-xs">{TYPE_LABELS[t.type] || t.type}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-blue-400 text-xs font-medium">{t.tenant_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-white/60 text-xs">{t.sede_name || '—'}</span>
                    </td>
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
                    <td className="px-4 py-3.5">
                      <span className="text-white/50 text-xs">{formatDuration(t.minutes_parked)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-bold ${t.amount ? 'text-green-400' : 'text-white/20'}`}>
                        {t.amount ? formatCOP(t.amount) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold ${
                        t.status === 'ABIERTO'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'ABIERTO' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-white/20 text-sm">No hay registros para los filtros aplicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/20 text-xs">{filtered.length} registros</span>
            <span className="text-white/20 text-xs">Mostrando últimos 200 eventos globales</span>
          </div>
        </div>
      )}
    </div>
  );
}
