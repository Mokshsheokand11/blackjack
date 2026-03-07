import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, User, Wallet, Calendar } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    onClose: () => void;
    isOpen: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onClose, isOpen }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-lg bg-[#151619] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(242,125,38,0.15)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#F27D26]/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
                                    <Trophy className="text-black w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold tracking-tight uppercase">Hall of Fame</h2>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Local High Stakes Legends</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {entries.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
                                    <p className="text-white/40 text-sm italic">No legends yet. Win big to be the first!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {entries.map((entry, index) => (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={cn(
                                                "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                                index === 0 ? "bg-[#F27D26]/5 border-[#F27D26]/20" : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs",
                                                    index === 0 ? "bg-[#F27D26] text-black" :
                                                        index === 1 ? "bg-gray-300 text-black" :
                                                            index === 2 ? "bg-orange-800 text-white" : "bg-white/10 text-white/60"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold flex items-center gap-2">
                                                        {entry.name}
                                                        {index === 0 && <Trophy className="w-3 h-3 text-[#F27D26]" />}
                                                    </span>
                                                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[#00FF00] font-mono font-bold text-lg">
                                                    ₹{entry.balance.toLocaleString()}
                                                </div>
                                                <div className="text-[9px] text-white/30 uppercase tracking-widest">Final Balance</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Your highest score is tracked automatically</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
