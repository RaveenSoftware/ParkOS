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
    <div className="min-h-screen bg-[#06080e] relative flex items-center justify-center overflow-hidden p-6">
      {/* Background Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-5xl bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden z-10 relative">
        
        {/* Left Side: Brand & Image */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col relative justify-between bg-gradient-to-br from-white/[0.04] to-transparent">
          {/* Subtle glow inside the left panel */}
          <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start relative z-10 mb-8 lg:mb-0">
            <img src="/logo.png" alt="Company Logo" className="h-20 lg:h-28 object-contain drop-shadow-lg" />
          </div>

          {/* 3D Illustration */}
          <div className="flex-1 flex items-center justify-center py-6 lg:py-12 relative z-10">
            <img 
              src="/login-illustration.png" 
              alt="ParkOS Illustration" 
              className="w-48 lg:w-auto lg:max-h-72 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
            />
          </div>

          {/* Bottom Text - Hidden on tiny screens, subtle on mobile/desktop */}
          <div className="relative z-10 text-center lg:text-left mt-4 lg:mt-0">
            <h2 className="text-xl lg:text-2xl font-black text-white mb-2">Plataforma SaaS Premium</h2>
            <p className="text-gray-400 text-xs lg:text-sm font-medium">Control total e inteligente de tu parqueadero, en una sola pantalla.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 lg:p-14 bg-[#0a0c13]/80 flex flex-col justify-center relative border-t lg:border-t-0 lg:border-l border-white/[0.05]">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-white mb-2">Bienvenido de nuevo</h2>
            <p className="text-gray-400 text-sm">Ingresa a tu cuenta para continuar al panel.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#06080e] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                placeholder="correo@empresa.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#06080e] border border-white/5 rounded-2xl px-5 py-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
