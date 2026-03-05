import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card as CardComponent } from './components/Card';
import { Card as CardType, GameState, Hand, GameStatus, RoundResult } from './types';
import { createDeck, calculateScore, isBlackjack, isBusted, getDealerAction } from './utils/blackjack';
import { getDealerCommentary } from './services/gemini';
import { Coins, RotateCcw, Play, Hand as HandIcon, Split, Square, TrendingUp, TrendingDown, Info, History } from 'lucide-react';
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
    dealerCommentary: 'Welcome to Blackjack. High stakes, high rewards. Go Risky or Go Home',
    consecutiveAllIns: 0,
    history: [],
  });

  // Persist balance and history
  useEffect(() => {
    const savedBalance = localStorage.getItem('blackjack_balance');
    const savedStreak = localStorage.getItem('blackjack_streak');
    const savedHistory = localStorage.getItem('blackjack_history');

    setGameState(prev => ({
      ...prev,
      balance: savedBalance ? parseInt(savedBalance) : prev.balance,
      consecutiveAllIns: savedStreak ? parseInt(savedStreak) : prev.consecutiveAllIns,
      history: savedHistory ? JSON.parse(savedHistory) : prev.history
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('blackjack_balance', gameState.balance.toString());
    localStorage.setItem('blackjack_streak', gameState.consecutiveAllIns.toString());
    localStorage.setItem('blackjack_history', JSON.stringify(gameState.history));
  }, [gameState.balance, gameState.consecutiveAllIns, gameState.history]);

  const [betChips, setBetChips] = useState<number[]>([]);
  const betInput = betChips.reduce((sum, chip) => sum + chip, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddChip = (amount: number) => {
    if (betInput + amount <= gameState.balance) {
      setBetChips(prev => [...prev, amount]);
    }
  };

  const handleUndoChip = () => {
    setBetChips(prev => prev.slice(0, -1));
  };

  const handleAllIn = () => {
    setBetChips([gameState.balance]);
  };

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
    let newConsecutiveAllIns = gameState.consecutiveAllIns || 0;

    if (betInput === gameState.balance) {
      if (gameState.balance === INITIAL_BALANCE && newConsecutiveAllIns === 0) {
        newConsecutiveAllIns = 1;
      } else if (newConsecutiveAllIns > 0) {
        newConsecutiveAllIns++;
      }
    } else {
      newConsecutiveAllIns = 0;
    }

    const newDeck = createDeck();
    let pCard1 = newDeck.pop()!;
    let dCard1 = newDeck.pop()!;
    let pCard2 = newDeck.pop()!;
    let dCard2 = newDeck.pop()!;

    if (newConsecutiveAllIns > 0 && newConsecutiveAllIns <= 3) {
      pCard1 = { suit: 'spades', rank: 'A', isFaceUp: true };
      pCard2 = { suit: 'spades', rank: 'K', isFaceUp: true };
      dCard1 = { suit: 'hearts', rank: '5', isFaceUp: true };
      dCard2 = { suit: 'hearts', rank: '7', isFaceUp: true };
    } else if (newConsecutiveAllIns > 3) {
      pCard1 = { suit: 'clubs', rank: '10', isFaceUp: true };
      pCard2 = { suit: 'clubs', rank: '6', isFaceUp: true };
      dCard1 = { suit: 'hearts', rank: 'A', isFaceUp: true };
      dCard2 = { suit: 'hearts', rank: 'K', isFaceUp: true };

      newDeck.push({ suit: 'diamonds', rank: '10', isFaceUp: true });
      newDeck.push({ suit: 'hearts', rank: '10', isFaceUp: true });
      newDeck.push({ suit: 'spades', rank: '10', isFaceUp: true });
      newDeck.push({ suit: 'clubs', rank: '10', isFaceUp: true });
    }

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
      consecutiveAllIns: newConsecutiveAllIns,
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

  // Player action: Double Down
  const handleDoubleDown = async () => {
    const currentHand = gameState.playerHands[gameState.activeHandIndex];
    if (
      gameState.status !== 'playing' ||
      isProcessing ||
      currentHand.cards.length !== 2 ||
      gameState.balance < gameState.currentBet
    ) return;

    setIsProcessing(true);
    const newBet = gameState.currentBet;
    const newBalance = gameState.balance - newBet;
    const totalBet = gameState.currentBet + newBet;

    const newDeck = [...gameState.deck];
    const newCard = newDeck.pop()!;
    const newCards = [...currentHand.cards, newCard];
    const newScore = calculateScore(newCards);
    const busted = isBusted(newScore);

    const updatedHand: Hand = {
      ...currentHand,
      cards: newCards,
      score: newScore,
      isBusted: busted,
      isStood: true,
    };

    const newPlayerHands = [...gameState.playerHands];
    newPlayerHands[gameState.activeHandIndex] = updatedHand;

    const nextHandIndex = gameState.activeHandIndex + 1;
    const hasMoreHands = nextHandIndex < newPlayerHands.length;

    updateState({
      deck: newDeck,
      playerHands: newPlayerHands,
      activeHandIndex: hasMoreHands ? nextHandIndex : gameState.activeHandIndex,
      balance: newBalance,
      currentBet: totalBet,
      status: hasMoreHands ? 'playing' : 'dealer-turn',
      message: busted ? 'Busted!' : (hasMoreHands ? `Hand ${nextHandIndex + 1}'s turn` : 'Dealer\'s turn...'),
    });

    const commentary = await getDealerCommentary(updatedHand, gameState.dealerHand, 'double', newBalance, totalBet);
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

    // Add to history
    const mainHand = newPlayerHands[0];
    const outcome = mainHand.isBlackjack ? 'blackjack' : (totalPayout > gameState.currentBet ? 'win' : (totalPayout === gameState.currentBet ? 'push' : 'loss'));

    const newHistoryEntry: RoundResult = {
      id: Math.random().toString(36).substr(2, 9),
      playerScore: mainHand.score,
      dealerScore: finalDealerHand.score,
      bet: gameState.currentBet,
      payout: totalPayout,
      outcome,
      timestamp: Date.now()
    };

    updateState({
      playerHands: newPlayerHands,
      balance: finalBalance,
      status: 'settled',
      message: totalPayout > 0 ? `You won ${totalPayout} Rs!` : 'Better luck next time.',
      history: [newHistoryEntry, ...gameState.history].slice(0, 10),
    });

    const commentary = await getDealerCommentary(newPlayerHands[0], finalDealerHand, 'settle', finalBalance, gameState.currentBet);
    updateState({ dealerCommentary: commentary });
    setIsProcessing(false);
  };

  const resetGame = () => {
    setBetChips([]);
    if (gameState.balance < MIN_BET) {
      updateState({
        balance: INITIAL_BALANCE,
        status: 'betting',
        message: 'Bankrupt! Here is another 50k Rs. Try again!',
        consecutiveAllIns: 0,
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
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Your Balance</p>
            <p className="text-2xl font-mono font-bold text-[#00FF00]">₹{gameState.balance.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 flex flex-col gap-4 md:gap-6 max-w-7xl mx-auto w-full justify-center">
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
                {gameState.status !== 'betting' && gameState.dealerHand.cards.map((card, idx) => (
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
        <div className="text-center py-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter uppercase italic text-[#F27D26]">
            {gameState.message}
          </h2>
        </div>

        {/* Betting Central Area */}
        {gameState.status === 'betting' && (
          <section className="flex-1 flex flex-col items-center justify-center gap-8 py-8 animate-in fade-in zoom-in duration-500">
            <div className="relative h-32 w-full flex flex-col items-center justify-end">
              <AnimatePresence>
                {betChips.map((chip, index) => (
                  <motion.div
                    key={`chip-main-${index}-${chip}`}
                    initial={{ y: -100, opacity: 0, scale: 0.5 }}
                    animate={{ y: -index * 4, opacity: 1, scale: 1.2 }}
                    exit={{ opacity: 0, scale: 0.5, y: 50 }}
                    className={cn(
                      "absolute w-16 h-16 rounded-full border-[4px] border-dashed border-white/20 shadow-[0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center font-bold text-sm ring-2 ring-black",
                      chip === 100 ? 'bg-gray-100 text-gray-900' :
                        chip === 500 ? 'bg-red-600 text-white' :
                          chip === 1000 ? 'bg-blue-600 text-white' :
                            chip === 10000 ? 'bg-green-600 text-white' :
                              chip === 25000 ? 'bg-purple-600 text-white' :
                                'bg-[#F27D26] text-black'
                    )}
                    style={{ bottom: 0, zIndex: index }}
                  >
                    {chip >= 1000 ? `${chip / 1000}k` : chip}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white/40 uppercase tracking-[0.3em]">Total Bet Amount</p>
              <motion.p
                key={betInput}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-6xl font-mono font-bold text-[#00FF00]"
              >
                ₹{betInput.toLocaleString()}
              </motion.p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={handleUndoChip}
                disabled={betChips.length === 0}
                title="Undo last chip"
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
              >
                <RotateCcw className="w-6 h-6 text-white/60" />
              </button>

              {[100, 500, 1000, 10000, 25000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAddChip(amount)}
                  disabled={betInput + amount > gameState.balance}
                  className={cn(
                    "w-14 h-14 rounded-full border-[3px] border-dashed border-white/20 font-bold text-sm hover:scale-110 active:scale-95 transition-all disabled:opacity-30 ring-2 ring-transparent hover:ring-white/40",
                    amount === 100 ? 'bg-gray-100 text-gray-900 border-gray-300 shadow-[0_5px_15px_rgba(255,255,255,0.1)]' :
                      amount === 500 ? 'bg-red-600 text-white border-red-400 shadow-[0_5px_15px_rgba(220,38,38,0.2)]' :
                        amount === 1000 ? 'bg-blue-600 text-white border-blue-400 shadow-[0_5px_15px_rgba(37,99,235,0.2)]' :
                          amount === 10000 ? 'bg-green-600 text-white border-green-400 shadow-[0_5_15px_rgba(16,185,129,0.2)]' :
                            amount === 25000 ? 'bg-purple-600 text-white border-purple-400 shadow-[0_5px_15px_rgba(147,51,234,0.2)]' : ''
                  )}
                >
                  {amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}

              <button
                onClick={handleAllIn}
                disabled={betInput === gameState.balance || gameState.balance === 0}
                className="px-6 py-2 h-14 rounded-full border-2 border-[#F27D26]/30 text-[#F27D26] text-xs font-bold uppercase tracking-widest hover:bg-[#F27D26]/10 active:scale-95 transition-all disabled:opacity-30"
              >
                All In
              </button>
            </div>

            <button
              onClick={startRound}
              disabled={isProcessing || betInput < MIN_BET || betInput > gameState.balance}
              className="w-full max-w-sm py-5 bg-[#F27D26] text-black font-extrabold uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-4 hover:bg-[#ff8c3a] disabled:opacity-20 shadow-[0_15px_40px_rgba(242,125,38,0.4)] transition-all active:scale-[0.98] mt-4"
            >
              <Play className="w-6 h-6 fill-current" />
              Deal Cards
            </button>
          </section>
        )}

        {/* Player Area - ONLY show if not betting */}
        {gameState.status !== 'betting' && (
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
        )}
      </main>

      {/* Controls Footer */}
      <footer className="p-4 md:p-8 bg-black/80 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {gameState.status === 'betting' ? (
            <div className="flex justify-center items-center gap-8 py-2">
              <div className="text-center">
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Your Balance</p>
                <p className="text-xl font-mono font-bold text-[#00FF00]">₹{gameState.balance.toLocaleString()}</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center text-white/60 text-[10px] uppercase tracking-widest">
                Select your chips and play
              </div>
            </div>
          ) : gameState.status === 'playing' ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <button
                onClick={handleHit}
                disabled={isProcessing}
                className="py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl flex flex-col items-center gap-1 hover:bg-gray-200 transition-all active:scale-95 shadow-lg"
              >
                <HandIcon className="w-5 h-5" />
                <span>Hit</span>
              </button>

              <button
                onClick={handleStand}
                disabled={isProcessing}
                className="py-4 bg-[#151619] border border-white/20 text-white font-bold uppercase tracking-widest rounded-xl flex flex-col items-center gap-1 hover:bg-white/5 transition-all active:scale-95 shadow-lg"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Stand</span>
              </button>

              <button
                onClick={handleDoubleDown}
                disabled={isProcessing || gameState.playerHands[gameState.activeHandIndex].cards.length !== 2 || gameState.balance < gameState.currentBet}
                className="py-4 bg-[#F27D26] text-black font-bold uppercase tracking-widest rounded-xl flex flex-col items-center gap-1 hover:bg-[#ff8c3a] disabled:opacity-20 transition-all active:scale-95 shadow-lg"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Double</span>
              </button>

              <button
                onClick={handleSplit}
                disabled={isProcessing || gameState.playerHands[gameState.activeHandIndex].cards.length !== 2 || gameState.playerHands[gameState.activeHandIndex].cards[0].rank !== gameState.playerHands[gameState.activeHandIndex].cards[1].rank || gameState.balance < gameState.currentBet}
                className="py-4 bg-[#151619] border border-white/20 text-white font-bold uppercase tracking-widest rounded-xl flex flex-col items-center gap-1 hover:bg-white/5 disabled:opacity-20 transition-all active:scale-95 shadow-lg"
              >
                <Split className="w-5 h-5" />
                <span>Split</span>
              </button>

              <div className="flex flex-col items-center justify-center border border-white/10 rounded-xl bg-white/5 md:col-span-1 col-span-2">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Active Bet</p>
                <p className="text-xl font-mono font-bold text-[#F27D26]">₹{gameState.currentBet.toLocaleString()}</p>
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

      {/* Info & History Overlay */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col gap-4 items-end">
        {/* History Panel */}
        <div className="group/history relative">
          <div className="absolute bottom-full right-0 mb-4 w-64 max-h-80 overflow-y-auto bg-[#151619]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover/history:opacity-100 transition-opacity pointer-events-none p-4 custom-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3 text-[#00FF00] flex items-center gap-2">
              <History className="w-3 h-3" /> Recent Hands
            </h4>
            <div className="space-y-2">
              {gameState.history.length === 0 && <p className="text-[10px] text-white/20 italic text-center py-4">No games played yet</p>}
              {gameState.history.map(round => (
                <div key={round.id} className="flex justify-between items-center text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-bold uppercase",
                      round.outcome === 'win' || round.outcome === 'blackjack' ? 'text-[#00FF00]' : round.outcome === 'push' ? 'text-white/60' : 'text-red-500'
                    )}>
                      {round.outcome}
                    </span>
                    <span className="text-white/40">{new Date(round.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="font-mono">P:{round.playerScore} vs D:{round.dealerScore}</div>
                    <div className="text-[#F27D26]">₹{round.payout}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-xl">
            <History className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="group/info relative">
          <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-[#151619] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none">
            <h4 className="text-xs font-bold uppercase tracking-widest mb-2 text-[#F27D26]">House Rules</h4>
            <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-4">
              <li>Dealer stands on all 17s</li>
              <li>Blackjack pays 3:2</li>
              <li>Insurance not available</li>
              <li>Split pairs of same rank</li>
              <li>Double down on initial deal</li>
            </ul>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-xl">
            <Info className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </div>
    </div>
  );
}
