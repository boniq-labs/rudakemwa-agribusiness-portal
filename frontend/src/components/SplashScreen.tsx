import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (!imageLoaded) return;
    const timer = setTimeout(() => onComplete(), 3000);
    return () => clearTimeout(timer);
  }, [imageLoaded, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0f2d1e 0%, #07140c 50%, #030906 100%)',
      }}
    >
      {/* Farm background overlay */}
      <div className="absolute inset-0">
        <img
          src="/farm_background.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.08]"
          style={{ mixBlendMode: 'screen' }}
        />
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(15,45,30,0.2) 0%, rgba(7,20,12,0.4) 40%, rgba(3,9,6,1) 100%)',
          }} />
      </div>

      {/* Ambient glow layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #4ade80 0%, transparent 70%)' }} />
      </div>

      <div className="relative flex flex-col items-center px-6">
        {/* Circular Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 relative"
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-5 rounded-full"
            style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 60%)' }}
          />

          {/* Circle container */}
          <div
            className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 40% 30%, #1a4a2e, #0a1f12)',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.08), 0 0 0 1.5px rgba(74, 222, 128, 0.15), 0 0 0 1px rgba(255,255,255,0.06), 0 25px 70px rgba(0,0,0,0.55)',
            }}
          >
            {/* Inner subtle highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-1/2 rounded-full opacity-20"
              style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)' }} />

            <motion.img
              src="/assets/logo.png"
              alt="Rudakemwa Agribusiness Portal"
              onLoad={() => setImageLoaded(true)}
              className="relative z-10 w-[72%] h-[72%] object-contain"
            />
          </div>
        </motion.div>

        {/* Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <h1 className="text-3xl sm:text-[44px] font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-2xl">
            Rudakemwa Agribusiness Portal
          </h1>
          <div className="flex items-center justify-center gap-2 mt-5 mb-3">
            <span className="block w-6 h-px bg-gradient-to-r from-transparent to-green-400/40 rounded-full" />
            <span className="block w-1.5 h-1.5 rounded-full bg-green-400/50" />
            <span className="block w-6 h-px bg-gradient-to-l from-transparent to-green-400/40 rounded-full" />
          </div>
          <p className="text-green-400/65 font-semibold text-sm sm:text-base tracking-[0.12em] uppercase">
            Rudakemwa Agribusiness Portal
          </p>
        </motion.div>

        {/* Loading bar */}
        <AnimatePresence>
          {imageLoaded ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 160 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeInOut' }}
              className="h-[3px] rounded-full overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
                className="h-full rounded-full relative"
                style={{ background: 'linear-gradient(90deg, #16a34a, #22c55e, #4ade80)' }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
              />
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-500/35 text-xs tracking-[0.25em] uppercase font-medium"
            >
              Loading
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
