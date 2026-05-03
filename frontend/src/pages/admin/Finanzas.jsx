import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function KpiCard({ label, value, sub, color, icon, bg }) {
  return (
    <div className={`rounded-2xl p-6 border ${bg || 'bg-[#1a1f2e] border-white/5'} hover:border-white/10 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-white/60 text-sm font-semibold mt-2">{label}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TrendChart({ trend = [] }) {
  if (!trend.length) return (
    <div className="flex items-center justify-center h-48 text-white/20 text-sm flex-col gap-2">
      <span className="text-3xl opacity-30">📈</span>
      Sin datos para el período.
    </div>
  );

  const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1);

  return (
    <div className="flex items-end gap-1 h-52 w-full overflow-x-auto pb-6 pt-2">
      {trend.map((t, i) => {
        const incomePct  = Math.max((t.income  / maxVal) * 100, t.income  > 0 ? 2 : 0);
        const expensePct = Math.max((t.expense / maxVal) * 100, t.expense > 0 ? 2 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative min-w-[18px]">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d1117] border border-white/10 text-[10px] px-2 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl">
              <p className="text-white/50 font-bold mb-1">{t.label}</p>
              <p className="text-emerald-400 font-bold">Ing: {formatCOP(t.income)}</p>
              {t.expense > 0 && <p className="text-red-400 font-bold">Egr: {formatCOP(t.expense)}</p>}
            </div>

            <div className="flex items-end gap-[1px] w-full px-[1px]" style={{ height: '100%' }}>
              <div
                className="w-1/2 bg-emerald-500 rounded-t-sm transition-all duration-500 min-h-[2px]"
                style={{ height: `${incomePct}%` }}
              />
              <div
                className="w-1/2 bg-red-500 rounded-t-sm transition-all duration-500"
                style={{ height: `${expensePct}%` }}
              />
            </div>

            <span className="text-white/20 text-[7px] font-mono whitespace-nowrap mt-1">{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Finanzas() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/dashboard/finances')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
        <p className="text-white/30 text-sm">Cargando módulo de finanzas...</p>
      </div>
    </div>
  );

  const { kpis, expenses, trend } = data || {};
  const income  = kpis?.income  || 0;
  const expense = kpis?.expense || 0;
  const profit  = kpis?.profit  || (income - expense);
  const isProfit = profit >= 0;

  // Porcentaje de margen
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanzas</h1>
          <p className="text-white/30 text-sm mt-1">Flujo de caja corporativo — todas tus sedes y todo el tiempo</p>
        </div>
        <button onClick={load}
          className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 px-4 py-2 rounded-xl text-sm transition-all">
          ↻ Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="💰" label="Ingresos Totales" color="text-emerald-400"
          value={formatCOP(income)}
          sub="Total histórico de tickets cobrados"
          bg="bg-emerald-900/20 border-emerald-500/20"
        />
        <KpiCard
          icon="📤" label="Egresos Totales" color="text-red-400"
          value={formatCOP(expense)}
          sub="Retiros de caja registrados"
          bg="bg-red-900/20 border-red-500/20"
        />
        <KpiCard
          icon={isProfit ? '📈' : '📉'} label="Beneficio Neto" color={isProfit ? 'text-indigo-400' : 'text-orange-400'}
          value={formatCOP(profit)}
          sub={isProfit ? '✅ Operación rentable' : '⚠️ Operación en déficit'}
          bg={isProfit ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-orange-900/20 border-orange-500/20'}
        />
        <KpiCard
          icon="🎯" label="Margen Neto" color={isProfit ? 'text-amber-400' : 'text-orange-400'}
          value={`${margin}%`}
          sub="Porcentaje de ganancia sobre ingresos"
          bg="bg-amber-900/20 border-amber-500/20"
        />
      </div>

      {/* Gráfico de tendencia */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-bold">Tendencia Últimos 30 Días</h3>
            <p className="text-white/30 text-xs mt-0.5">Comparativa diaria: ingresos (verde) vs egresos (rojo)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Ingresos</span>
            <span className="flex items-center gap-1.5 text-white/50"><span className="w-3 h-3 rounded-sm bg-red-500" /> Egresos</span>
          </div>
        </div>
        <TrendChart trend={trend} />
      </div>

      {/* Resumen rápido si hay egresos */}
      {expenses?.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Total Egresos</p>
            <p className="text-red-400 font-black text-xl">{formatCOP(expense)}</p>
          </div>
          <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Nº de Retiros</p>
            <p className="text-white font-black text-xl">{expenses.length}</p>
          </div>
          <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Promedio/Retiro</p>
            <p className="text-amber-400 font-black text-xl">{formatCOP(expense / expenses.length)}</p>
          </div>
        </div>
      )}

      {/* Historial de egresos */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Historial de Egresos</h3>
            <p className="text-white/30 text-xs">Retiros de caja realizados por los cajeros</p>
          </div>
          {expenses?.length > 0 && (
            <span className="text-white/20 text-xs">{expenses.length} retiros</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">Fecha y Hora</th>
                <th className="text-left px-5 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">Sede</th>
                <th className="text-left px-5 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">Cajero</th>
                <th className="text-left px-5 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">Descripción</th>
                <th className="text-right px-5 py-3 text-white/30 text-[10px] font-bold uppercase tracking-widest">Monto</th>
              </tr>
            </thead>
            <tbody>
              {(expenses || []).map(e => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-white/50 text-xs">
                    {new Date(e.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-5 py-3.5 text-indigo-400 text-xs font-semibold">{e.sede_name}</td>
                  <td className="px-5 py-3.5 text-white/70 text-xs">{e.user_name}</td>
                  <td className="px-5 py-3.5 text-white text-xs">{e.description}</td>
                  <td className="px-5 py-3.5 text-red-400 font-black text-xs text-right">-{formatCOP(e.amount)}</td>
                </tr>
              ))}
              {!(expenses?.length) && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-3xl mb-3 opacity-20">📤</p>
                    <p className="text-white/20 text-sm">No hay egresos registrados.</p>
                    <p className="text-white/10 text-xs mt-1">Los cajeros pueden registrar retiros desde su estación.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
