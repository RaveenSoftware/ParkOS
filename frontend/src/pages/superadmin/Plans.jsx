import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

const PLAN_COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7'];

// ── Modal de Alta / Edición de Plan
function PlanModal({ plan, onClose, onSave }) {
  const isEdit = !!plan?.id;
  const [form, setForm] = useState(
    plan
      ? { name: plan.name, price: plan.price, maxSedes: plan.max_sedes, maxUsers: plan.max_users, features: Array.isArray(plan.features) ? plan.features : [] }
      : { name: '', price: '', maxSedes: 1, maxUsers: 5, features: [] }
  );
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function addFeature() {
    const f = newFeature.trim();
    if (!f) return;
    setForm(prev => ({ ...prev, features: [...prev.features, f] }));
    setNewFeature('');
  }

  function removeFeature(idx) {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price) { setError('Nombre y Precio son obligatorios.'); return; }
    setLoading(true);
    try {
      const payload = {
        name: String(form.name).toUpperCase(),
        price: Number(form.price),
        maxSedes: Number(form.maxSedes),
        maxUsers: Number(form.maxUsers),
        features: form.features,
      };
      if (isEdit) {
        await api.put(`/plans/${plan.id}`, payload);
      } else {
        await api.post('/plans', payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-bold text-base">{isEdit ? `Editar Plan ${plan.name}` : 'Nuevo Plan'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">Nombre del Plan *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors font-bold uppercase"
                placeholder="GOLD, PLATINUM..." />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">Precio / Mes (COP) *</label>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="79000" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">Límite Sedes</label>
              <input name="maxSedes" type="number" min="1" value={form.maxSedes} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest mb-1.5 block">Límite Usuarios</label>
              <input name="maxUsers" type="number" min="1" value={form.maxUsers} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="text-white/40 text-xs uppercase tracking-widest mb-2 block">Características del Plan</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newFeature} onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="Ej: Reportes PDF, API Access..." />
              <button type="button" onClick={addFeature}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-sm transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-8">
              {form.features.map((f, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-2 py-1 text-xs">
                  {f}
                  <button type="button" onClick={() => removeFeature(i)} className="hover:text-white transition-colors ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </span>
              ))}
              {form.features.length === 0 && <span className="text-white/20 text-xs">Sin características definidas</span>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [tenantCounts, setTenantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    try {
      const [plansData, tenantsData] = await Promise.all([api.get('/plans'), api.get('/tenants')]);
      setPlans(plansData);
      // Contar cuántos tenants usa cada plan
      const counts = {};
      tenantsData.forEach(t => {
        if (t.plan_id) counts[t.plan_id] = (counts[t.plan_id] || 0) + 1;
      });
      setTenantCounts(counts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {modal && (
        <PlanModal
          plan={modal.plan}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      <div className="p-8 space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Planes SaaS</h1>
            <p className="text-white/30 text-sm mt-1">Configura precios, límites y características de cada plan</p>
          </div>
          <button onClick={() => setModal({ plan: null })}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Plan
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p, idx) => {
              const color = PLAN_COLORS[idx % PLAN_COLORS.length];
              const clientCount = tenantCounts[p.id] || 0;
              return (
                <div key={p.id} className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all flex flex-col">
                  {/* Accent bar */}
                  <div className="h-0.5 w-full" style={{ background: color }} />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-black text-white tracking-widest">{p.name}</h3>
                        <span className="text-xs text-white/30">{clientCount} cliente{clientCount !== 1 ? 's' : ''} activos</span>
                      </div>
                      <button onClick={() => setModal({ plan: p })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Precio */}
                    <p className="text-3xl font-black mb-1" style={{ color }}>
                      {formatCOP(p.price)}
                      <span className="text-sm text-white/30 font-normal">/mes</span>
                    </p>
                    <p className="text-white/20 text-xs mb-6">{formatCOP(p.price * 12)}/año</p>

                    {/* Límites */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40 text-xs">Sedes</span>
                        <span className="text-white font-bold text-sm">{p.max_sedes}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-white/40 text-xs">Usuarios</span>
                        <span className="text-white font-bold text-sm">{p.max_users}</span>
                      </div>
                    </div>

                    {/* Features */}
                    {Array.isArray(p.features) && p.features.length > 0 && (
                      <div className="flex flex-col gap-1.5 flex-1">
                        {p.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 shrink-0" style={{ color }}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span className="text-white/50 text-xs">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(!p.features || p.features.length === 0) && (
                      <p className="text-white/20 text-xs flex-1">Sin características definidas</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
