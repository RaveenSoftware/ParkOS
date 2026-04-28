import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const TYPE_ICON  = { CARRO: '🚗', MOTO: '🏍️', BICICLETA: '🚲' };
const RATES      = { CARRO: 100, MOTO: 60, BICICLETA: 30 };
const MIN_CHARGE = { CARRO: 1000, MOTO: 600, BICICLETA: 300 };

function formatCOP(n) {
  return Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatMinutes(mins) {
  if (!mins || mins < 0) mins = 0;
  if (mins < 60) return `${Math.floor(mins)} min`;
  const h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${h}h ${m}m`;
}

function estimate(type, mins) {
  if (!mins || mins < 0) mins = 0;
  const amt = Math.max(mins * RATES[type], MIN_CHARGE[type]);
  return formatCOP(amt);
}

function CheckoutModal({ ticket, onClose, onConfirm, checkingOut }) {
  const [form, setForm] = useState({
    clientName: ticket.client_name || '',
    clientDoc:  ticket.client_doc  || '',
  });
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-black text-lg">Cobrar Salida</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="text-center">
            <span className="text-4xl">{TYPE_ICON[ticket.vehicle_type] ?? '🚗'}</span>
            <p className="text-white font-black text-2xl tracking-widest mt-2">{ticket.plate}</p>
            <p className="text-gray-400 text-xs">
              Tiempo: {formatMinutes(ticket.minutes_so_far)}
              {ticket.spot_code && <span className="ml-2 text-indigo-400">· Plaza {ticket.spot_code}</span>}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-white/40 text-[10px] uppercase tracking-widest border-b border-white/5 pb-1">Datos de Facturación</p>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">👤 Nombre del Cliente</label>
              <input name="clientName" value={form.clientName} onChange={set} placeholder="Consumidor Final"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">🪪 Cédula / NIT</label>
              <input name="clientDoc" value={form.clientDoc} onChange={set} placeholder="999999999"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
          <div className="pt-2">
            <button onClick={() => onConfirm(form)} disabled={checkingOut}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20">
              {checkingOut ? '⏳ Procesando...' : '💳 Confirmar y Cobrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/tickets/open');
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  async function handleCheckout(billingData) {
    setCheckingOut(true);
    try {
      const result = await api.post(`/tickets/${selectedTicket.id}/checkout`, billingData);
      alert(`✅ Cobrado: ${formatCOP(result.amount)} por ${result.minutes_parked} minutos`);
      setSelectedTicket(null);
      load();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  const filtered = tickets.filter(t =>
    t.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {selectedTicket && (
        <CheckoutModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          onConfirm={handleCheckout} 
          checkingOut={checkingOut} 
        />
      )}
      <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Vehículos Dentro</h1>
          <p className="text-gray-400 text-sm mt-1">{tickets.length} vehículo{tickets.length !== 1 ? 's' : ''} en el parqueadero ahora</p>
        </div>
        <button
          onClick={() => navigate('/entrada')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          + Nueva Entrada
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por placa..."
        className="w-full max-w-sm bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
      />

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#1a1f2e] rounded-2xl animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <p className="text-5xl mb-4">🅿️</p>
          <p className="font-bold text-gray-400">Parqueadero vacío</p>
          <p className="text-sm mt-1">Registra la entrada de un vehículo para comenzar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <div key={ticket.id} className="bg-[#1a1f2e] border border-white/5 rounded-2xl px-6 py-5 flex items-center gap-6 hover:border-indigo-500/30 transition-all">
              <span className="text-3xl">{TYPE_ICON[ticket.vehicle_type] ?? '🚗'}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white font-black text-xl tracking-widest">{ticket.plate}</span>
                  <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-lg font-bold">{ticket.vehicle_type}</span>
                  {ticket.spot_code && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-bold border border-indigo-500/20">
                      🅿️ {ticket.spot_code}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Entrada: {new Date(ticket.entry_at).toLocaleTimeString('es-CO')} · Ticket #{ticket.id}
                  {ticket.client_name && <span className="ml-2">· 👤 {ticket.client_name}</span>}
                </p>
              </div>

              <div className="text-right">
                <p className="text-amber-400 font-black text-lg">{estimate(ticket.vehicle_type, ticket.minutes_so_far)}</p>
                <p className="text-gray-500 text-xs">{formatMinutes(ticket.minutes_so_far)}</p>
              </div>

              <button
                onClick={() => setSelectedTicket(ticket)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap shadow-lg shadow-emerald-600/20"
              >
                💳 Cobrar Salida
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
