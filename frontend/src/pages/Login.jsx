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
    <div className="min-h-screen bg-[#0f1117] flex flex-col lg:flex-row relative">
      {/* Top/Left panel - Static Illustration */}
      <div className="flex flex-col lg:flex-1 bg-transparent lg:bg-gradient-to-br lg:from-indigo-600 lg:via-violet-600 lg:to-purple-700 relative overflow-hidden shrink-0 pt-12 pb-4 lg:py-0 justify-start lg:justify-center items-center lg:items-stretch z-10">
        
        {/* Mobile Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[400px] bg-indigo-600/20 blur-[100px] rounded-full lg:hidden -z-10 pointer-events-none" />

        {/* Logo overlay */}
        <div className="static lg:absolute lg:top-12 lg:left-12 flex flex-col lg:flex-row items-center gap-3 mb-8 lg:mb-0 z-20">
          <div className="w-12 h-12 lg:w-10 lg:h-10 rounded-2xl bg-indigo-600 lg:bg-white/20 flex items-center justify-center text-white font-black text-xl lg:text-lg shadow-lg lg:shadow-indigo-500/50">P</div>
          <span className="text-white font-black text-3xl lg:text-2xl tracking-tight drop-shadow-md">ParkOS</span>
        </div>

        {/* 3D Illustration */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12 lg:mt-8 w-full max-w-[280px] lg:max-w-none">
          <img 
            src="/login-illustration.png" 
            alt="ParkOS Illustration" 
            className="w-full h-auto lg:max-h-[75%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
          />
        </div>
        
        {/* Bottom Text - Desktop only */}
        <div className="hidden lg:block absolute bottom-16 left-12 right-12 text-center z-20">
          <h2 className="text-4xl font-black text-white mb-3 drop-shadow-lg tracking-tight">
            Gestión inteligente de parqueaderos
          </h2>
          <p className="text-indigo-200 text-lg font-medium drop-shadow-md">
            Rapidez, control y seguridad en cada ticket.
          </p>
        </div>
      </div>

      {/* Bottom/Right panel - Form */}
      <div className="flex-1 flex items-start lg:items-center justify-center p-8 lg:p-8 z-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Iniciar Sesión</h2>
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
