import React from 'react';
import { motion } from 'motion/react';
import { Stats } from '../types';
import { TrendingUp, Target, Award, BarChart2, Hash, Percent } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface StatsPanelProps {
    stats: Stats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
    const winRate = stats.totalHands > 0
        ? ((stats.wins / (stats.totalHands - stats.pushes || 1)) * 100).toFixed(1)
        : '0.0';

    const items = [
        { label: 'Total Hands', value: stats.totalHands, icon: Hash, color: 'text-blue-400' },
        { label: 'Win Rate', value: `${winRate}%`, icon: Percent, color: 'text-[#00FF00]' },
        { label: 'Biggest Win', value: `₹${stats.biggestWin.toLocaleString()}`, icon: TrendingUp, color: 'text-[#F27D26]' },
        { label: 'Blackjacks', value: stats.blackjacks, icon: Award, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <item.icon className={cn("w-3 h-3", item.color)} />
                            <span className="text-[10px] text-white/40 uppercase tracking-wider">{item.label}</span>
                        </div>
                        <div className="text-sm font-mono font-bold text-white">{item.value}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Breakdown</h5>
                <div className="flex flex-col gap-2">
                    <StatRow label="Wins" value={stats.wins} total={stats.totalHands} color="bg-[#00FF00]" />
                    <StatRow label="Losses" value={stats.losses} total={stats.totalHands} color="bg-red-500" />
                    <StatRow label="Pushes" value={stats.pushes} total={stats.totalHands} color="bg-white/40" />
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, value, total, color }: { label: string, value: number, total: number, color: string }) => {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-tighter">
                <span className="text-white/60">{label}</span>
                <span className="text-white/80 font-mono">{value}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={cn("h-full", color)}
                />
            </div>
        </div>
    );
};
