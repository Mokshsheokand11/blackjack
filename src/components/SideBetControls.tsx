import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn';
import { playSound } from '../utils/sound';

interface SideBetControlsProps {
  balance: number;
  betAmounts: {
    perfectPairs: number;
    twentyOnePlusThree: number;
  };
  onAddBet: (type: 'perfectPairs' | 'twentyOnePlusThree', amount: number) => void;
  onClearBet: (type: 'perfectPairs' | 'twentyOnePlusThree') => void;
  disabled?: boolean;
}

export function SideBetControls({ balance, betAmounts, onAddBet, onClearBet, disabled }: SideBetControlsProps) {
  const CHIP_VALUES = [100, 500, 1000];

  const handleBetClick = (type: 'perfectPairs' | 'twentyOnePlusThree') => {
    if (disabled) return;
    const amount = 100; // Fixed increment for side bets to keep it simple
    if (balance >= amount) {
      onAddBet(type, amount);
      playSound('chip');
    }
  };

  return (
    <div className="flex gap-4 items-end">
      {/* Perfect Pairs Slot */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest">Pairs (25:1)</span>
        <div className="relative group">
          <button
            onClick={() => handleBetClick('perfectPairs')}
            disabled={disabled}
            className={cn(
              "w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden",
              betAmounts.perfectPairs > 0 
                ? "border-[#F27D26] bg-[#F27D26]/10 shadow-[0_0_20px_rgba(242,125,38,0.2)]" 
                : "border-white/10 hover:border-white/30 bg-white/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Sparkles className={cn(
              "w-6 h-6 mb-1",
              betAmounts.perfectPairs > 0 ? "text-[#F27D26]" : "text-white/20"
            )} />
            <span className="text-xs font-bold font-mono">
              {betAmounts.perfectPairs > 0 ? `₹${betAmounts.perfectPairs}` : "BET"}
            </span>
            
            {/* Animated Glow on Win/Active */}
            {betAmounts.perfectPairs > 0 && (
              <motion.div
                layoutId="glow-pairs"
                className="absolute inset-0 bg-gradient-to-t from-[#F27D26]/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </button>
          
          {betAmounts.perfectPairs > 0 && !disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearBet('perfectPairs'); }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 21+3 Slot */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] text-white/40 uppercase tracking-widest">21+3 (100:1)</span>
        <div className="relative group">
          <button
            onClick={() => handleBetClick('twentyOnePlusThree')}
            disabled={disabled}
            className={cn(
              "w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden",
              betAmounts.twentyOnePlusThree > 0 
                ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
                : "border-white/10 hover:border-white/30 bg-white/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className={cn(
              "w-6 h-6 mb-1",
              betAmounts.twentyOnePlusThree > 0 ? "text-blue-500" : "text-white/20"
            )} />
            <span className="text-xs font-bold font-mono">
              {betAmounts.twentyOnePlusThree > 0 ? `₹${betAmounts.twentyOnePlusThree}` : "BET"}
            </span>

            {betAmounts.twentyOnePlusThree > 0 && (
              <motion.div
                layoutId="glow-213"
                className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </button>

          {betAmounts.twentyOnePlusThree > 0 && !disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearBet('twentyOnePlusThree'); }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
