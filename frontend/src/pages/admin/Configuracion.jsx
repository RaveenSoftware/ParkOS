import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminConfiguracion() {
  const [form, setForm] = useState({ commercialName: '', logoBase64: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'

  useEffect(() => {
    api.get('/config')
      .then(data => {
        if (data) {
          setForm({ commercialName: data.commercial_name || '', logoBase64: data.logo_base64 || '' });
        }
      })
      .catch(err => setMessage({ text: err.message, type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'El logo no debe superar los 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, logoBase64: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put('/config', form);
      setMessage({ text: 'Configuración guardada correctamente.', type: 'success' });
      window.dispatchEvent(new CustomEvent('configUpdated', { detail: form }));
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Configuración de la Empresa</h1>
        <p className="text-white/30 text-sm mt-1">Personaliza la identidad visual de tu plataforma y comprobantes.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-6">
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Nombre Comercial (Ticket)</label>
          <input
            type="text"
            value={form.commercialName}
            onChange={e => setForm(f => ({ ...f, commercialName: e.target.value }))}
            placeholder="Ej: Parking Center 24/7"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <p className="text-white/30 text-xs mt-2">Este nombre reemplazará el nombre legal en la Estación de Control y los tickets de impresión.</p>
        </div>

        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-widest mb-1.5 block">Logo de la Empresa</label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {form.logoBase64 ? (
                <img src={form.logoBase64} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white/20 text-xs text-center px-2">Sin Logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors cursor-pointer text-center">
                Subir Imagen
                <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileChange} />
              </label>
              <p className="text-white/30 text-xs">PNG, JPG o WEBP. Máx 2MB.<br/>Se mostrará en la navegación y en los tickets.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
