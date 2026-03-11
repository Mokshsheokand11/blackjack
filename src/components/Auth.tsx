import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Lock, User, ArrowRight, Loader2, Coins, Eye, EyeOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuthProps {
  onLogin: (userData: any) => void;
  apiUrl: string;
}

export function Auth({ onLogin, apiUrl }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const body = isLogin 
      ? { identifier, password } 
      : { name, [authMethod]: identifier, password };

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('blackjack_token', data.token);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-xl p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#111111] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#F27D26]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#F27D26]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-[#F27D26] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(242,125,38,0.4)]">
            <Coins className="text-black w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-white/40 text-sm mt-2 font-medium tracking-wide">
            {isLogin ? 'Login to access your high-stakes table' : 'Join the elite blackjack league'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#F27D26] transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="James Bond"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-white/10 focus:border-[#F27D26]/50 focus:bg-white/[0.08]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <button
                type="button"
                onClick={() => setAuthMethod(authMethod === 'email' ? 'phone' : 'email')}
                className="text-[10px] text-[#F27D26] uppercase tracking-widest font-bold hover:opacity-80 active:scale-95 transition-all"
              >
                Use {authMethod === 'email' ? 'Phone' : 'Email'}
              </button>
            </div>
            <div className="relative group">
              {authMethod === 'email' ? (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#F27D26] transition-colors" />
              ) : (
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#F27D26] transition-colors" />
              )}
              <input
                type={authMethod === 'email' ? 'email' : 'tel'}
                required
                placeholder={authMethod === 'email' ? 'name@example.com' : '+91 9876543210'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-white/10 focus:border-[#F27D26]/50 focus:bg-white/[0.08]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold ml-1">Secure Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#F27D26] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-white/10 focus:border-[#F27D26]/50 focus:bg-white/[0.08]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#F27D26] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-3 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F27D26] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#F27D26]/90 active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(242,125,38,0.3)] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Login Now' : 'Join the Club'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/40 text-xs font-medium tracking-wide">
            {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[#F27D26] font-bold hover:underline transition-all"
            >
              {isLogin ? 'Register Here' : 'Login Here'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
