import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Eye, EyeOff, Leaf, Loader2, Lock, User, ShieldCheck,
  Sun, Moon, Tractor, Trees, Sprout, ChevronRight, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_ROUTES: Record<string, string> = {
  owner: '/dashboard', farm_owner: '/dashboard', admin: '/dashboard',
  hr: '/hr/dashboard', accountant: '/accounting/dashboard', animal: '/animals/dashboard',
  veterinarian: '/veterinary/dashboard', milk: '/milk/dashboard',
  procurement: '/procurement/dashboard', logistics: '/logistics/dashboard',
  stock: '/stock/dashboard', sales: '/sales/dashboard', worker: '/employee/dashboard',
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.get('/settings').then((r) => setSettings(r.data.data || {})).catch(() => {});
  }, []);

  const systemName = settings.system_name || 'RUDAKEMWA';
  const farmName = settings.farm_name || 'Rudakemwa Agribusiness Portal';
  const farmLogo = settings.farm_logo || '/assets/logo.png';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  });

  if (user) {
    navigate(ROLE_ROUTES[user.role] || '/dashboard', { replace: true });
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const u = await login(data.username, data.password, data.rememberMe ?? false);
      toast.success('Login successful', { duration: 2000 });
      navigate(ROLE_ROUTES[u?.role] || '/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Login failed';
      setServerError(msg);
      toast.error(msg === 'Invalid username or password' ? 'Invalid username or password' : msg, { duration: 3000 });
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${darkMode ? 'bg-[#0a0f0a]' : 'bg-[#f8fafc]'}`}>
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
        className="w-full max-w-[1280px] h-[90vh] max-h-[820px] rounded-2xl lg:rounded-[24px] overflow-hidden shadow-2xl flex flex-col lg:flex-row bg-white"
        style={{
          boxShadow: '0 25px 80px rgba(0,0,0,0.08), 0 10px 30px rgba(0,0,0,0.04)',
        }}
      >
        {/* ============ LEFT PANEL ============ */}
        <div className="relative w-full lg:w-[40%] flex flex-col items-center justify-between p-8 sm:p-10 lg:p-12 overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, #0f2d1e 0%, #07140c 55%, #030906 100%)',
          }}
        >
          {/* Farm background image with overlay */}
          <div className="absolute inset-0">
            <img
              src="/farm_background.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-[0.12]"
              style={{ mixBlendMode: 'screen' }}
            />
            <div className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(15,45,30,0.3) 0%, rgba(7,20,12,0.6) 40%, rgba(3,9,6,0.95) 100%)',
              }} />
          </div>

          {/* Glow accents */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
              style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.04]"
              style={{ background: 'linear-gradient(0deg, #4ade80 0%, transparent 100%)' }} />
          </div>

          {/* Top spacer */}
          <div className="relative z-10" />

          {/* Logo + Branding */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Circle */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 relative"
            >
              <div className="absolute -inset-4 rounded-full opacity-[0.08]"
                style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />

              <div
                className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'radial-gradient(ellipse at 40% 30%, #1a4a2e, #0a1f12)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(74, 222, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.5)',
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-1/2 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)' }} />

                <img
                  src={farmLogo}
                  alt={farmName}
                  className="relative z-10 w-[72%] h-[72%] object-contain"
                />
              </div>
            </motion.div>

            {/* Brand Text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white tracking-tight leading-none drop-shadow-2xl">
                {systemName}
              </h1>
              <p className="text-green-400/70 font-semibold text-xs sm:text-sm mt-3 tracking-[0.15em] uppercase">
                {farmName}
              </p>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-2 mt-5 mb-3">
                <span className="block w-8 h-px bg-gradient-to-r from-transparent to-green-400/30 rounded-full" />
                <Leaf size={16} className="text-green-400/50" strokeWidth={2} />
                <span className="block w-8 h-px bg-gradient-to-l from-transparent to-green-400/30 rounded-full" />
              </div>

              <p className="text-green-50/50 text-sm font-light italic leading-relaxed">
                Smart Farming, Better Future
              </p>
            </motion.div>
          </div>

          {/* Bottom Farm Illustrations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative z-10 w-full flex items-center justify-center gap-6 sm:gap-8"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center backdrop-blur-sm">
                <Tractor size={20} className="text-green-400/60" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-white/30 tracking-widest uppercase">Farm</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center backdrop-blur-sm">
                <Trees size={20} className="text-green-400/60" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-white/30 tracking-widest uppercase">Fields</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center backdrop-blur-sm">
                <Sprout size={20} className="text-green-400/60" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-white/30 tracking-widest uppercase">Crops</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center backdrop-blur-sm">
                <Leaf size={20} className="text-green-400/60" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] text-white/30 tracking-widest uppercase">Green</span>
            </motion.div>
          </motion.div>
        </div>

        {/* ============ RIGHT PANEL ============ */}
        <div className={`relative w-full lg:w-[60%] flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 overflow-y-auto transition-colors duration-300 ${darkMode ? 'bg-[#111811]' : 'bg-white'}`}>
          {/* Dark Mode Toggle */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                darkMode
                  ? 'bg-white/10 text-yellow-400 hover:bg-white/15'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
            </motion.button>
          </div>

          <div className="w-full max-w-[400px]">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.9, 0.3, 1] }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
                  boxShadow: '0 4px 20px rgba(21, 128, 61, 0.25)',
                }}
              >
                <Leaf size={28} className="text-white" strokeWidth={2} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0.9, 0.3, 1] }}
              className="text-center mb-9"
            >
              <h2 className={`text-[30px] sm:text-[36px] font-extrabold tracking-[-0.025em] leading-[1.1] transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome Back!
              </h2>
              <div className="flex items-center justify-center gap-1.5 mt-3 mb-3">
                <span className="block w-6 h-0.5 rounded-full bg-gradient-to-r from-transparent to-[#16a34a]/40" />
                <span className="block w-1 h-1 rounded-full bg-[#16a34a]/50" />
                <span className="block w-6 h-0.5 rounded-full bg-gradient-to-l from-transparent to-[#16a34a]/40" />
              </div>
              <p className={`text-sm sm:text-[15px] leading-relaxed transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Sign in to continue to your account.
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-[18px]">
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50/90 backdrop-blur-sm text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200/60 font-medium overflow-hidden"
                    >
                      {serverError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username or Email
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 group-focus-within:text-[#16a34a] group-focus-within:scale-105 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <User size={17} strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      {...register('username')}
                      className={`w-full pl-[52px] pr-4 h-[50px] rounded-xl border-2 text-sm font-medium shadow-sm transition-all duration-200 focus:outline-none ${
                        darkMode
                          ? 'bg-gray-800/50 text-gray-100 border-gray-700 hover:border-gray-600 focus:border-[#16a34a] focus:shadow-[0_0_0_4px_rgba(22,163,74,0.08)] focus:bg-gray-800/80'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:border-[#16a34a] focus:shadow-[0_0_0_4px_rgba(22,163,74,0.12)] focus:bg-white'
                      } ${errors.username ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : ''}`}
                      placeholder=""
                    />
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 mt-1.5"
                    >
                      <AlertCircle size={12} strokeWidth={2.5} />
                      {errors.username.message}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className={`block text-sm font-semibold transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 group-focus-within:text-[#16a34a] group-focus-within:scale-105 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Lock size={17} strokeWidth={2} />
                    </div>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      {...register('password')}
                      className={`w-full pl-[52px] pr-12 h-[50px] rounded-xl border-2 text-sm font-medium shadow-sm transition-all duration-200 focus:outline-none ${
                        darkMode
                          ? 'bg-gray-800/50 text-gray-100 border-gray-700 hover:border-gray-600 focus:border-[#16a34a] focus:shadow-[0_0_0_4px_rgba(22,163,74,0.08)] focus:bg-gray-800/80'
                          : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 focus:border-[#16a34a] focus:shadow-[0_0_0_4px_rgba(22,163,74,0.12)] focus:bg-white'
                      } ${errors.password ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]' : ''}`}
                      placeholder=""
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-all duration-200 hover:scale-105 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showPwd ? <EyeOff size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 mt-1.5"
                    >
                      <AlertCircle size={12} strokeWidth={2.5} />
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      {...register('rememberMe')}
                      className={`h-4 w-4 rounded cursor-pointer transition-all duration-200 ${
                        darkMode
                          ? 'border-gray-600 bg-gray-800 text-[#15803d] focus:ring-[#15803d]'
                          : 'border-gray-300 text-[#15803d] focus:ring-[#15803d]'
                      }`}
                    />
                    <span className={`ml-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer select-none ${darkMode ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'}`}>
                      Remember Me
                    </span>
                  </label>
                  <a
                    href="#"
                    className="group inline-flex items-center gap-1 text-sm font-semibold text-[#15803d] hover:text-[#166534] transition-colors duration-200 relative after:absolute after:bottom-[-2px] after:left-0 after:h-px after:w-0 after:bg-[#15803d] after:transition-all after:duration-200 hover:after:w-full"
                  >
                    Forgot password?
                    <ChevronRight size={13} strokeWidth={2.5} className="-ml-0.5 translate-x-[-4px] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </a>
                </div>

                {/* Sign In Button */}
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98, y: 0 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full h-[52px] rounded-xl border border-transparent text-[15px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #15803d 0%, #1a8a4a 55%, #22c55e 100%)',
                      boxShadow: '0 4px 18px rgba(21, 128, 61, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #166534 0%, #15803d 55%, #1a8a4a 100%)';
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(21, 128, 61, 0.45)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #15803d 0%, #1a8a4a 55%, #22c55e 100%)';
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(21, 128, 61, 0.3)';
                      }
                    }}
                  >
                    {/* Top highlight */}
                    <div className="absolute top-0 inset-x-[2px] h-[1px] rounded-t-xl opacity-40 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                    {/* Shimmer sweep */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }} />
                    {/* Hover highlight */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
                    {isSubmitting ? (
                      <span className="relative z-10 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} /> Signing in...</span>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center gap-2.5"><Lock size={16} strokeWidth={2.5} /> Sign in</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>

            {/* Security Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 pt-6 border-t border-gray-100/80"
            >
              {/* Secure Access divider */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className={`block h-px flex-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
                <span className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Secure Access
                </span>
                <span className={`block h-px flex-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
              </div>

              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-sm transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50/90 border-gray-100/60'
                }`}>
                  <ShieldCheck size={14} className="text-[#16a34a]" strokeWidth={2} />
                  <span className={`text-[11px] font-medium transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Your data is protected and secure
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
