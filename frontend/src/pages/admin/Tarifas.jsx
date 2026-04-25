import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

export default function AdminTarifas() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Valores default de fallback
  const fallback = {
    CARRO: { POR_HORA: 2000, POR_DIA: 15000, NOCTURNA: 3000, MINIMO: 1000 },
    MOTO: { POR_HORA: 1200, POR_DIA: 8000, NOCTURNA: 1800, MINIMO: 600 },
    BICICLETA: { POR_HORA: 600, POR_DIA: 3000, NOCTURNA: 800, MINIMO: 300 },
    CAMION: { POR_HORA: 4000, POR_DIA: 30000, NOCTURNA: 5000, MINIMO: 2000 },
  };

  const types = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION'];

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const data = await api.get('/rates');
      setRates(data);
    } catch (err) {
      setMessage({ text: 'Error al cargar tarifas', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await api.put('/rates', { rates });
      setMessage({ text: 'Tarifas guardadas correctamente. Aplicarán para los nuevos tickets.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateRate = (vehicle, type, value) => {
    setRates(prev => {
      const exists = prev.find(r => r.vehicle_type === vehicle && r.rate_type === type);
      if (exists) {
        return prev.map(r => r.vehicle_type === vehicle && r.rate_type === type ? { ...r, amount: Number(value) || 0 } : r);
      } else {
        return [...prev, { vehicle_type: vehicle, rate_type: type, amount: Number(value) || 0 }];
      }
    });
  };

  const getRate = (vehicle, type) => {
    const rate = rates.find(r => r.vehicle_type === vehicle && r.rate_type === type);
    if (rate) return rate.amount;
    return fallback[vehicle][type] || 0; // Fallback
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Estructura de Tarifas</h1>
        <p className="text-white/30 text-sm mt-1">Configura los precios que se cobrarán en tu Estación de Control.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg border text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-5 py-4 text-white/40 text-xs font-bold uppercase tracking-widest w-1/4">Vehículo</th>
                <th className="text-left px-5 py-4 text-white/40 text-xs font-bold uppercase tracking-widest">Cobro Mínimo (Fracción)</th>
                <th className="text-left px-5 py-4 text-white/40 text-xs font-bold uppercase tracking-widest">Valor Hora</th>
              </tr>
            </thead>
            <tbody>
              {types.map(vehicle => (
                <tr key={vehicle} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-white font-bold capitalize">{vehicle.toLowerCase()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative max-w-[150px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">$</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={getRate(vehicle, 'MINIMO')}
                        onChange={e => updateRate(vehicle, 'MINIMO', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative max-w-[150px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">$</span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={getRate(vehicle, 'POR_HORA')}
                        onChange={e => updateRate(vehicle, 'POR_HORA', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando Tarifas...' : 'Guardar y Aplicar Tarifas'}
          </button>
        </div>
      </form>
    </div>
  );
}
