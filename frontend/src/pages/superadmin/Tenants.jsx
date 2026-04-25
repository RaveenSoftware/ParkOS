import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

const STATUS_STYLE = {
  ACTIVE:    'bg-green-500/10 text-green-400 border border-green-500/20',
  TRIAL:     'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PAST_DUE:  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const EMPTY_FORM = {
  // Empresa
  name: '', planId: '', documentId: '', contactEmail: '', phone: '', subscriptionStatus: 'TRIAL',
  subscriptionStart: '', subscriptionEnd: '', planTemplate: '',
  // Credenciales del administrador (solo al crear)
  adminName: '', adminEmail: '', adminPassword: '',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Input({ name, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <input
      name={name} value={value} onChange={onChange} type={type} placeholder={placeholder}
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20
        focus:outline-none focus:border-blue-500/50 transition-colors ${className}`}
    />
  );
}

// ── Modal Alta / Edición de Tenant
function TenantModal({ tenant, plans, onClose, onSave }) {
  const isEdit = !!tenant?.id;
  const [form, setForm] = useState(
    tenant
      ? { name: tenant.name, planId: tenant.plan_id, documentId: tenant.document_id || '',
          contactEmail: tenant.contact_email || '', phone: tenant.phone || '',
          subscriptionStatus: tenant.subscription_status,
          subscriptionStart: tenant.subscription_start ? tenant.subscription_start.split('T')[0] : '',
          subscriptionEnd: tenant.subscription_end ? tenant.subscription_end.split('T')[0] : '',
          planTemplate: tenant.plan_template || '',
          adminName: '', adminEmail: '', adminPassword: '' }
      : { ...EMPTY_FORM }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.planId) { setError('Nombre y Plan son obligatorios.'); return; }

    // Al crear: validar que vengan las credenciales del admin
    if (!isEdit) {
      if (!form.adminName || !form.adminEmail || !form.adminPassword) {
        setError('Debes asignar nombre, email y contraseña al administrador.'); return;
      }
      if (form.adminPassword.length < 6) {
        setError('La contraseña del administrador debe tener al menos 6 caracteres.'); return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name, planId: Number(form.planId),
        documentId: form.documentId, contactEmail: form.contactEmail,
        phone: form.phone, subscriptionStatus: form.subscriptionStatus,
        subscriptionStart: form.subscriptionStart || null,
        subscriptionEnd: form.subscriptionEnd || null,
        planTemplate: form.planTemplate || null,
      };

      if (isEdit) {
        await api.put(`/tenants/${tenant.id}`, payload);
      } else {
        // Paso 1: crear el tenant
        const newTenant = await api.post('/tenants', payload);
        // Paso 2: crear el admin con las credenciales asignadas por el SuperAdmin
        await api.post('/users/admin', {
          tenantId: newTenant.id,
          name: form.adminName,
          email: form.adminEmail,
          password: form.adminPassword,
        });
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl max-h-[92vh] flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">{isEdit ? 'Editar Empresa' : 'Alta de Nueva Empresa'}</h2>
            {!isEdit && <p className="text-white/30 text-xs mt-0.5">Completa los datos de la empresa y asigna las credenciales de acceso</p>}
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          {/* ── Sección: Datos de la empresa */}
          <div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="flex-1 border-t border-white/5" />Datos de la Empresa<span className="flex-1 border-t border-white/5" />
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nombre Comercial *">
                  <Input name="name" value={form.name} onChange={set} placeholder="Ej: Parqueaderos del Norte S.A." />
                </Field>
              </div>
              <Field label="NIT / Documento">
                <Input name="documentId" value={form.documentId} onChange={set} placeholder="900123456-7" />
              </Field>
              <Field label="Teléfono">
                <Input name="phone" value={form.phone} onChange={set} placeholder="+57 300 000 0000" />
              </Field>
              <div className="col-span-2">
                <Field label="Email de Contacto Comercial">
                  <Input name="contactEmail" value={form.contactEmail} onChange={set} type="email" placeholder="gerencia@empresa.com" />
                </Field>
              </div>
              <div className={isEdit ? 'col-span-1' : 'col-span-2'}>
                <Field label="Plan *">
                  <select name="planId" value={form.planId} onChange={set}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                    <option value="" className="bg-[#111]">— Seleccionar plan —</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#111]">{p.name} — {formatCOP(p.price)}/mes</option>
                    ))}
                  </select>
                </Field>
              </div>
              {isEdit && (
                <div className="col-span-2 space-y-3 mt-4">
                  <p className="text-white/20 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <span className="flex-1 border-t border-white/5" />Vigencia de Suscripción<span className="flex-1 border-t border-white/5" />
                  </p>
                  
                  <div className="flex gap-2">
                    {[
                      { label: 'Demo 5D', days: 5, template: 'DEMO' },
                      { label: 'Mensual', days: 30, template: 'MENSUAL' },
                      { label: 'Trimestral', days: 90, template: 'TRIMESTRAL' },
                      { label: 'Anual', days: 365, template: 'ANUAL' }
                    ].map(t => (
                      <button type="button" key={t.label} onClick={() => {
                        const start = new Date();
                        const end = new Date();
                        end.setDate(end.getDate() + t.days);
                        setForm(f => ({
                          ...f,
                          subscriptionStart: start.toISOString().split('T')[0],
                          subscriptionEnd: end.toISOString().split('T')[0],
                          planTemplate: t.template
                        }));
                      }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${form.planTemplate === t.template ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Inicio Suscripción">
                      <Input name="subscriptionStart" type="date" value={form.subscriptionStart} onChange={set} />
                    </Field>
                    <Field label="Fin Suscripción">
                      <Input name="subscriptionEnd" type="date" value={form.subscriptionEnd} onChange={set} />
                    </Field>
                    <Field label="Estado Suscripción">
                      <select name="subscriptionStatus" value={form.subscriptionStatus} onChange={set}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors">
                        {['TRIAL','ACTIVE','PAST_DUE','SUSPENDED'].map(s => (
                          <option key={s} value={s} className="bg-[#111]">{s}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Sección: Credenciales del administrador (solo al crear) */}
          {!isEdit && (
            <div>
              <p className="text-white/20 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="flex-1 border-t border-white/5" />Credenciales de Acceso del Administrador<span className="flex-1 border-t border-white/5" />
              </p>
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-blue-400 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-blue-400/80 text-xs">Estas credenciales son las que tú asignas al cliente para que acceda al sistema. Guárdalas y compártelas de forma segura.</p>
                </div>
                <Field label="Nombre del Administrador *">
                  <Input name="adminName" value={form.adminName} onChange={set} placeholder="Ej: Carlos Martínez" />
                </Field>
                <Field label="Email de Acceso al Sistema *">
                  <Input name="adminEmail" value={form.adminEmail} onChange={set} type="email" placeholder="admin@empresa.com" />
                </Field>
                <Field label="Contraseña Inicial *">
                  <div className="relative">
                    <Input name="adminPassword" value={form.adminPassword} onChange={set}
                      type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPass
                        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Empresa y Credenciales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal
export default function SuperAdminTenants() {
  const [tenants, setTenants]     = useState([]);
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('ALL');

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([api.get('/tenants'), api.get('/plans')]);
      setTenants(t); setPlans(p);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleStatus(id, currentIsActive) {
    if (!confirm(`¿${currentIsActive ? 'Suspender' : 'Reactivar'} este cliente?`)) return;
    try { await api.put(`/tenants/${id}/status`, { isActive: currentIsActive }); load(); }
    catch (err) { alert(err.message); }
  }

  async function handleImpersonate(tenantId, tenantName) {
    if (!confirm(`¿Entrar como admin de "${tenantName}"? Tus acciones quedarán registradas.`)) return;
    try {
      const data = await api.post(`/auth/impersonate/${tenantId}`);
      if (data.token) {
        localStorage.setItem('parkos_token', data.token);
        localStorage.setItem('parkos_user', JSON.stringify(data.user));
        window.location.href = '/admin/dashboard';
      }
    } catch (err) { alert(err.message); }
  }

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = t.name.toLowerCase().includes(q) || (t.contact_email || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || t.subscription_status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {modal && <TenantModal tenant={modal.tenant} plans={plans} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}

      <div className="p-8 space-y-6 max-w-[1400px]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Empresas Clientes</h1>
            <p className="text-white/30 text-sm mt-1">Directorio de tenants — {tenants.length} registradas</p>
          </div>
          <button onClick={() => setModal({ tenant: null })}
            className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-white/90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Empresa
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL','TRIAL','ACTIVE','PAST_DUE','SUSPENDED'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === s ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}>
                {s === 'ALL' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" /></div>
        ) : (
          <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Empresa','Plan','Estado','Límites','Contacto','Acciones'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-white/30 text-xs font-medium uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${!t.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="text-white font-semibold">{t.name}</p>
                      <p className="text-white/30 text-xs font-mono">{t.document_id || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-blue-400 font-bold text-xs">{t.plan_name}</span>
                      <p className="text-white/20 text-xs">{formatCOP(t.plan_price)}/mes</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATUS_STYLE[t.subscription_status] || ''}`}>
                        {t.subscription_status}
                      </span>
                      {t.subscription_end && (
                        <p className="text-white/30 text-[10px] mt-1">Hasta: {new Date(t.subscription_end).toLocaleDateString('es-CO')}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white/50 text-xs">{t.max_sedes} sedes</p>
                      <p className="text-white/50 text-xs">{t.max_users} usuarios</p>
                    </td>
                    <td className="px-5 py-4"><span className="text-white/50 text-xs">{t.contact_email || '—'}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ tenant: t })} title="Editar"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleImpersonate(t.id, t.name)} disabled={!t.is_active} title="Entrar como Admin"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                        </button>
                        <button onClick={() => handleToggleStatus(t.id, t.is_active)} title={t.is_active ? 'Suspender' : 'Reactivar'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${t.is_active ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'}`}>
                          {t.is_active
                            ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-white/20 text-sm">No hay resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
