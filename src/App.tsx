import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card as CardComponent } from './components/Card';
import { Card as CardType, GameState, Hand, GameStatus } from './types';
import { createDeck, calculateScore, isBlackjack, isBusted, getDealerAction } from './utils/blackjack';
import { getDealerCommentary } from './services/gemini';
import { Coins, RotateCcw, Play, Hand as HandIcon, Split, Square, TrendingUp, TrendingDown, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_BALANCE = 50000;
const MIN_BET = 100;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: createDeck(),
    playerHands: [{ cards: [], score: 0, isBusted: false, isBlackjack: false, isStood: false }],
    activeHandIndex: 0,
    dealerHand: { cards: [], score: 0, isBusted: false, isBlackjack: false, isStood: false },
    balance: INITIAL_BALANCE,
    currentBet: 0,
    status: 'betting',
    message: 'Place your bet to start!',
    dealerCommentary: 'Welcome to Gemini Blackjack. High stakes, high rewards.',
  });

  const [betInput, setBetInput] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to update game state
  const updateState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  // Start a new round
  const startRound = async () => {
    if (betInput < MIN_BET || betInput > gameState.balance) {
      updateState({ message: `Bet must be between ${MIN_BET} and ${gameState.balance} Rs.` });
      return;
    }

    setIsProcessing(true);
    const newDeck = createDeck();
    const pCard1 = newDeck.pop()!;
    const dCard1 = newDeck.pop()!;
    const pCard2 = newDeck.pop()!;
    const dCard2 = newDeck.pop()!;

    const playerHand: Hand = {
      cards: [pCard1, pCard2],
      score: calculateScore([pCard1, pCard2]),
      isBusted: false,
      isBlackjack: isBlackjack([pCard1, pCard2]),
      isStood: false,
    };

    const dealerHand: Hand = {
      cards: [dCard1, dCard2],
      score: calculateScore([dCard1, dCard2]),
      isBusted: false,
      isBlackjack: isBlackjack([dCard1, dCard2]),
      isStood: false,
    };

    const newBalance = gameState.balance - betInput;

    updateState({
      deck: newDeck,
      playerHands: [playerHand],
      activeHandIndex: 0,
      dealerHand,
      balance: newBalance,
      currentBet: betInput,
      status: playerHand.isBlackjack ? 'dealer-turn' : 'playing',
      message: playerHand.isBlackjack ? 'Blackjack!' : 'Your turn...',
    });

    // Get initial commentary
    const commentary = await getDealerCommentary(playerHand, dealerHand, 'deal', newBalance, betInput);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  // Player action: Hit
  const handleHit = async () => {
    if (gameState.status !== 'playing' || isProcessing) return;

    setIsProcessing(true);
    const newDeck = [...gameState.deck];
    const newCard = newDeck.pop()!;
    const currentHand = gameState.playerHands[gameState.activeHandIndex];
    const newCards = [...currentHand.cards, newCard];
    const newScore = calculateScore(newCards);
    const busted = isBusted(newScore);

    const updatedHand: Hand = {
      ...currentHand,
      cards: newCards,
      score: newScore,
      isBusted: busted,
      isStood: busted,
    };

    const newPlayerHands = [...gameState.playerHands];
    newPlayerHands[gameState.activeHandIndex] = updatedHand;

    const allHandsDone = newPlayerHands.every(h => h.isStood || h.isBusted);

    updateState({
      deck: newDeck,
      playerHands: newPlayerHands,
      status: allHandsDone ? 'dealer-turn' : 'playing',
      message: busted ? 'Busted!' : 'Hit again or stand?',
    });

    const commentary = await getDealerCommentary(updatedHand, gameState.dealerHand, 'hit', gameState.balance, gameState.currentBet);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  // Player action: Stand
  const handleStand = async () => {
    if (gameState.status !== 'playing' || isProcessing) return;

    setIsProcessing(true);
    const newPlayerHands = [...gameState.playerHands];
    newPlayerHands[gameState.activeHandIndex].isStood = true;

    const nextHandIndex = gameState.activeHandIndex + 1;
    const hasMoreHands = nextHandIndex < newPlayerHands.length;

    updateState({
      playerHands: newPlayerHands,
      activeHandIndex: hasMoreHands ? nextHandIndex : gameState.activeHandIndex,
      status: hasMoreHands ? 'playing' : 'dealer-turn',
      message: hasMoreHands ? `Hand ${nextHandIndex + 1}'s turn` : 'Dealer\'s turn...',
    });

    const commentary = await getDealerCommentary(newPlayerHands[gameState.activeHandIndex], gameState.dealerHand, 'stand', gameState.balance, gameState.currentBet);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  // Player action: Split
  const handleSplit = async () => {
    const currentHand = gameState.playerHands[gameState.activeHandIndex];
    if (
      gameState.status !== 'playing' ||
      isProcessing ||
      currentHand.cards.length !== 2 ||
      currentHand.cards[0].rank !== currentHand.cards[1].rank ||
      gameState.balance < gameState.currentBet
    ) return;

    setIsProcessing(true);
    const newDeck = [...gameState.deck];
    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];

    const newCard1 = newDeck.pop()!;
    const newCard2 = newDeck.pop()!;

    const hand1: Hand = {
      cards: [card1, newCard1],
      score: calculateScore([card1, newCard1]),
      isBusted: false,
      isBlackjack: false,
      isStood: false,
    };

    const hand2: Hand = {
      cards: [card2, newCard2],
      score: calculateScore([card2, newCard2]),
      isBusted: false,
      isBlackjack: false,
      isStood: false,
    };

    updateState({
      deck: newDeck,
      playerHands: [hand1, hand2],
      balance: gameState.balance - gameState.currentBet,
      message: 'Hands split! Playing first hand...',
    });

    const commentary = await getDealerCommentary(hand1, gameState.dealerHand, 'split', gameState.balance - gameState.currentBet, gameState.currentBet);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  // Dealer's Turn Logic
  useEffect(() => {
    if (gameState.status === 'dealer-turn') {
      const runDealerTurn = async () => {
        setIsProcessing(true);
        let currentDealerHand = { ...gameState.dealerHand };
        let currentDeck = [...gameState.deck];

        // Dealer hits until 17
        while (getDealerAction(currentDealerHand.score) === 'hit') {
          await new Promise(r => setTimeout(r, 800)); // Delay for effect
          const newCard = currentDeck.pop()!;
          const newCards = [...currentDealerHand.cards, newCard];
          const newScore = calculateScore(newCards);
          currentDealerHand = {
            cards: newCards,
            score: newScore,
            isBusted: isBusted(newScore),
            isBlackjack: isBlackjack(newCards),
            isStood: true,
          };

          setGameState(prev => ({
            ...prev,
            deck: currentDeck,
            dealerHand: currentDealerHand,
          }));
        }

        // Settle the game
        await new Promise(r => setTimeout(r, 500));
        settleGame(currentDealerHand);
      };

      runDealerTurn();
    }
  }, [gameState.status]);

  const settleGame = async (finalDealerHand: Hand) => {
    let totalPayout = 0;
    let winCount = 0;

    const newPlayerHands = gameState.playerHands.map(hand => {
      let resultMessage = '';
      if (hand.isBusted) {
        resultMessage = 'Lost (Busted)';
      } else if (finalDealerHand.isBusted) {
        resultMessage = 'Won! (Dealer Busted)';
        totalPayout += gameState.currentBet * 2;
        winCount++;
      } else if (hand.isBlackjack && !finalDealerHand.isBlackjack) {
        resultMessage = 'Blackjack! (3:2 Payout)';
        totalPayout += gameState.currentBet * 2.5;
        winCount++;
      } else if (hand.score > finalDealerHand.score) {
        resultMessage = 'Won!';
        totalPayout += gameState.currentBet * 2;
        winCount++;
      } else if (hand.score === finalDealerHand.score) {
        resultMessage = 'Push (Tie)';
        totalPayout += gameState.currentBet;
      } else {
        resultMessage = 'Lost';
      }
      return { ...hand, resultMessage };
    });

    if (winCount > 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F27D26', '#FFFFFF', '#00FF00']
      });
    }

    const finalBalance = gameState.balance + totalPayout;
    updateState({
      playerHands: newPlayerHands,
      balance: finalBalance,
      status: 'settled',
      message: totalPayout > 0 ? `You won ${totalPayout} Rs!` : 'Better luck next time.',
    });

    const commentary = await getDealerCommentary(newPlayerHands[0], finalDealerHand, 'settle', finalBalance, gameState.currentBet);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  const resetGame = () => {
    if (gameState.balance < MIN_BET) {
      updateState({
        balance: INITIAL_BALANCE,
        status: 'betting',
        message: 'Bankrupt! Here is another 50k Rs. Try again!',
      });
    } else {
      updateState({
        status: 'betting',
        message: 'Place your bet!',
        playerHands: [{ cards: [], score: 0, isBusted: false, isBlackjack: false, isStood: false }],
        dealerHand: { cards: [], score: 0, isBusted: false, isBlackjack: false, isStood: false },
        currentBet: 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#F27D26]/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F27D26] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)]">
            <Coins className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">BlackJack</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">Premium Casino Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Your Balance</p>
            <p className="text-2xl font-mono font-bold text-[#00FF00]">₹{gameState.balance.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        {/* Dealer Area */}
        <section className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/60">
                Dealer Gemini
              </span>
            </div>

            <div className="flex gap-4 min-h-[150px] items-center justify-center">
              <AnimatePresence mode="popLayout">
                {gameState.dealerHand.cards.map((card, idx) => (
                  <motion.div
                    key={`dealer-${idx}-${card.rank}-${card.suit}`}
                    initial={{ opacity: 0, y: -50, rotate: -10 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <CardComponent
                      card={card}
                      hidden={gameState.status === 'playing' && idx === 1}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {gameState.dealerHand.cards.length === 0 && (
                <div className="w-24 h-36 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-white/10">
                  <HandIcon className="w-8 h-8" />
                </div>
              )}
            </div>

            {gameState.dealerHand.cards.length > 0 && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black border border-white/20 px-3 py-1 rounded-full text-xs font-mono">
                {gameState.status === 'playing' ? '?' : gameState.dealerHand.score}
              </div>
            )}
          </div>

          {/* Gemini Commentary Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={gameState.dealerCommentary}
            className="max-w-md bg-[#151619] border border-white/10 p-4 rounded-2xl relative mt-4 shadow-2xl"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#151619] border-t border-l border-white/10 rotate-45" />
            <p className="text-sm italic text-white/80 text-center leading-relaxed">
              "{gameState.dealerCommentary}"
            </p>
          </motion.div>
        </section>

        {/* Game Message */}
        <div className="text-center py-4">
          <h2 className="text-3xl font-bold tracking-tighter uppercase italic text-[#F27D26]">
            {gameState.message}
          </h2>
        </div>

        {/* Player Area */}
        <section className="flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center gap-12">
            {gameState.playerHands.map((hand, hIdx) => (
              <div key={hIdx} className={cn(
                "flex flex-col items-center gap-4 p-6 rounded-3xl transition-all duration-500",
                gameState.activeHandIndex === hIdx && gameState.status === 'playing' ? "bg-white/5 ring-1 ring-[#F27D26]/50 shadow-[0_0_40px_rgba(242,125,38,0.1)]" : "opacity-60"
              )}>
                <div className="relative flex gap-4 min-h-[150px]">
                  <AnimatePresence mode="popLayout">
                    {hand.cards.map((card, cIdx) => (
                      <motion.div
                        key={`player-${hIdx}-${cIdx}-${card.rank}-${card.suit}`}
                        initial={{ opacity: 0, y: 50, rotate: 10 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        transition={{ delay: cIdx * 0.1 }}
                      >
                        <CardComponent card={card} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {hand.cards.length === 0 && (
                    <div className="w-24 h-36 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-white/10">
                      <HandIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {hand.cards.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-black border border-white/20 px-4 py-1 rounded-full text-sm font-mono font-bold">
                      {hand.score}
                    </div>
                    {hand.isBusted && <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Busted</span>}
                    {hand.isBlackjack && <span className="text-[#00FF00] text-[10px] font-bold uppercase tracking-widest">Blackjack</span>}
                    {/* @ts-ignore */}
                    {hand.resultMessage && <span className="text-[#F27D26] text-xs font-bold uppercase tracking-widest mt-1">{hand.resultMessage}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Controls Footer */}
      <footer className="p-8 bg-black/80 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {gameState.status === 'betting' ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setBetInput(Math.max(MIN_BET, betInput - 500))}
                  className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
                >
                  <TrendingDown className="w-5 h-5 text-white/60" />
                </button>

                <div className="flex flex-col items-center min-w-[200px]">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Current Bet</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-white/40 text-lg">₹</span>
                    <input
                      type="number"
                      value={betInput}
                      onChange={(e) => setBetInput(Math.min(gameState.balance, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="bg-transparent text-4xl font-mono font-bold text-center focus:outline-none w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setBetInput(Math.min(gameState.balance, betInput + 500))}
                  className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all"
                >
                  <TrendingUp className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetInput(Math.min(gameState.balance, amount))}
                    className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    +{amount}
                  </button>
                ))}
                <button
                  onClick={() => setBetInput(gameState.balance)}
                  className="px-4 py-2 rounded-full border border-[#F27D26]/30 text-[#F27D26] text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26]/10 transition-all"
                >
                  All In
                </button>
              </div>

              <button
                onClick={startRound}
                disabled={isProcessing || betInput < MIN_BET || betInput > gameState.balance}
                className="w-full max-w-sm py-4 bg-[#F27D26] text-black font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-[#ff8c3a] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(242,125,38,0.3)] transition-all active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                Deal Cards
              </button>
            </div>
          ) : gameState.status === 'playing' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleHit}
                disabled={isProcessing}
                className="py-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl flex flex-col items-center gap-1 hover:bg-gray-200 transition-all active:scale-95"
              >
                <HandIcon className="w-5 h-5" />
                <span>Hit</span>
              </button>

              <button
                onClick={handleStand}
                disabled={isProcessing}
                className="py-4 bg-[#151619] border border-white/20 text-white font-bold uppercase tracking-widest rounded-2xl flex flex-col items-center gap-1 hover:bg-white/5 transition-all active:scale-95"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Stand</span>
              </button>

              <button
                onClick={handleSplit}
                disabled={isProcessing || gameState.playerHands[gameState.activeHandIndex].cards.length !== 2 || gameState.playerHands[gameState.activeHandIndex].cards[0].rank !== gameState.playerHands[gameState.activeHandIndex].cards[1].rank || gameState.balance < gameState.currentBet}
                className="py-4 bg-[#151619] border border-white/20 text-white font-bold uppercase tracking-widest rounded-2xl flex flex-col items-center gap-1 hover:bg-white/5 disabled:opacity-20 transition-all active:scale-95"
              >
                <Split className="w-5 h-5" />
                <span>Split</span>
              </button>

              <div className="flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Active Bet</p>
                <p className="text-xl font-mono font-bold">₹{gameState.currentBet.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={resetGame}
                className="w-full max-w-sm py-4 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                <RotateCcw className="w-5 h-5" />
                New Round
              </button>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Round Complete</p>
            </div>
          )}
        </div>
      </footer>

      {/* Info Overlay */}
      <div className="fixed bottom-32 right-8 z-50 group">
        <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-[#151619] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-[#F27D26]">House Rules</h4>
          <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
            <li>Dealer stands on all 17s</li>
            <li>Blackjack pays 3:2</li>
            <li>Insurance not available</li>
            <li>Split pairs of same rank</li>
          </ul>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
          <Info className="w-5 h-5 text-white/40" />
        </button>
      </div>
    </div>
  );
}
