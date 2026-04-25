import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

export default function SuperAdminSedes() {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/saas/sedes');
      setSedes(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = sedes.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.tenant_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = sedes.filter(s => s.is_active).length;
  const totalCapacity = sedes.reduce((a, s) => a + Number(s.capacity || 0), 0);
  const totalTicketsOpen = sedes.reduce((a, s) => a + Number(s.tickets_open || 0), 0);
  const totalRevenueToday = sedes.reduce((a, s) => a + Number(s.revenue_today || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Sedes Globales</h1>
        <p className="text-white/30 text-sm mt-1">Vista global de todos los parqueaderos en la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sedes Activas', value: totalActive, sub: `de ${sedes.length} totales`, color: 'text-green-400' },
          { label: 'Capacidad Total', value: `${totalCapacity.toLocaleString()} veh.`, sub: 'en toda la plataforma', color: 'text-white' },
          { label: 'Vehículos Dentro', value: totalTicketsOpen, sub: 'tickets abiertos ahora', color: 'text-blue-400' },
          { label: 'Recaudado Hoy', value: formatCOP(totalRevenueToday), sub: 'suma de todas las sedes', color: 'text-green-400' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-xl font-black leading-none ${k.color}`}>{k.value}</p>
            <p className="text-white/20 text-xs mt-1.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar sede, empresa o dirección..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Sede', 'Empresa', 'Dirección', 'Capacidad', 'Ocupación Ahora', 'Recaudado Hoy', 'Entradas Hoy', 'Estado'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-white/30 text-xs font-medium uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const ticketsOpen = Number(s.tickets_open || 0);
                const cap = Number(s.capacity || 1);
                const pct = Math.min((ticketsOpen / cap) * 100, 100);
                const occupancyColor = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500';
                return (
                  <tr key={s.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!s.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-white font-semibold">{s.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-blue-400 text-xs font-medium">{s.tenant_name || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white/40 text-xs">{s.address || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white font-bold text-xs">{s.capacity}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs w-6">{ticketsOpen}</span>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${occupancyColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-white/30 text-[10px]">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-400 text-xs font-bold">{formatCOP(s.revenue_today)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white/50 text-xs">{s.entries_today}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`w-2 h-2 rounded-full inline-block ${s.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className={`ml-1.5 text-xs ${s.is_active ? 'text-green-400' : 'text-red-400'}`}>{s.is_active ? 'Activa' : 'Inactiva'}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-white/20 text-sm">No hay sedes para mostrar.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-white/5">
            <span className="text-white/20 text-xs">{filtered.length} de {sedes.length} sedes</span>
          </div>
        </div>
      )}
    </div>
  );
}
