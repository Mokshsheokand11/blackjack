import React from 'react';
import { Card as CardType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card: CardType;
  className?: string;
  hidden?: boolean;
}

const SuitIcon = ({ suit }: { suit: CardType['suit'] }) => {
  switch (suit) {
    case 'hearts': return <span className="text-red-500">♥</span>;
    case 'diamonds': return <span className="text-red-500">♦</span>;
    case 'clubs': return <span className="text-black">♣</span>;
    case 'spades': return <span className="text-black">♠</span>;
  }
};

export const Card: React.FC<CardProps> = ({ card, className, hidden }) => {
  if (hidden) {
    return (
      <div className={cn(
        "w-24 h-36 bg-indigo-900 rounded-lg border-2 border-white/20 shadow-xl flex items-center justify-center relative overflow-hidden",
        "before:absolute before:inset-2 before:border before:border-white/10 before:rounded-md",
        "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] after:from-white/5",
        className
      )}>
        <div className="text-white/20 text-4xl font-bold rotate-45 select-none">G</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-24 h-36 bg-white rounded-lg border border-gray-200 shadow-lg flex flex-col p-2 relative select-none transition-transform hover:-translate-y-1",
      className
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("text-lg font-bold leading-none", card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black')}>
          {card.rank}
        </div>
        <div className="text-sm">
          <SuitIcon suit={card.suit} />
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center text-3xl">
        <SuitIcon suit={card.suit} />
      </div>
      
      <div className="flex justify-between items-end rotate-180">
        <div className={cn("text-lg font-bold leading-none", card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-500' : 'text-black')}>
          {card.rank}
        </div>
        <div className="text-sm">
          <SuitIcon suit={card.suit} />
        </div>
      </div>
    </div>
  );
};
