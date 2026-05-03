import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}
function toInputDate(d) { return d.toLocaleDateString('en-CA'); }

const CATEGORIES = [
  { value: 'SALARIO',       label: '👷 Salario/Nómina' },
  { value: 'SERVICIOS',     label: '💡 Servicios (luz, agua, internet)' },
  { value: 'MANTENIMIENTO', label: '🔧 Mantenimiento' },
  { value: 'COMPRAS',       label: '🛒 Compras operativas' },
  { value: 'ARRIENDO',      label: '🏢 Arriendo' },
  { value: 'IMPUESTOS',     label: '📋 Impuestos/Obligaciones' },
  { value: 'OTRO',          label: '📦 Otro' },
];

const CAT_COLORS = {
  SALARIO: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  SERVICIOS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MANTENIMIENTO: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  COMPRAS: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ARRIENDO: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  IMPUESTOS: 'bg-red-500/20 text-red-300 border-red-500/30',
  OTRO: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

/* ─── Sub-components ─────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, border }) {
  return (
    <div className={`rounded-2xl p-5 border ${border || 'bg-[#1a1f2e] border-white/5'} hover:border-white/10 transition-all`}>
      <span className="text-2xl">{icon}</span>
      <p className={`text-2xl font-black leading-none mt-3 ${color}`}>{value}</p>
      <p className="text-white/60 text-sm font-semibold mt-1.5">{label}</p>
      {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function TrendChart({ trend = [] }) {
  if (!trend.length) return (
    <div className="flex items-center justify-center h-44 flex-col gap-2 text-white/20 text-sm">
      <span className="text-3xl">📈</span> Sin datos aún
    </div>
  );
  const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1);
  return (
    <div className="flex items-end gap-1 h-44 w-full overflow-x-auto pb-5 pt-2">
      {trend.map((t, i) => {
        const ip = Math.max((t.income  / maxVal) * 100, t.income  > 0 ? 3 : 0);
        const ep = Math.max((t.expense / maxVal) * 100, t.expense > 0 ? 3 : 0);
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group relative min-w-[16px] h-full">
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d1117] border border-white/10 text-[10px] px-3 py-2 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 z-10 pointer-events-none shadow-2xl transition-all">
              <p className="text-white/50 font-bold mb-1">{t.label}</p>
              <p className="text-emerald-400 font-bold">Ing: {formatCOP(t.income)}</p>
              {t.expense > 0 && <p className="text-red-400 font-bold">Egr: {formatCOP(t.expense)}</p>}
            </div>
            <div className="flex items-end gap-[2px] w-full px-[1px] h-full">
              <div className="w-1/2 bg-emerald-500 rounded-t-sm transition-all opacity-80 group-hover:opacity-100" style={{ height: `${ip}%` }} />
              <div className="w-1/2 bg-red-500 rounded-t-sm transition-all opacity-80 group-hover:opacity-100" style={{ height: `${ep}%` }} />
            </div>
            <span className="text-white/20 text-[8px] font-mono whitespace-nowrap mt-1 group-hover:text-white/50 transition-colors">{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab: Dashboard ─────────────────────────────────────────── */
function TabDashboard({ kpis, trend, expenses }) {
  const income  = kpis?.income  || 0;
  const expense = kpis?.expense || 0;
  const profit  = income - expense;
  const isProfit = profit >= 0;
  const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0.0';

  // By category summary
  const byCat = (expenses || []).reduce((acc, e) => {
    const k = e.category || 'OTRO';
    acc[k] = (acc[k] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="💰" label="Ingresos Totales" value={formatCOP(income)}
          sub="De tickets cobrados" color="text-emerald-400"
          border="bg-emerald-900/20 border-emerald-500/20" />
        <KpiCard icon="📤" label="Egresos Totales" value={formatCOP(expense)}
          sub="Gastos registrados" color="text-red-400"
          border="bg-red-900/20 border-red-500/20" />
        <KpiCard icon={isProfit ? '📈' : '📉'} label="Beneficio Neto"
          value={formatCOP(profit)} color={isProfit ? 'text-indigo-400' : 'text-orange-400'}
          sub={isProfit ? '✅ Operación rentable' : '⚠️ Operación en déficit'}
          border={isProfit ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-orange-900/20 border-orange-500/20'} />
        <KpiCard icon="🎯" label="Margen Neto" value={`${margin}%`}
          sub="Ganancia/Ingreso" color={isProfit ? 'text-amber-400' : 'text-orange-400'}
          border="bg-amber-900/20 border-amber-500/20" />
      </div>

      {/* Gráfico */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold">Tendencia Últimos 30 Días</h3>
            <p className="text-white/30 text-xs mt-0.5">Ingresos (verde) vs Egresos (rojo) por día</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-500 inline-block" /> Egresos</span>
          </div>
        </div>
        <TrendChart trend={trend} />
      </div>

      {/* Breakdown de egresos por categoría */}
      {Object.keys(byCat).length > 0 && (
        <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-4">Egresos por Categoría</p>
          <div className="space-y-2">
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
              const pct = expense > 0 ? (amt / expense) * 100 : 0;
              const catInfo = CATEGORIES.find(c => c.value === cat) || { label: cat };
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">{catInfo.label}</span>
                    <span className="text-red-400 font-bold">{formatCOP(amt)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab: Registrar Egreso ──────────────────────────────────── */
function TabNuevoEgreso({ sedes, onSuccess }) {
  const [form, setForm] = useState({ sedeId: sedes[0]?.id || '', description: '', amount: '', category: 'OTRO' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.sedeId || !form.description || !form.amount) {
      setToast({ type: 'error', msg: 'Completa todos los campos requeridos.' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/expenses/admin/new', {
        sedeId: form.sedeId,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
      });
      setToast({ type: 'success', msg: `Egreso de ${formatCOP(form.amount)} registrado correctamente.` });
      setForm(f => ({ ...f, description: '', amount: '' }));
      onSuccess();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      {toast && (
        <div className={`mb-5 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300' : 'bg-red-900/30 border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
          <button onClick={() => setToast(null)} className="ml-auto text-white/30 hover:text-white">✕</button>
        </div>
      )}

      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-7">
        <h2 className="text-white font-black text-lg mb-1">Registrar Egreso</h2>
        <p className="text-white/30 text-sm mb-6">Registra cualquier gasto de tu empresa directamente.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sede */}
          <div>
            <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2">Sede *</label>
            <select name="sedeId" value={form.sedeId} onChange={set} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors">
              {sedes.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2">Categoría *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all ${
                    form.category === c.value
                      ? 'border-indigo-500 bg-indigo-600/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2">Descripción *</label>
            <input name="description" value={form.description} onChange={set} required
              placeholder="Ej: Pago de luz octubre, Sueldo de Juan..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>

          {/* Monto */}
          <div>
            <label className="text-white/50 text-xs font-bold uppercase tracking-widest block mb-2">Monto (COP) *</label>
            <input name="amount" type="number" min="0" step="100" value={form.amount} onChange={set} required
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-black placeholder-white/20 focus:outline-none focus:border-red-500 transition-colors" />
            {form.amount && <p className="text-red-400/70 text-xs mt-1 ml-1">{formatCOP(form.amount)}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-600/20">
            {loading ? '⏳ Registrando...' : '📤 Registrar Egreso'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Tab: Historial Egresos ─────────────────────────────────── */
function TabEgresos({ sedes, refreshKey }) {
  const today = new Date();
  const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const [filters, setFilters] = useState({ sedeId: '', from: toInputDate(yearAgo), to: toInputDate(today) });
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.sedeId) p.append('sedeId', filters.sedeId);
      if (filters.from)   p.append('from', filters.from);
      if (filters.to)     p.append('to',   filters.to);
      const data = await api.get(`/expenses/admin/all?${p}`);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters, refreshKey]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este egreso? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await api.delete(`/expenses/admin/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Sede</label>
          <select value={filters.sedeId} onChange={e => setFilters(f => ({ ...f, sedeId: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="" className="bg-[#111]">Todas</option>
            {sedes.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Desde</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
        </div>
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Hasta</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
        </div>
        <button onClick={load} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all">
          🔍 Filtrar
        </button>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="flex gap-4 px-1">
          <span className="text-white/40 text-sm">{expenses.length} registros</span>
          <span className="text-red-400 font-bold text-sm">Total: {formatCOP(total)}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-indigo-400 animate-spin" /></div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-white/20">
          <p className="text-4xl mb-3">📤</p>
          <p className="font-bold">No hay egresos para este período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="bg-[#1a1f2e] border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-white/10 transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CAT_COLORS[e.category] || CAT_COLORS.OTRO}`}>
                    {CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                  </span>
                  <span className="text-indigo-400 text-xs">{e.sede_name}</span>
                  {e.user_name && <span className="text-white/30 text-xs">· {e.user_name}</span>}
                </div>
                <p className="text-white text-sm font-semibold">{e.description}</p>
                <p className="text-white/30 text-xs mt-0.5">{fmtDate(e.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-red-400 font-black text-lg">-{formatCOP(e.amount)}</p>
              </div>
              <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                className="text-white/20 hover:text-red-400 transition-colors text-sm shrink-0 disabled:opacity-50">
                {deleting === e.id ? '⏳' : '🗑️'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'nuevo',     label: '➕ Nuevo Egreso' },
  { id: 'egresos',   label: '📤 Historial Egresos' },
];

export default function Finanzas() {
  const [tab, setTab]       = useState('dashboard');
  const [sedes, setSedes]   = useState([]);
  const [finance, setFinance] = useState(null);
  const [loadingFin, setLoadingFin] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadFinance = useCallback(() => {
    setLoadingFin(true);
    api.get('/dashboard/finances')
      .then(setFinance)
      .catch(console.error)
      .finally(() => setLoadingFin(false));
  }, []);

  useEffect(() => {
    api.get('/sedes').then(setSedes).catch(console.error);
    loadFinance();
  }, [loadFinance]);

  function handleExpenseCreated() {
    setRefreshKey(k => k + 1);
    loadFinance();
    setTab('egresos');
  }

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanzas</h1>
          <p className="text-white/30 text-sm mt-1">Control financiero completo — ingresos, egresos y rentabilidad</p>
        </div>
        <button onClick={loadFinance}
          className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 px-4 py-2 rounded-xl text-sm transition-all">
          ↻ Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-white/40 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard' && (
        loadingFin ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
          </div>
        ) : (
          <TabDashboard kpis={finance?.kpis} trend={finance?.trend} expenses={finance?.expenses} />
        )
      )}
      {tab === 'nuevo'     && <TabNuevoEgreso sedes={sedes} onSuccess={handleExpenseCreated} />}
      {tab === 'egresos'   && <TabEgresos sedes={sedes} refreshKey={refreshKey} />}
    </div>
  );
}
