import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@parkos.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem('parkos_token', data.token);
        localStorage.setItem('parkos_user', JSON.stringify(data.user));
        
        // Redirect based on role
        if (data.user.role === 'SUPERADMIN') {
          navigate('/superadmin/dashboard');
        } else if (data.user.role === 'ADMIN_TENANT') {
          navigate('/admin/dashboard');
        } else {
          navigate('/pos/dashboard');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg">P</div>
          <span className="text-white font-black text-xl tracking-tight">ParkOS</span>
        </div>
        <div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Control total de<br />tu parqueadero
          </h1>
          <p className="text-indigo-200 text-lg font-medium">
            Registra entradas, controla salidas y visualiza ingresos en tiempo real.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['🚗', 'Entradas', 'Registro rápido'],['🎫', 'Tickets', 'Control en tiempo real'],['💰', 'Cobros', 'Cálculo automático']].map(([icon, title, sub]) => (
            <div key={title} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-white font-bold text-sm">{title}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl mb-6 lg:hidden">P</div>
            <h2 className="text-3xl font-black text-white mb-2">Iniciar Sesión</h2>
            <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-all"
                placeholder="admin@parkos.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-medium">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all text-sm tracking-wide shadow-lg shadow-indigo-600/30"
            >
              {loading ? 'Verificando...' : 'Entrar al Sistema →'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-xs mt-8">
            admin@parkos.com · admin123
          </p>
        </div>
      </div>
    </div>
  );
}
