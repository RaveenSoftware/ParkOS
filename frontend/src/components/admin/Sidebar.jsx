import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import { api } from '../../api/client';

const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Sedes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 21h18M9 21V7l6-4v18M15 21V11l6 2v8M3 21V13l6-2"/>
    </svg>
  ),
  Personal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Reportes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Perfil: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  POS: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Configuracion: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Tarifas: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Mapa: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </svg>
  ),
  Monitor: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Finanzas: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

const menu = [
  { name: 'Dashboard',     icon: Icons.Dashboard,    path: '/admin/dashboard'      },
  { name: 'Mis Sedes',     icon: Icons.Sedes,        path: '/admin/sedes'          },
  { name: 'Finanzas',      icon: Icons.Finanzas,     path: '/admin/finanzas'       },
  { name: 'Monitor',       icon: Icons.Monitor,      path: '/admin/monitor'        },
  { name: 'Diseño de Mapa',icon: Icons.Mapa,         path: '/admin/mapa'           },
  { name: 'Tarifas',       icon: Icons.Tarifas,      path: '/admin/tarifas'        },
  { name: 'Personal',      icon: Icons.Personal,     path: '/admin/cajeros'        },
  { name: 'Reportes',      icon: Icons.Reportes,     path: '/admin/reportes'       },
  { name: 'Mi Plan',       icon: Icons.Perfil,       path: '/admin/perfil'         },
  { name: 'Configuración', icon: Icons.Configuracion, path: '/admin/configuracion' },
];

export default function AdminSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState(null);
  const navigate = useNavigate();

  const user = (() => { try { return JSON.parse(localStorage.getItem('parkos_user') || '{}'); } catch { return {}; } })();

  useEffect(() => {
    // Only fetch if it's an admin of a tenant
    if (user.role === 'ADMIN_TENANT') {
      api.get('/config').then(data => {
        if (data) setConfig(data);
      }).catch(() => {});
    }

    const handleConfigUpdate = (e) => {
      setConfig({ commercial_name: e.detail.commercialName, logo_base64: e.detail.logoBase64 });
    };
    window.addEventListener('configUpdated', handleConfigUpdate);
    return () => window.removeEventListener('configUpdated', handleConfigUpdate);
  }, [user.role]);

  function handleLogout() {
    localStorage.removeItem('parkos_token');
    localStorage.removeItem('parkos_user');
    navigate('/login');
  }

  return (
    <aside
      className={cn(
        'bg-black border-r border-white/10 transition-all duration-300 flex flex-col relative z-20 select-none',
        isExpanded ? 'w-60' : 'w-[72px]'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-white/10 h-16 px-5', !isExpanded && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          {config?.logo_base64 ? (
            <img src={config.logo_base64} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-black font-black text-sm tracking-tighter">PK</span>
          )}
        </div>
        {isExpanded && (
          <div className="overflow-hidden whitespace-nowrap">
            <p className="text-white font-black text-sm tracking-tight leading-none truncate max-w-[140px]">
              {config?.commercial_name || user.tenantName || 'ParkOS'}
            </p>
            <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase leading-none mt-0.5">Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-hidden">
        {menu.map(item => (
          <NavLink key={item.path} to={item.path} title={!isExpanded ? item.name : undefined}
            className={({ isActive }) => cn(
              'flex items-center rounded-lg transition-all duration-200 group h-10 overflow-hidden',
              isExpanded ? 'px-3 gap-3' : 'justify-center px-0',
              isActive ? 'bg-white text-black font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'
            )}>
            {({ isActive }) => (
              <>
                <span className={cn('shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')}>
                  <item.icon />
                </span>
                {isExpanded && <span className="whitespace-nowrap text-sm font-medium">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}

        {/* Acceso rápido al POS */}
        <div className="mt-2 pt-2 border-t border-white/5">
          <NavLink to="/pos/dashboard" title={!isExpanded ? 'Estación de Control' : undefined}
            className={({ isActive }) => cn(
              'flex items-center rounded-lg transition-all duration-200 group h-10 overflow-hidden',
              isExpanded ? 'px-3 gap-3' : 'justify-center px-0',
              isActive ? 'bg-white text-black font-bold' : 'text-white/30 hover:text-white hover:bg-white/5'
            )}>
            {({ isActive }) => (
              <>
                <span className={cn('shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')}>
                  <Icons.POS />
                </span>
                {isExpanded && <span className="whitespace-nowrap text-xs font-medium">Estación de Control</span>}
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button onClick={handleLogout} title={!isExpanded ? 'Cerrar Sesión' : undefined}
          className={cn('flex items-center w-full rounded-lg h-10 transition-all duration-200 text-red-500 hover:bg-red-500/10 group overflow-hidden',
            isExpanded ? 'px-3 gap-3' : 'justify-center px-0')}>
          <span className="shrink-0 group-hover:scale-110 transition-transform duration-200"><Icons.Logout /></span>
          {isExpanded && <span className="whitespace-nowrap text-sm font-semibold">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
