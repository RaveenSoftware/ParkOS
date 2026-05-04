import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils';

const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Tenants: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 21h18M9 21V7l6-4v18M15 21V11l6 2v8M3 21V13l6-2"/>
    </svg>
  ),
  Plans: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Sedes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Audit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const menu = [
  { name: 'Dashboard', icon: Icons.Dashboard, path: '/superadmin/dashboard' },
  { name: 'Empresas',  icon: Icons.Tenants,   path: '/superadmin/tenants'   },
  { name: 'Planes',    icon: Icons.Plans,     path: '/superadmin/plans'     },
  { name: 'Usuarios',  icon: Icons.Users,     path: '/superadmin/usuarios'  },
  { name: 'Sedes',     icon: Icons.Sedes,     path: '/superadmin/sedes'     },
  { name: 'Auditoría', icon: Icons.Audit,     path: '/superadmin/auditoria' },
];

function SidebarContent({ isExpanded, onClose, handleLogout }) {
  return (
    <aside className={cn(
      'bg-black border-r border-white/10 flex flex-col relative z-20 select-none h-full transition-all duration-300',
      isExpanded ? 'w-60' : 'w-[72px]'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-white/10 h-16 px-5', !isExpanded && 'justify-center px-0')}>
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span class="text-black font-black text-sm">P</span>'; }} />
        </div>
        {isExpanded && (
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <p className="text-white font-black text-sm tracking-tight leading-none">ParkOS</p>
            <p className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase leading-none mt-0.5">SuperAdmin</p>
          </div>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white p-1 transition-colors shrink-0">
            <Icons.Close />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto overflow-x-hidden min-h-0">
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
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button onClick={handleLogout} title={!isExpanded ? 'Cerrar Sesión' : undefined}
          className={cn(
            'flex items-center w-full rounded-lg h-10 transition-all duration-200 text-red-500 hover:bg-red-500/10 group overflow-hidden',
            isExpanded ? 'px-3 gap-3' : 'justify-center px-0'
          )}>
          <span className="shrink-0 group-hover:scale-110 transition-transform duration-200"><Icons.Logout /></span>
          {isExpanded && <span className="whitespace-nowrap text-sm font-semibold">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

export default function SuperAdminSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setIsMobileOpen(false); }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem('parkos_token');
    localStorage.removeItem('parkos_user');
    navigate('/login');
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-black border border-white/10 rounded-xl w-10 h-10 flex items-center justify-center text-white shadow-lg"
        onClick={() => setIsMobileOpen(true)}>
        <Icons.Menu />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent isExpanded={true} onClose={() => setIsMobileOpen(false)} handleLogout={handleLogout} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex" onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
        <SidebarContent isExpanded={isExpanded} handleLogout={handleLogout} />
      </div>
    </>
  );
}
