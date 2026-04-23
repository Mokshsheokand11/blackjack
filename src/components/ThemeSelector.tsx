import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, X, Check } from 'lucide-react';
import { TableTheme, CardBack } from '../types';
import { cn } from '../utils/cn';

interface ThemeSelectorProps {
  currentTheme: TableTheme;
  currentCardBack: CardBack;
  onThemeChange: (theme: TableTheme) => void;
  onCardBackChange: (back: CardBack) => void;
  onClose: () => void;
}

const THEMES: { id: TableTheme; name: string; color: string }[] = [
  { id: 'classic', name: 'Classic Green', color: '#0a3d1d' },
  { id: 'midnight', name: 'Midnight Blue', color: '#0f172a' },
  { id: 'royal', name: 'Royal Crimson', color: '#450a0a' },
  { id: 'cyber', name: 'Cyber Neon', color: '#09090b' },
];

const CARD_BACKS: { id: CardBack; name: string; color: string }[] = [
  { id: 'default', name: 'Classic Blue', color: '#1e40af' },
  { id: 'red', name: 'Ruby Red', color: '#991b1b' },
  { id: 'black', name: 'Onyx Black', color: '#171717' },
  { id: 'gold', name: 'Imperial Gold', color: '#854d0e' },
];

export function ThemeSelector({
  currentTheme,
  currentCardBack,
  onThemeChange,
  onCardBackChange,
  onClose,
}: ThemeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F27D26] rounded-lg flex items-center justify-center shadow-lg">
              <Palette className="text-black w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Table Customization</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest">Personalize your experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Table Themes */}
          <section>
            <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#F27D26] rounded-full" />
              Table Felt Color
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={cn(
                    "relative group p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden",
                    currentTheme === theme.id
                      ? "bg-white/10 border-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <div
                    className="w-12 h-12 rounded-full border border-white/10 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: theme.color }}
                  >
                    {currentTheme === theme.id && <Check className="w-6 h-6 text-white" />}
                  </div>
                  <span className="text-xs font-medium text-white/80">{theme.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Card Backs */}
          <section>
            <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#F27D26] rounded-full" />
              Card Back Design
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {CARD_BACKS.map((back) => (
                <button
                  key={back.id}
                  onClick={() => onCardBackChange(back.id)}
                  className={cn(
                    "relative group p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 overflow-hidden",
                    currentCardBack === back.id
                      ? "bg-white/10 border-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <div
                    className="w-12 h-16 rounded-md border border-white/10 shadow-lg flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: back.color }}
                  >
                    <div className="absolute inset-1 border border-white/20 rounded-sm flex items-center justify-center">
                      <div className="w-full h-full opacity-20" style={{
                        backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                        backgroundSize: '8px 8px'
                      }} />
                    </div>
                    {currentCardBack === back.id && <Check className="w-6 h-6 text-white relative z-10" />}
                  </div>
                  <span className="text-xs font-medium text-white/80">{back.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">
            Settings are saved automatically
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
