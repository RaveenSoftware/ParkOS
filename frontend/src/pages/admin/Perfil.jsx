import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Activa',    cls: 'bg-green-500/10 text-green-400 border border-green-500/20'   },
  TRIAL:     { label: 'En Trial',  cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'      },
  PAST_DUE:  { label: 'Vencida',  cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  SUSPENDED: { label: 'Suspendida', cls: 'bg-red-500/10 text-red-400 border border-red-500/20'         },
};

export default function AdminPerfil() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/tenant')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('parkos_user') || '{}'); } catch { return {}; } })();
  const plan = data?.plan;
  const statusCfg = STATUS_CONFIG[plan?.subscription_status] || STATUS_CONFIG.TRIAL;

  const sedesUsadas = Number(plan?.used_sedes  || 0);
  const sedesMax    = Number(plan?.max_sedes   || 1);
  const usersUsados = Number(plan?.used_users  || 0);
  const usersMax    = Number(plan?.max_users   || 1);
  const sedesPct    = Math.min((sedesUsadas / sedesMax) * 100, 100);
  const usersPct    = Math.min((usersUsados / usersMax) * 100, 100);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Mi Plan y Perfil</h1>
        <p className="text-white/30 text-sm mt-1">Información de tu empresa y estado de suscripción</p>
      </div>

      {/* Cuenta de usuario */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-sm">Cuenta de Acceso</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-6">
          {[
            { label: 'Nombre', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Rol', value: 'Administrador de Empresa' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">{f.label}</p>
              <p className="text-white font-medium text-sm">{f.value || '—'}</p>
            </div>
          ))}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Empresa</p>
            <p className="text-blue-400 font-bold text-sm">{user.tenantName || '—'}</p>
          </div>
        </div>
      </div>

      {/* Plan activo */}
      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Plan Activo</h2>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
        </div>
        <div className="px-6 py-5 space-y-6">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Plan</p>
              <p className="text-white font-black text-3xl tracking-widest">{plan?.plan_name || '—'}</p>
            </div>
            <div className="pb-1">
              <p className="text-blue-400 font-bold text-xl">{formatCOP(plan?.plan_price)}<span className="text-white/30 text-sm font-normal">/mes</span></p>
              <p className="text-white/20 text-xs">{formatCOP(Number(plan?.plan_price || 0) * 12)}/año</p>
            </div>
          </div>

          {/* Límites */}
          <div className="space-y-5">
            {/* Sedes */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Sedes</span>
                <span className={`font-bold ${sedesPct >= 100 ? 'text-red-400' : sedesPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                  {sedesUsadas} / {sedesMax} usadas
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${sedesPct >= 100 ? 'bg-red-500' : sedesPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${sedesPct}%` }} />
              </div>
              {sedesPct >= 100 && <p className="text-red-400 text-xs mt-1">Has alcanzado el límite de sedes. Contacta a soporte para hacer un upgrade.</p>}
            </div>
            {/* Usuarios */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Usuarios</span>
                <span className={`font-bold ${usersPct >= 100 ? 'text-red-400' : usersPct >= 80 ? 'text-yellow-400' : 'text-white'}`}>
                  {usersUsados} / {usersMax} registrados
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${usersPct >= 100 ? 'bg-red-500' : usersPct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${usersPct}%` }} />
              </div>
              {usersPct >= 100 && <p className="text-red-400 text-xs mt-1">Has alcanzado el límite de usuarios. Contacta a soporte para hacer un upgrade.</p>}
            </div>
          </div>

          {/* Alertas según estado */}
          {plan?.subscription_status === 'PAST_DUE' && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-4 py-3 flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <div>
                <p className="text-yellow-400 text-sm font-bold">Pago vencido</p>
                <p className="text-yellow-400/70 text-xs mt-0.5">Tu suscripción tiene un pago pendiente. Contacta a tu proveedor del servicio para regularizar.</p>
              </div>
            </div>
          )}
          {plan?.subscription_status === 'TRIAL' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3 flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-blue-400 text-sm font-bold">Período de prueba activo</p>
                <p className="text-blue-400/70 text-xs mt-0.5">Estás evaluando el plan {plan?.plan_name}. Contacta a tu proveedor para activar tu suscripción.</p>
              </div>
            </div>
          )}

          {/* Contacto soporte */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/20 text-xs">¿Necesitas cambiar de plan o tienes dudas? Contacta a soporte: <span className="text-white/40">soporte@parkos.io</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
