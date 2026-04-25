import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

// ── Mini Spark Line Chart (SVG puro, sin dependencias)
function SparkLine({ data = [], color = '#3b82f6', height = 40 }) {
  if (!data || data.length < 2) return <div className="h-10 flex items-end text-xs text-white/20">Sin datos</div>;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  const areaPath = `M${pts.join('L')} L${w},${h} L0,${h} Z`;
  const linePath = `M${pts.join('L')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── MRR Bar Chart (SVG puro)
function MrrBarChart({ trend = [] }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="flex items-end gap-2 h-32 text-white/20 text-xs">
        No hay datos de tendencia aún.
      </div>
    );
  }
  const max = Math.max(...trend.map(t => t.mrr), 1);
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {trend.map((t, i) => {
        const pct = (t.mrr / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-sm bg-blue-500/20 relative overflow-hidden" style={{ height: '96px' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-sm transition-all duration-700"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-white/30 text-[10px] font-mono">{t.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut Chart (SVG puro)
function DonutChart({ data = [] }) {
  const COLORS = ['#3b82f6', '#22c55e', '#eab308'];
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let cumulative = 0;
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
        {data.map((d, i) => {
          const pct = d.count / total;
          const dash = circ * pct;
          const offset = circ * (1 - cumulative);
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-circ * (cumulative - pct) + circ}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
        {data.length === 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff10" strokeWidth="16" />
        )}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-white/60 text-xs">{d.plan}</span>
            <span className="text-white font-bold text-xs ml-auto pl-3">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card
function KpiCard({ label, value, sub, color = '#3b82f6', trend, tooltip }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors relative group">
      <div className="flex items-center gap-2">
        <p className="text-white/40 text-xs font-medium uppercase tracking-widest">{label}</p>
        {tooltip && (
          <div className="w-3 h-3 rounded-full border border-white/20 text-white/40 flex items-center justify-center text-[8px] cursor-help">
            ?
            <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-white/10 p-2 rounded text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      {sub && <div className="text-white/30 text-xs">{sub}</div>}
      {trend && <SparkLine data={trend} color={color} height={32} />}
    </div>
  );
}

// ── Status Badge
const STATUS_STYLE = {
  ACTIVE: 'bg-green-500/10 text-green-400 border border-green-500/20',
  TRIAL: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PAST_DUE: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/saas/metrics')
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
          <p className="text-white/30 text-sm">Cargando métricas globales...</p>
        </div>
      </div>
    );
  }

  const mrrTrendValues = metrics?.mrrTrend?.map(t => t.mrr) || [];
  const hasPastDue = (metrics?.tenants?.pastDue || 0) > 0;
  const hasSuspended = (metrics?.tenants?.suspended || 0) > 0;

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Centro de Control</h1>
          <p className="text-white/30 text-sm mt-1">Visión ejecutiva global de la plataforma ParkOS SaaS</p>
        </div>
        <div className="text-right">
          <p className="text-white/20 text-xs uppercase tracking-widest">Actualizado</p>
          <p className="text-white/50 text-xs font-mono">{new Date().toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Alertas críticas */}
      {(hasPastDue || hasSuspended) && (
        <div className="space-y-2">
          {hasPastDue && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-yellow-400 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-yellow-400 text-sm">
                <span className="font-bold">{metrics.tenants.pastDue} cliente(s)</span> con pago vencido (PAST_DUE). Requieren acción inmediata.
              </p>
            </div>
          )}
          {hasSuspended && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <p className="text-red-400 text-sm">
                <span className="font-bold">{metrics.tenants.suspended} cliente(s)</span> actualmente suspendidos o inactivos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="MRR Activo"
          value={formatCOP(metrics?.mrr)}
          sub={
            <div className="flex items-center gap-2">
              <span>Recurrente real</span>
              {metrics?.mrrTrial > 0 && (
                <span className="text-blue-400">+{formatCOP(metrics?.mrrTrial)} en trial</span>
              )}
            </div>
          }
          tooltip="Ingreso Mensual Recurrente. Solo suma los clientes en estado ACTIVE. Los clientes en TRIAL se muestran por separado."
          color="#3b82f6"
          trend={mrrTrendValues}
        />
        <KpiCard
          label="ARR Proyectado"
          value={formatCOP(metrics?.arr)}
          sub={`${metrics?.tenants?.active || 0} clientes activos`}
          color="#22c55e"
        />
        <KpiCard
          label="Sedes Activas"
          value={metrics?.sedes?.active || 0}
          sub={`Cap. total: ${(metrics?.sedes?.totalCapacity || 0).toLocaleString()} vehículos`}
          color="#3b82f6"
        />
        <KpiCard
          label="Usuarios Globales"
          value={metrics?.activeUsers || 0}
          sub="Admins y cajeros activos"
          color="#22c55e"
        />
      </div>

      {/* Fila: Recaudación hoy + Estado de tenants */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Recaudación Hoy"
          value={formatCOP(metrics?.today?.revenueToday)}
          sub={`${metrics?.today?.exitsToday || 0} salidas registradas`}
          color="#22c55e"
        />
        <KpiCard
          label="Clientes Activos"
          value={metrics?.tenants?.active || 0}
          sub={`De ${metrics?.tenants?.total || 0} totales`}
          color="#22c55e"
        />
        <KpiCard
          label="En Trial"
          value={metrics?.tenants?.trial || 0}
          sub="Evaluando la plataforma"
          color="#3b82f6"
        />
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex flex-col gap-2 hover:border-white/20 transition-colors">
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Estado Tenants</p>
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-xs">Activos</span>
              <span className="text-white font-bold text-sm">{metrics?.tenants?.active || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 text-xs">Trial</span>
              <span className="text-white font-bold text-sm">{metrics?.tenants?.trial || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400 text-xs">Past Due</span>
              <span className="text-white font-bold text-sm">{metrics?.tenants?.pastDue || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-xs">Suspendidos</span>
              <span className="text-white font-bold text-sm">{metrics?.tenants?.suspended || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila: MRR Tendencia + Distribución por Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Tendencia */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold text-sm">Tendencia MRR</h3>
              <p className="text-white/30 text-xs mt-0.5">Últimos 6 meses</p>
            </div>
            <span className="text-white/20 text-xs font-mono uppercase tracking-widest">COP</span>
          </div>
          <MrrBarChart trend={metrics?.mrrTrend} />
        </div>

        {/* Distribución por Plan */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-bold text-sm mb-1">Por Plan</h3>
          <p className="text-white/30 text-xs mb-6">Distribución de clientes</p>
          <DonutChart data={metrics?.planDistribution || []} />
        </div>
      </div>

      {/* Últimas altas */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-bold text-sm">Últimas Altas</h3>
          <span className="text-white/20 text-xs">5 más recientes</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Empresa</th>
              <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Plan</th>
              <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Estado</th>
              <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Alta</th>
            </tr>
          </thead>
          <tbody>
            {(metrics?.recentTenants || []).map(t => (
              <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.contact_email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-400 font-semibold text-xs">{t.plan_name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATUS_STYLE[t.subscription_status] || ''}`}>
                    {t.subscription_status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white/30 text-xs font-mono">
                    {new Date(t.created_at).toLocaleDateString('es-CO')}
                  </span>
                </td>
              </tr>
            ))}
            {(metrics?.recentTenants || []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-white/20 text-sm">
                  No hay tenants registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
