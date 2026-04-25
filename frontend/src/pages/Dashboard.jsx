import { useEffect, useState } from 'react';
import { api } from '../api/client';

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-[#1a1f2e] rounded-2xl p-6 border border-white/5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-medium">HOY</span>
      </div>
      <p className="text-4xl font-black text-white mb-1">{value ?? '—'}</p>
      <p className="text-sm font-semibold text-gray-300">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('parkos_user') || '{}');

  useEffect(() => {
    async function load() {
      try {
        const [s, r] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/tickets/recent'),
        ]);
        setStats(s);
        setRecent(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCOP = (n) =>
    Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  const TYPE_COLOR = { CARRO: 'bg-blue-500', MOTO: 'bg-amber-500', BICICLETA: 'bg-emerald-500' };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Bienvenido, <span className="text-indigo-400 font-semibold">{user.name}</span> — {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-[#1a1f2e] rounded-2xl h-36 animate-pulse border border-white/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🚗" label="Vehículos Adentro" value={stats?.vehicles_inside ?? 0} color="bg-indigo-500/20" />
          <StatCard icon="📥" label="Entradas Hoy"      value={stats?.entries_today ?? 0}   color="bg-blue-500/20" />
          <StatCard icon="📤" label="Salidas Hoy"       value={stats?.exits_today ?? 0}     color="bg-violet-500/20" />
          <StatCard icon="💰" label="Ingresos Hoy"      value={formatCOP(stats?.revenue_today ?? 0)} color="bg-emerald-500/20" />
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-[#1a1f2e] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-bold">Actividad Reciente</h2>
          <span className="text-gray-500 text-xs">Últimos 10 movimientos</span>
        </div>
        <div className="divide-y divide-white/5">
          {recent.length === 0 ? (
            <p className="text-center text-gray-500 py-12 text-sm">Sin actividad aún</p>
          ) : recent.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-2 h-2 rounded-full ${TYPE_COLOR[t.type] ?? 'bg-gray-500'}`} />
              <div className="flex-1">
                <span className="text-white font-bold text-sm">{t.plate}</span>
                <span className="text-gray-500 text-xs ml-3">{t.type}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.status === 'ABIERTO' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-500/15 text-gray-400'}`}>
                {t.status}
              </span>
              {t.amount && <span className="text-indigo-400 text-sm font-bold">{formatCOP(t.amount)}</span>}
              <span className="text-gray-600 text-xs">{new Date(t.entry_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
