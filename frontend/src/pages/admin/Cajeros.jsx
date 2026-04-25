import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

const ROLE_BADGE = {
  ADMIN_TENANT: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  CAJERO:       'bg-white/5 text-white/60 border border-white/10',
};

function PersonalModal({ sedes, planInfo, user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState(
    user 
      ? { name: user.name, email: user.email, password: '', sedeId: user.sede_id || '', role: user.role }
      : { name: '', email: '', password: '', sedeId: '', role: 'CAJERO' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [actionType, setActionType] = useState('SAVE'); // SAVE, DELETE, RESET_PASS

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const atLimit = !isEdit && planInfo && planInfo.usedUsers >= planInfo.maxUsers;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (actionType === 'DELETE') {
      if (!confirm(`¿Estás seguro de eliminar a ${form.name}? Esta acción no se puede deshacer.`)) return;
      setLoading(true);
      try {
        await api.delete(`/users/${user.id}`);
        onSave();
      } catch (err) { setError(err.message); } finally { setLoading(false); }
      return;
    }

    if (actionType === 'RESET_PASS') {
      if (!form.password || form.password.length < 6) {
        setError('Debes ingresar una nueva contraseña de al menos 6 caracteres.'); return;
      }
      setLoading(true);
      try {
        await api.post(`/users/${user.id}/reset-password`, { newPassword: form.password });
        alert('Contraseña actualizada correctamente.');
        onSave();
      } catch (err) { setError(err.message); } finally { setLoading(false); }
      return;
    }

    // SAVE (Create or Update)
    if (!form.name || (!isEdit && !form.email) || (!isEdit && !form.password)) {
      setError('Nombre y sede son obligatorios. Email y contraseña son obligatorios al crear.'); return;
    }
    if (!isEdit && form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (atLimit) { setError(`Límite de ${planInfo.maxUsers} usuarios alcanzado. Contacta a soporte.`); return; }
    
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, { name: form.name, sedeId: Number(form.sedeId) || null });
      } else {
        await api.post('/users/cajero', { name: form.name, email: form.email, password: form.password, sedeId: Number(form.sedeId) });
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
          <h2 className="text-white font-bold text-base">Nuevo Empleado</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
          {atLimit && !error && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-yellow-400 text-sm">
              Límite de usuarios alcanzado ({planInfo.maxUsers}). Habla con tu proveedor para hacer un upgrade.
            </div>
          )}
          {isEdit && user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_TENANT' && (
            <div className="flex gap-2">
              <button type="submit" onClick={() => setActionType('RESET_PASS')} disabled={loading}
                className="flex-1 py-1.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-all">
                Cambiar Contraseña
              </button>
              <button type="submit" onClick={() => setActionType('DELETE')} disabled={loading}
                className="flex-1 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all">
                Eliminar Empleado
              </button>
            </div>
          )}

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Nombre Completo *</label>
            <input name="name" value={form.name} onChange={set} type="text" placeholder="Juan Operario"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Email de Acceso {isEdit ? '' : '*'}</label>
            <input name="email" value={form.email} onChange={set} type="email" placeholder="cajero@empresa.com" disabled={isEdit}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50" />
          </div>
          {(!isEdit || actionType === 'RESET_PASS') && (
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">{isEdit ? 'Nueva Contraseña *' : 'Contraseña *'}</label>
              <div className="relative">
                <input name="password" value={form.password} onChange={set} type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass
                    ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Sede Asignada *</label>
            <select name="sedeId" value={form.sedeId} onChange={set}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
              <option value="" className="bg-[#111]">— Seleccionar sede —</option>
              {sedes.map(s => <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" onClick={() => setActionType('SAVE')} disabled={loading || (atLimit && !isEdit)}
              className="flex-1 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCajeros() {
  const [users, setUsers]     = useState([]);
  const [sedes, setSedes]     = useState([]);
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [filterRole, setFilterRole] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const [usersData, sedesData, dashData] = await Promise.all([
        api.get('/users'), api.get('/sedes'), api.get('/dashboard/tenant')
      ]);
      setUsers(usersData);
      setSedes(sedesData.filter(s => s.is_active));
      setPlan(dashData?.plan || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(u) {
    if (!confirm(`¿${u.is_active ? 'Bloquear' : 'Activar'} acceso de "${u.name}"?`)) return;
    try { await api.put(`/users/${u.id}/status`, { isActive: u.is_active }); load(); }
    catch (err) { alert(err.message); }
  }

  const filtered = filterRole === 'ALL' ? users : users.filter(u => u.role === filterRole);
  const planInfo = plan ? { usedUsers: Number(plan.used_users), maxUsers: Number(plan.max_users) } : null;
  const usersPct = planInfo ? Math.min((planInfo.usedUsers / planInfo.maxUsers) * 100, 100) : 0;

  return (
    <>
      {modal && <PersonalModal sedes={sedes} planInfo={planInfo} user={modal.user} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}

      <div className="p-8 space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Personal Operativo</h1>
            <p className="text-white/30 text-sm mt-1">Gestiona las cuentas de acceso de tus empleados</p>
          </div>
          <button onClick={() => setModal({ user: null })}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Empleado
          </button>
        </div>

        {/* Barra uso plan */}
        {planInfo && (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/40">Usuarios del plan <span className="text-blue-400 font-bold">{plan?.plan_name}</span></span>
              <span className={`font-bold ${usersPct >= 100 ? 'text-red-400' : usersPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                {planInfo.usedUsers} / {planInfo.maxUsers}
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usersPct >= 100 ? 'bg-red-500' : usersPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${usersPct}%` }} />
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2">
          {[['ALL','Todos'],['ADMIN_TENANT','Admins'],['CAJERO','Cajeros']].map(([v,l]) => (
            <button key={v} onClick={() => setFilterRole(v)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterRole === v ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>{l}</button>
          ))}
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" /></div>
        ) : (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Empleado','Rol','Sede Asignada','Estado','Acción'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-white/30 text-xs font-medium uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!u.is_active ? 'opacity-40' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-white/30 text-xs">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ROLE_BADGE[u.role] || ''}`}>
                        {u.role === 'ADMIN_TENANT' ? 'Admin' : 'Cajero'}
                      </span>
                    </td>
                    <td className="px-5 py-4"><span className="text-white/50 text-xs">{u.sede_name || '—'}</span></td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${u.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        {u.is_active ? 'Activo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ user: u })} title="Editar"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {u.role !== 'ADMIN_TENANT' && (
                          <button onClick={() => handleToggle(u)} title={u.is_active ? 'Bloquear' : 'Activar'}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                            {u.is_active
                              ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-white/20 text-sm">No hay empleados registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
