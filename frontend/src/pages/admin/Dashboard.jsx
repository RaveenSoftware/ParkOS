import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function RevenueChart({ trend = [] }) {
  if (!trend.length) return (
    <div className="flex items-end gap-2 h-28 text-white/20 text-xs">Sin datos de ingresos aún.</div>
  );
  const max = Math.max(...trend.map(t => t.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {trend.map((t, i) => {
        const pct = (t.revenue / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {formatCOP(t.revenue)}
            </div>
            <div className="w-full rounded-t-sm bg-white/5 relative overflow-hidden" style={{ height: '96px' }}>
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm transition-all duration-700"
                style={{ height: `${pct}%` }} />
            </div>
            <span className="text-white/30 text-[10px] font-mono">{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut Chart (SVG puro) para desglose diario
function DonutChart({ data = [] }) {
  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ec4899'];
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let cumulative = 0;
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6 h-28">
      <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90 shrink-0">
        {data.map((d, i) => {
          const pct = d.count / total;
          const dash = circ * pct;
          const offset = circ * (1 - cumulative);
          cumulative += pct;
          return (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none" stroke={COLORS[i % COLORS.length]}
              strokeWidth="16" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-circ * (cumulative - pct) + circ}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
        {data.length === 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth="16" />
        )}
      </svg>
      <div className="flex flex-col gap-2 w-full">
        {data.length === 0 && <span className="text-white/20 text-xs">No hay entradas hoy</span>}
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-white/60 text-xs capitalize">{d.type.toLowerCase()}</span>
            <span className="text-white font-bold text-xs ml-auto">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/tenant')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('parkos_user') || '{}'); } catch { return {}; } })();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
        <p className="text-white/30 text-sm">Cargando tu dashboard...</p>
      </div>
    </div>
  );

  const { kpis, trend, todayBreakdown, sedes, plan } = data || {};
  const sedesUsadas = Number(plan?.used_sedes || 0);
  const sedesMax    = Number(plan?.max_sedes || 1);
  const usersUsados = Number(plan?.used_users || 0);
  const usersMax    = Number(plan?.max_users || 1);
  const sedesPct    = Math.min((sedesUsadas / sedesMax) * 100, 100);
  const usersPct    = Math.min((usersUsados / usersMax) * 100, 100);

  const STATUS_COLOR = { ACTIVE: 'text-green-400', TRIAL: 'text-blue-400', PAST_DUE: 'text-yellow-400', SUSPENDED: 'text-red-400' };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Dashboard Corporativo</h1>
          <p className="text-white/30 text-sm mt-1">Bienvenido, <span className="text-white">{user.name}</span> — resumen global de tu empresa</p>
        </div>
        <div className="sm:text-right">
          <p className="text-white/20 text-xs uppercase tracking-widest">Hoy</p>
          <p className="text-white/50 text-xs font-mono">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Alerta si el plan está venciendo o suspendido */}
      {plan?.subscription_status === 'PAST_DUE' && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-yellow-400 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-yellow-400 text-sm"><span className="font-bold">Pago vencido.</span> Contacta a soporte para reactivar tu suscripción.</p>
        </div>
      )}
      {plan?.subscription_status === 'SUSPENDED' && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <p className="text-red-400 text-sm"><span className="font-bold">Cuenta suspendida.</span> Comunícate con tu proveedor del servicio.</p>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Recaudación Hoy"   value={formatCOP(kpis?.revenueToday)}   sub={`${kpis?.entriesToday || 0} entradas hoy`}      color="text-green-400" />
        <KpiCard label="Vehículos Dentro"  value={kpis?.vehiclesInside || 0}        sub="Tickets abiertos ahora"                          color="text-blue-400"  />
        <KpiCard label="Sedes Activas"     value={`${kpis?.activeSedes || 0} / ${kpis?.totalSedes || 0}`} sub="Sedes operativas"          color="text-white"     />
        <KpiCard label="Personal Activo"   value={kpis?.activeUsers || 0}           sub="Admins y cajeros"                                color="text-white"     />
      </div>

      {/* Gráfica + Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica 7 días o Donut Diario */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold text-sm">
                {(trend?.length || 0) <= 1 ? 'Distribución de Vehículos Hoy' : 'Ingresos — últimos 7 días'}
              </h3>
              <p className="text-white/30 text-xs mt-0.5">
                {(trend?.length || 0) <= 1 ? 'Desglose por tipo de vehículo (requiere más días para tendencia)' : 'Suma de todas tus sedes'}
              </p>
            </div>
            {(trend?.length || 0) > 1 && <span className="text-white/20 text-xs font-mono uppercase tracking-widest">COP</span>}
          </div>
          {(trend?.length || 0) <= 1 
            ? <DonutChart data={todayBreakdown || []} /> 
            : <RevenueChart trend={trend} />
          }
        </div>

        {/* Mi Plan */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Mi Plan</h3>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-black text-lg">{plan?.plan_name || '—'}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_COLOR[plan?.subscription_status] || 'text-white/40'}`}>
                {plan?.subscription_status}
              </span>
            </div>
            <p className="text-white/30 text-xs mt-1">{formatCOP(plan?.plan_price)}/mes</p>
          </div>

          {/* Sedes */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40">Sedes utilizadas</span>
              <span className={`font-bold ${sedesPct >= 100 ? 'text-red-400' : sedesPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                {sedesUsadas} / {sedesMax}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${sedesPct >= 100 ? 'bg-red-500' : sedesPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${sedesPct}%` }} />
            </div>
          </div>

          {/* Usuarios */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40">Usuarios registrados</span>
              <span className={`font-bold ${usersPct >= 100 ? 'text-red-400' : usersPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                {usersUsados} / {usersMax}
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usersPct >= 100 ? 'bg-red-500' : usersPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${usersPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla resumen por sede */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-sm">Estado por Sede</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Sede', 'Capacidad', 'Dentro Ahora', 'Entradas Hoy', 'Recaudado Hoy', 'Estado'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sedes || []).map(s => {
              const inside = Number(s.vehicles_inside || 0);
              const cap    = Number(s.capacity || 1);
              const pct    = Math.min((inside / cap) * 100, 100);
              return (
                <tr key={s.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!s.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3.5"><p className="text-white font-semibold">{s.name}</p></td>
                  <td className="px-5 py-3.5"><span className="text-white/50 text-xs">{s.capacity} veh.</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{inside}</span>
                      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className="text-white/50 text-xs">{s.entries_today}</span></td>
                  <td className="px-5 py-3.5"><span className="text-green-400 font-bold text-xs">{formatCOP(s.revenue_today)}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      {s.is_active ? 'Operativa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!(sedes?.length) && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-white/20 text-sm">No tienes sedes registradas aún.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
