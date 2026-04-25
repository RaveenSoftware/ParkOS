import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function KpiCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-2xl font-black leading-none ${color}`}>{value}</p>
    </div>
  );
}

function TrendChart({ trend = [] }) {
  if (!trend.length) return (
    <div className="flex items-center justify-center h-48 text-white/20 text-sm">Sin datos financieros.</div>
  );
  
  const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1);

  return (
    <div className="flex items-end gap-1 h-48 w-full overflow-x-auto pb-4 pt-2">
      {trend.map((t, i) => {
        const incomePct = (t.income / maxVal) * 100;
        const expensePct = (t.expense / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative min-w-[20px] md:min-w-[30px]">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-[10px] px-2 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <p className="text-green-400 font-bold">Ingresos: {formatCOP(t.income)}</p>
              <p className="text-red-400 font-bold">Egresos: {formatCOP(t.expense)}</p>
            </div>
            
            <div className="flex items-end gap-[1px] w-full h-full relative px-[1px]">
              <div className="w-1/2 bg-green-500 rounded-t-sm transition-all duration-500" style={{ height: `${incomePct}%` }} />
              <div className="w-1/2 bg-red-500 rounded-t-sm transition-all duration-500" style={{ height: `${expensePct}%` }} />
            </div>
            
            <span className="text-white/30 text-[8px] md:text-[9px] font-mono whitespace-nowrap mt-1">{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Finanzas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/finances')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
        <p className="text-white/30 text-sm">Cargando módulo de finanzas...</p>
      </div>
    </div>
  );

  const { kpis, expenses, trend } = data || {};
  const isProfit = (kpis?.profit || 0) >= 0;

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Finanzas y Egresos</h1>
          <p className="text-white/30 text-sm mt-1">Visión general del flujo de caja corporativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Ingresos Totales (Tickets)" value={formatCOP(kpis?.income)} color="text-green-400" />
        <KpiCard label="Egresos Totales (Caja)" value={formatCOP(kpis?.expense)} color="text-red-400" />
        <KpiCard label="Beneficio Neto (Ganancia)" value={formatCOP(kpis?.profit)} color={isProfit ? 'text-blue-400' : 'text-orange-400'} />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-white font-bold text-sm">Tendencia a 30 Días</h3>
          <p className="text-white/30 text-xs">Comparativa diaria de ingresos (verde) vs egresos (rojo)</p>
        </div>
        <TrendChart trend={trend} />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-sm">Historial de Egresos</h3>
          <p className="text-white/30 text-xs">Retiros de caja realizados por los cajeros en todas las sedes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 bg-black/20">
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Fecha y Hora</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Sede</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Cajero</th>
                <th className="text-left px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Descripción</th>
                <th className="text-right px-5 py-3 text-white/30 text-xs font-medium uppercase tracking-widest">Monto</th>
              </tr>
            </thead>
            <tbody>
              {(expenses || []).map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white/70 text-xs">{new Date(e.created_at).toLocaleString('es-CO')}</td>
                  <td className="px-5 py-3 text-white/90 text-xs font-semibold">{e.sede_name}</td>
                  <td className="px-5 py-3 text-white/70 text-xs">{e.user_name}</td>
                  <td className="px-5 py-3 text-white text-xs">{e.description}</td>
                  <td className="px-5 py-3 text-red-400 font-bold text-xs text-right">-{formatCOP(e.amount)}</td>
                </tr>
              ))}
              {!(expenses?.length) && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-white/20 text-sm">No hay egresos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
