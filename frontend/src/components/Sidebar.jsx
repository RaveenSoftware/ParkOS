import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const NAV = [
  { to: '/pos/dashboard', label: 'Dashboard',        icon: '📊' },
  { to: '/pos/entrada',   label: 'Registrar Entrada', icon: '🚗' },
  { to: '/pos/tickets',   label: 'Vehículos Dentro',  icon: '🎫' },
  { to: '/pos/mapa',      label: 'Mapa de Plazas',    icon: '🅿️' },
  { to: '/pos/historial', label: 'Historial',          icon: '📋' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [sedes, setSedes] = useState([]);
  const user = JSON.parse(localStorage.getItem('parkos_user') || '{}');
  const [selectedSede, setSelectedSede] = useState(localStorage.getItem('parkos_pos_sedeId') || '');

  useEffect(() => {
    api.get('/config').then(data => {
      if (data) setConfig(data);
    }).catch(() => {});

    if (user.role === 'ADMIN_TENANT' || user.role === 'SUPERADMIN') {
      api.get('/sedes').then(data => {
        setSedes(data);
        const currentSedeId = localStorage.getItem('parkos_pos_sedeId');
        if (data.length > 0 && !currentSedeId) {
          localStorage.setItem('parkos_pos_sedeId', data[0].id);
          window.location.reload();
        }
      }).catch(() => {});
    }

    const handleConfigUpdate = (e) => {
      setConfig({ commercial_name: e.detail.commercialName, logo_base64: e.detail.logoBase64 });
    };
    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, [user.role]);

  function handleSedeChange(e) {
    const val = e.target.value;
    setSelectedSede(val);
    if (val) {
      localStorage.setItem('parkos_pos_sedeId', val);
    } else {
      localStorage.removeItem('parkos_pos_sedeId');
    }
    window.location.reload();
  }

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <aside className="w-64 min-h-screen bg-[#111827] flex flex-col border-r border-white/5">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0">
            {config?.logo_base64 ? (
              <img src={config.logo_base64} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'P'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-white font-black text-sm tracking-tight truncate">{config?.commercial_name || user.tenantName || 'ParkOS'}</p>
            <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest truncate">Estación de Control</p>
          </div>
        </div>
      </div>

      {/* Selector de Sede para Admins */}
      {(user.role === 'ADMIN_TENANT' || user.role === 'SUPERADMIN') && (
        <div className="px-6 py-3 border-b border-white/5 bg-white/5">
          <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
            Operando Sede
          </label>
          <select
            value={selectedSede}
            onChange={handleSedeChange}
            className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Seleccionar Sede —</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
        {user.role === 'ADMIN_TENANT' && (
          <NavLink to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white mt-4 border-t border-white/5 pt-5">
            <span className="text-base">🏢</span>
            Volver a Admin
          </NavLink>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-xs uppercase">
            {user.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{user.name || 'Usuario'}</p>
            <p className="text-gray-500 text-[10px]">{user.role || 'CAJERO'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
