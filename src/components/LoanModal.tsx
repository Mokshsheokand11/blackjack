import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface LoanModalProps {
    isOpen: boolean;
    bankruptCount: number;
    onTakeLoan: (amount: number) => void;
    onRefuse: () => void;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, bankruptCount, onTakeLoan, onRefuse }) => {
    const [amount, setAmount] = useState<number>(0);
    const maxLoan = 100000;
    const interestRate = bankruptCount === 0 ? 0.1 : 0.5;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount > 0 && amount <= maxLoan) {
            onTakeLoan(amount);
        }
    };

    const totalToPay = Math.round(amount * (1 + interestRate));

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full max-w-md bg-[#0a0a0a] border-2 border-red-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.2)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${bankruptCount === 0 ? 'bg-[#F27D26]/20' : 'bg-red-500/20'}`}>
                                    {bankruptCount === 0 ? (
                                        <Landmark className="text-[#F27D26] w-10 h-10" />
                                    ) : (
                                        <ShieldAlert className="text-red-500 w-10 h-10 animate-pulse" />
                                    )}
                                </div>
                                <h2 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${bankruptCount === 0 ? 'text-white' : 'text-red-500'}`}>
                                    {bankruptCount === 0 ? "Bank Emergency Loan" : "The Last Resort"}
                                </h2>
                                <p className="text-white/60 text-sm leading-relaxed max-w-[280px]">
                                    {bankruptCount === 0
                                        ? "You're broke. Gemini will lend you credits, but everything comes with a price."
                                        : "You're crawling back? Fine. But this time, if you fail, we don't just take your credits. We know where you live."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Loan Amount (Max 1L)</label>
                                        <span className="text-xs font-mono text-[#00FF00]">₹{amount.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max={maxLoan}
                                        step="1000"
                                        value={amount}
                                        onChange={(e) => setAmount(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#F27D26]"
                                    />
                                    <div className="flex justify-between text-[10px] text-white/20 font-mono">
                                        <span>1k</span>
                                        <span>50k</span>
                                        <span>100k</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Interest</p>
                                        <p className={`text-xl font-bold ${bankruptCount === 0 ? 'text-white' : 'text-red-500'}`}>{interestRate * 100}%</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Period</p>
                                        <p className="text-xl font-bold text-white">3 Games</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl border ${bankruptCount === 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                    <div className="flex items-center gap-3 mb-1">
                                        <AlertTriangle className={`w-4 h-4 ${bankruptCount === 0 ? 'text-orange-500' : 'text-red-500'}`} />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Total Repayment</p>
                                    </div>
                                    <p className="text-2xl font-mono font-black text-white">₹{totalToPay.toLocaleString()}</p>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={onRefuse}
                                        className="flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
                                    >
                                        Refuse
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={amount === 0}
                                        className={`flex-[2] py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-20 ${bankruptCount === 0
                                            ? 'bg-[#F27D26] text-black hover:bg-[#ff8c3a] shadow-[0_15px_30px_rgba(242,125,38,0.3)]'
                                            : 'bg-red-600 text-white hover:bg-red-500 shadow-[0_15px_30px_rgba(220,38,38,0.4)]'
                                            }`}
                                    >
                                        <Check className="w-6 h-6" />
                                        Accept
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
