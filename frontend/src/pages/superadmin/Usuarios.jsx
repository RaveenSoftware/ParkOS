import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

const ROLE_STYLE = {
  ADMIN_TENANT: { label: 'Admin', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  CAJERO: { label: 'Cajero', cls: 'bg-white/5 text-white/60 border border-white/10' },
};

export default function SuperAdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/saas/users');
      setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(user) {
    if (!confirm(`¿${user.is_active ? 'Desactivar' : 'Activar'} al usuario "${user.name}"?`)) return;
    setToggling(user.id);
    try {
      await api.patch(`/saas/users/${user.id}/status`);
      load();
    } catch (err) { alert(err.message); }
    finally { setToggling(null); }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.tenant_name || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalActive = users.filter(u => u.is_active).length;
  const totalAdmins = users.filter(u => u.role === 'ADMIN_TENANT').length;
  const totalCajeros = users.filter(u => u.role === 'CAJERO').length;

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Usuarios Globales</h1>
        <p className="text-white/30 text-sm mt-1">Todos los usuarios del sistema — sin incluir SuperAdmin</p>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Usuarios', value: users.length, color: 'text-white' },
          { label: 'Admins Empresa', value: totalAdmins, color: 'text-blue-400' },
          { label: 'Cajeros', value: totalCajeros, color: 'text-white/60' },
        ].map(k => (
          <div key={k.label} className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-white/30 text-xs uppercase tracking-widest mb-2">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-white/20 text-xs mt-1">{totalActive} activos en total</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
        </div>
        <div className="flex gap-2">
          {[['ALL', 'Todos'], ['ADMIN_TENANT', 'Admins'], ['CAJERO', 'Cajeros']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterRole(val)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterRole === val ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
              {label}
            </button>
          ))}
        </div>
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
                {['Usuario', 'Rol', 'Empresa', 'Sede Asignada', 'Alta', 'Estado'].map(h => (
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
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ROLE_STYLE[u.role]?.cls || 'bg-white/5 text-white/40'}`}>
                      {ROLE_STYLE[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/60 text-xs">{u.tenant_name || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/40 text-xs">{u.sede_name || '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-white/30 text-xs font-mono">
                      {new Date(u.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${u.is_active
                        ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400 border border-green-500/20 hover:border-red-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-green-500/10 hover:text-green-400 border border-red-500/20 hover:border-green-500/20'
                      } disabled:opacity-40`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      {toggling === u.id ? '...' : u.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-white/20 text-sm">No hay usuarios para los filtros seleccionados.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-white/20 text-xs">{filtered.length} de {users.length} usuarios</span>
          </div>
        </div>
      )}
    </div>
  );
}
