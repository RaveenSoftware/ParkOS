import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { printTicket } from '../utils/printTicket';

const TYPE_ICON  = { CARRO: '🚗', MOTO: '🏍️', BICICLETA: '🚲', CAMION: '🚛' };
const RATES      = { CARRO: 100, MOTO: 60, BICICLETA: 30, CAMION: 200 };
const MIN_CHARGE = { CARRO: 1000, MOTO: 600, BICICLETA: 300, CAMION: 2000 };

function formatCOP(n) {
  return Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatDuration(mins) {
  if (!mins || mins < 0) mins = 0;
  const totalSecs = Math.floor(mins * 60);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function estimate(type, mins) {
  if (!mins || mins < 0) mins = 0;
  const rate = RATES[type] || RATES['CARRO'];
  const min = MIN_CHARGE[type] || MIN_CHARGE['CARRO'];
  const amt = Math.max(mins * rate, min);
  if (Number.isNaN(amt)) return '$ 0';
  return formatCOP(amt);
}

/* ─── Toast in-app notification ─────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = type === 'success'
    ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-300'
    : 'bg-red-900/90 border-red-500/40 text-red-300';

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-start gap-3 px-5 py-4 rounded-2xl border shadow-2xl backdrop-blur-md max-w-sm ${colors}`}
      style={{ animation: 'slideInRight 0.3s ease' }}>
      <span className="text-xl shrink-0">{type === 'success' ? '✅' : '❌'}</span>
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button onClick={onClose} className="ml-auto text-white/40 hover:text-white transition-colors text-lg leading-none">✕</button>
    </div>
  );
}

/* ─── Checkout Modal ─────────────────────────────────────────── */
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
              Tiempo: {formatDuration(ticket.minutes_so_far)}
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

/* ─── Main Page ──────────────────────────────────────────────── */
export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

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
      const dur = formatDuration(result.minutes_parked);
      showToast(`Cobrado: ${formatCOP(result.amount)} · Tiempo: ${dur}`, 'success');
      
      const user = (() => { try { return JSON.parse(localStorage.getItem('parkos_user') || '{}'); } catch { return {}; } })();
      printTicket({
        type: 'EXIT',
        tenantName: user.tenant_name || 'ParkOS',
        ticketId: result.id,
        plate: result.plate,
        vehicleType: result.vehicle_type,
        entryTime: result.entry_at,
        exitTime: result.exit_at,
        duration: dur,
        amount: formatCOP(result.amount),
        spotCode: result.spot_code || selectedTicket.spot_code,
        clientName: result.client_name,
        clientDoc: result.client_doc
      });
      
      setSelectedTicket(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCheckingOut(false);
    }
  }

  const filtered = tickets.filter(t =>
    t.plate.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* In-app Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {selectedTicket && (
        <CheckoutModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onConfirm={handleCheckout}
          checkingOut={checkingOut}
        />
      )}

      <div className="p-4 md:p-8 space-y-5 md:space-y-6">
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
                  <p className="text-gray-500 text-xs">{formatDuration(ticket.minutes_so_far)}</p>
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
