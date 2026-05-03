import { useEffect, useState } from 'react';
import { api } from '../../api/client';

function formatCOP(n) {
  return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

const VEHICLE_ICONS = {
  CARRO: '🚗',
  MOTO: '🏍️',
  BICICLETA: '🚲',
  CAMION: '🚚'
};

const TYPES = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION'];
const FALLBACK = {
  CARRO: { POR_HORA: 2000, MINIMO: 1000 },
  MOTO: { POR_HORA: 1200, MINIMO: 600 },
  BICICLETA: { POR_HORA: 600, MINIMO: 300 },
  CAMION: { POR_HORA: 4000, MINIMO: 2000 },
};

export default function AdminTarifas() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Simulador state
  const [simVehicle, setSimVehicle] = useState('CARRO');
  const [simMinutes, setSimMinutes] = useState(45);

  useEffect(() => { loadRates(); }, []);

  const loadRates = async () => {
    try {
      const data = await api.get('/rates');
      setRates(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cargar tarifas' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/rates', { rates });
      setMessage({ type: 'success', text: 'Tarifas actualizadas. Aplicarán para los nuevos tickets cobrados.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const getRate = (vehicle, type) => {
    const rate = rates.find(r => r.vehicle_type === vehicle && r.rate_type === type);
    if (rate) return rate.amount;
    return FALLBACK[vehicle][type] || 0;
  };

  const updateRate = (vehicle, type, value) => {
    setRates(prev => {
      const exists = prev.find(r => r.vehicle_type === vehicle && r.rate_type === type);
      const numVal = Number(value) || 0;
      if (exists) {
        return prev.map(r => r.vehicle_type === vehicle && r.rate_type === type ? { ...r, amount: numVal } : r);
      }
      return [...prev, { vehicle_type: vehicle, rate_type: type, amount: numVal }];
    });
  };

  // Cálculo del simulador
  const simMinimo = getRate(simVehicle, 'MINIMO');
  const simHora = getRate(simVehicle, 'POR_HORA');
  let simTotal = 0;
  
  if (simMinutes > 0) {
    const h = Math.floor(simMinutes / 60);
    const m = simMinutes % 60;
    if (h === 0) {
      simTotal = simMinimo;
    } else {
      simTotal = h * simHora;
      if (m > 0) simTotal += simMinimo;
    }
  }

  // Formato para mostrar horas y minutos en el simulador
  const simHoursDisplay = Math.floor(simMinutes / 60);
  const simMinsDisplay = simMinutes % 60;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Estructura de Tarifas</h1>
        <p className="text-white/40 text-sm mt-1 max-w-2xl">
          Define cuánto cobrar por cada tipo de vehículo. La <b>Fracción (Base)</b> se cobra si el vehículo dura menos de una hora, o como recargo si se pasa de la hora exacta. La <b>Hora Completa</b> se cobra por cada 60 minutos iniciados.
        </p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-red-900/20 border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Lado Izquierdo: Configuración */}
        <div className="flex-1 w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TYPES.map(vehicle => (
              <div key={vehicle} className="bg-[#1a1f2e] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
                  <span className="text-3xl bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner">
                    {VEHICLE_ICONS[vehicle]}
                  </span>
                  <h3 className="text-lg font-black text-white capitalize tracking-wide">{vehicle.toLowerCase()}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                      <span>Fracción (Base)</span>
                      <span className="text-indigo-400">&lt; 1 Hora</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">$</span>
                      <input type="number" min="0" step="50" required
                        value={getRate(vehicle, 'MINIMO')}
                        onChange={e => updateRate(vehicle, 'MINIMO', e.target.value)}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                      <span>Hora Completa</span>
                      <span className="text-emerald-400">60 mins</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold">$</span>
                      <input type="number" min="0" step="50" required
                        value={getRate(vehicle, 'POR_HORA')}
                        onChange={e => updateRate(vehicle, 'POR_HORA', e.target.value)}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={saving}
              className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
              {saving ? '⏳ Guardando cambios...' : '💾 Guardar y Aplicar Tarifas'}
            </button>
          </div>
        </div>

        {/* Lado Derecho: Simulador (Sticky) */}
        <div className="w-full lg:w-[350px] shrink-0 sticky top-8">
          <div className="bg-gradient-to-br from-indigo-900/40 to-[#1a1f2e] border border-indigo-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decoración */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            
            <h2 className="text-white font-black text-lg flex items-center gap-2 mb-1">
              <span className="text-indigo-400">⚡</span> Simulador
            </h2>
            <p className="text-white/40 text-xs mb-6">Prueba cómo el sistema calculará los precios antes de guardar.</p>

            <div className="space-y-6 relative z-10">
              {/* Vehículo a simular */}
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Vehículo</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(v => (
                    <button key={v} type="button" onClick={() => setSimVehicle(v)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        simVehicle === v ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}>
                      {VEHICLE_ICONS[v]} {v.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiempo */}
              <div>
                <div className="flex items-end justify-between mb-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tiempo de estadía</label>
                  <span className="text-indigo-300 font-bold text-sm bg-indigo-900/30 px-2 py-0.5 rounded">
                    {simHoursDisplay > 0 && `${simHoursDisplay}h `}{simMinsDisplay}m
                  </span>
                </div>
                <input type="range" min="5" max="300" step="5"
                  value={simMinutes} onChange={e => setSimMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[9px] text-white/30 mt-1 font-bold">
                  <span>5m</span>
                  <span>5 hrs</span>
                </div>
              </div>

              {/* Resultado */}
              <div className="bg-[#0d1117]/80 rounded-2xl p-5 border border-white/5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3">Total a cobrar</p>
                <p className="text-4xl font-black text-white">{formatCOP(simTotal)}</p>
                
                <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Regla aplicada:</span>
                  </div>
                  {Math.floor(simMinutes / 60) === 0 ? (
                    <p className="text-emerald-400 text-xs font-bold bg-emerald-900/20 px-2 py-1 rounded inline-block">
                      Estadía corta (Fracción base)
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-indigo-400 text-xs font-bold bg-indigo-900/20 px-2 py-1 rounded inline-block">
                        {simHoursDisplay} Hora(s) completa(s)
                      </p>
                      {simMinsDisplay > 0 && (
                        <p className="text-amber-400 text-xs font-bold bg-amber-900/20 px-2 py-1 rounded inline-block ml-1">
                          + Fracción por {simMinsDisplay}m extra
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
