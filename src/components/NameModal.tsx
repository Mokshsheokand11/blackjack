import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, X, Check } from 'lucide-react';

interface NameModalProps {
    currentName: string;
    onSave: (name: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export const NameModal: React.FC<NameModalProps> = ({ currentName, onSave, onClose, isOpen }) => {
    const [name, setName] = useState(currentName);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-sm bg-[#151619] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(242,125,38,0.2)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center">
                                        <User className="text-black w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold uppercase tracking-tight">Your Identity</h2>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">How the House knows you</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 block">Player Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        maxLength={20}
                                        placeholder="Enter your name..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F27D26]/50 transition-colors font-bold"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!name.trim()}
                                    className="w-full py-4 bg-[#F27D26] text-black font-extrabold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#ff8c3a] transition-all active:scale-[0.98] disabled:opacity-30"
                                >
                                    <Check className="w-5 h-5" />
                                    Save Name
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
