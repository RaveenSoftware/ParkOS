import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      {/* Left panel - Static Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col relative overflow-hidden">
        {/* Logo overlay */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/50">P</div>
          <span className="text-white font-black text-2xl tracking-tight drop-shadow-md">ParkOS</span>
        </div>

        {/* 3D Illustration */}
        <div className="flex-1 flex items-center justify-center p-12 mt-8">
          <img 
            src="/login-illustration.png" 
            alt="ParkOS Illustration" 
            className="max-w-full max-h-[75%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
          />
        </div>
        
        {/* Bottom Text */}
        <div className="absolute bottom-16 left-12 right-12 text-center">
          <h2 className="text-4xl font-black text-white mb-3 drop-shadow-lg tracking-tight">
            Gestión inteligente de parqueaderos
          </h2>
          <p className="text-indigo-200 text-lg font-medium drop-shadow-md">
            Rapidez, control y seguridad en cada ticket.
          </p>
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
                placeholder="correo@empresa.com"
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
        </div>


      </div>
    </div>
  );
}
