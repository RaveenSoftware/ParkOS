import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function SedeModal({ sede, planInfo, onClose, onSave }) {
  const isEdit = !!sede?.id;
  const [form, setForm] = useState(sede
    ? { name: sede.name, address: sede.address || '', capacity: sede.capacity }
    : { name: '', address: '', capacity: 50 }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Validar límite del plan al crear
  const atLimit = !isEdit && planInfo && planInfo.usedSedes >= planInfo.maxSedes;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('El nombre es obligatorio.'); return; }
    if (atLimit)    { setError(`Has alcanzado el límite de ${planInfo.maxSedes} sedes de tu plan.`); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/sedes/${sede.id}`, { name: form.name, address: form.address, capacity: Number(form.capacity) || 50 });
      } else {
        await api.post('/sedes', { name: form.name, address: form.address, capacity: Number(form.capacity) || 50 });
      }
      onSave();
    } catch (err) { setError(err.message); }
    finally      { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-bold text-base">{isEdit ? 'Editar Sede' : 'Nueva Sede'}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
          {atLimit && !error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-yellow-400 text-sm">
              Has alcanzado el límite de sedes de tu plan ({planInfo.maxSedes}). Habla con tu proveedor para hacer un upgrade.
            </div>
          )}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Nombre de la Sede *</label>
            <input name="name" value={form.name} onChange={set} placeholder="Ej: Sede Centro"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Dirección</label>
            <input name="address" value={form.address} onChange={set} placeholder="Calle 100 # 15-20"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Capacidad Máxima (vehículos)</label>
            <input name="capacity" type="number" min="1" value={form.capacity} onChange={set}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading || atLimit}
              className="flex-1 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Sede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSedes() {
  const [sedes, setSedes]   = useState([]);
  const [plan, setPlan]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);

  const load = useCallback(async () => {
    try {
      const [sedesData, dashData] = await Promise.all([api.get('/sedes'), api.get('/dashboard/tenant')]);
      setSedes(sedesData);
      setPlan(dashData?.plan || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id, current) {
    if (!confirm(`¿${current ? 'Desactivar' : 'Activar'} esta sede?`)) return;
    try { await api.put(`/sedes/${id}/status`, { isActive: current }); load(); }
    catch (err) { alert(err.message); }
  }

  const planInfo = plan ? { usedSedes: Number(plan.used_sedes), maxSedes: Number(plan.max_sedes) } : null;
  const usedPct  = planInfo ? Math.min((planInfo.usedSedes / planInfo.maxSedes) * 100, 100) : 0;

  return (
    <>
      {modal && <SedeModal sede={modal.sede} planInfo={planInfo} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}

      <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Mis Sedes</h1>
            <p className="text-white/30 text-sm mt-1">Gestiona los parqueaderos físicos de tu empresa</p>
          </div>
          <button onClick={() => setModal({ sede: null })}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Sede
          </button>
        </div>

        {/* Barra de uso del plan */}
        {planInfo && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Sedes del plan <span className="text-blue-400 font-bold">{plan.plan_name}</span></span>
                <span className={`font-bold ${usedPct >= 100 ? 'text-red-400' : usedPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                  {planInfo.usedSedes} / {planInfo.maxSedes}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }} />
              </div>
            </div>
            {usedPct >= 100 && (
              <span className="text-red-400 text-xs font-bold whitespace-nowrap">Límite alcanzado</span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sedes.map(s => (
              <div key={s.id} className={`bg-white/[0.03] border rounded-xl p-6 flex flex-col transition-all ${s.is_active ? 'border-white/10 hover:border-white/20' : 'border-red-500/20 opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-base">{s.name}</h3>
                    <p className="text-white/30 text-xs mt-0.5">{s.address || 'Sin dirección'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${s.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {s.is_active ? 'ACTIVA' : 'INACTIVA'}
                  </span>
                </div>
                <p className="text-white/40 text-xs mb-6">Capacidad: <span className="text-white font-bold">{s.capacity}</span> vehículos</p>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setModal({ sede: s })}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-all">
                    Editar
                  </button>
                  <button onClick={() => handleToggle(s.id, s.is_active)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${s.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                    {s.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
            {!sedes.length && (
              <div className="col-span-3 py-16 text-center text-white/20">No tienes sedes registradas aún.</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
