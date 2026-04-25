import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Pages
import Login from './pages/Login';

// Admin Components
import AdminSidebar from './components/admin/Sidebar';
import SuperAdminSidebar from './components/superadmin/Sidebar';
import PosSidebar from './components/Sidebar';

// POS Pages
import PosDashboard from './pages/Dashboard';
import Entrada from './pages/Entrada';
import Tickets from './pages/Tickets';
import MapaPOS from './pages/pos/MapaPOS';
import Historial from './pages/Historial';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminSedes from './pages/admin/Sedes';
import AdminCajeros from './pages/admin/Cajeros';
import AdminReportes from './pages/admin/Reportes';
import AdminPerfil from './pages/admin/Perfil';
import AdminConfiguracion from './pages/admin/Configuracion';
import AdminTarifas from './pages/admin/Tarifas';
import MapaParqueadero from './pages/admin/MapaParqueadero';
import AdminMapaEstado from './pages/admin/AdminMapaEstado';
import AdminFinanzas from './pages/admin/Finanzas';

// SuperAdmin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminTenants from './pages/superadmin/Tenants';
import SuperAdminPlans from './pages/superadmin/Plans';
import SuperAdminUsuarios from './pages/superadmin/Usuarios';
import SuperAdminSedes from './pages/superadmin/Sedes';
import SuperAdminAuditoria from './pages/superadmin/Auditoria';

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('parkos_token');
  const userStr = localStorage.getItem('parkos_user');
  
  if (!token || !userStr) return <Navigate to="/login" replace />;
  
  try {
    const user = JSON.parse(userStr);
    if (!allowedRoles.includes(user.role)) {
      // Redirect to their respective home if they try to access unauthorized routes
      if (user.role === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
      if (user.role === 'ADMIN_TENANT') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/pos/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Layouts
function SuperAdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function PosLayout() {
  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <PosSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* SUPERADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/tenants" element={<SuperAdminTenants />} />
          <Route path="/superadmin/plans" element={<SuperAdminPlans />} />
          <Route path="/superadmin/usuarios" element={<SuperAdminUsuarios />} />
          <Route path="/superadmin/sedes" element={<SuperAdminSedes />} />
          <Route path="/superadmin/auditoria" element={<SuperAdminAuditoria />} />
        </Route>

        {/* ADMIN TENANT ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN_TENANT', 'SUPERADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard"    element={<AdminDashboard />} />
          <Route path="/admin/sedes"        element={<AdminSedes />} />
          <Route path="/admin/cajeros"      element={<AdminCajeros />} />
          <Route path="/admin/reportes"     element={<AdminReportes />} />
          <Route path="/admin/tarifas"      element={<AdminTarifas />} />
          <Route path="/admin/mapa"         element={<MapaParqueadero />} />
          <Route path="/admin/monitor"      element={<AdminMapaEstado />} />
          <Route path="/admin/finanzas"     element={<AdminFinanzas />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
          <Route path="/admin/perfil"       element={<AdminPerfil />} />
        </Route>

        {/* CAJERO (POS) ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['CAJERO', 'ADMIN_TENANT', 'SUPERADMIN']}><PosLayout /></ProtectedRoute>}>
          <Route path="/pos/dashboard" element={<PosDashboard />} />
          <Route path="/pos/entrada"   element={<Entrada />} />
          <Route path="/pos/tickets"   element={<Tickets />} />
          <Route path="/pos/mapa"      element={<MapaPOS />} />
          <Route path="/pos/historial" element={<Historial />} />
        </Route>

        {/* CATCH ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
