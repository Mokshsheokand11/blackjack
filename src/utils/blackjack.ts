import { Card, Rank, Suit } from '../types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createDeck(numDecks: number = 6): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, isFaceUp: true });
      }
    }
  }
  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function getCardValue(rank: Rank): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
}

export function calculateScore(cards: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    const value = getCardValue(card.rank);
    if (card.rank === 'A') aces++;
    score += value;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && calculateScore(cards) === 21;
}

export function isBusted(score: number): boolean {
  return score > 21;
}

export function getDealerAction(score: number): 'hit' | 'stand' {
  return score < 17 ? 'hit' : 'stand';
}

export const getSideBetPayouts = () => ({
  perfectPairs: {
    perfect: 25,
    colored: 12,
    mixed: 6,
  },
  twentyOnePlusThree: {
    suitedTrips: 100,
    straightFlush: 40,
    threeOfAKind: 30,
    straight: 10,
    flush: 5,
  }
});

export function checkPerfectPairs(cards: Card[]): { payout: number; type: string } | null {
  if (cards.length < 2) return null;
  const [c1, c2] = cards;
  if (c1.rank !== c2.rank) return null;

  const payouts = getSideBetPayouts().perfectPairs;
  if (c1.suit === c2.suit) return { payout: payouts.perfect, type: 'Perfect Pair' };
  
  const isRed = (s: string) => ['hearts', 'diamonds'].includes(s);
  if (isRed(c1.suit) === isRed(c2.suit)) return { payout: payouts.colored, type: 'Colored Pair' };
  
  return { payout: payouts.mixed, type: 'Mixed Pair' };
}

export function checkTwentyOnePlusThree(playerCards: Card[], dealerCard: Card): { payout: number; type: string } | null {
  const cards = [...playerCards, dealerCard];
  const payouts = getSideBetPayouts().twentyOnePlusThree;

  const suits = cards.map(c => c.suit);
  const ranks = cards.map(c => c.rank);
  const values = ranks.map(r => getCardValue(r)).sort((a, b) => a - b);
  
  const isFlush = suits.every(s => s === suits[0]);
  
  // Straight logic (including A-2-3 and Q-K-A)
  const sortedValues = [...new Set(values)].sort((a, b) => a - b);
  let isStraight = false;
  if (sortedValues.length === 3) {
    if (sortedValues[2] - sortedValues[0] === 2) isStraight = true;
    // A-2-3 (A=11 becomes 1)
    if (ranks.includes('A') && ranks.includes('2') && ranks.includes('3')) isStraight = true;
  }

  const isThreeOfAKind = ranks.every(r => r === ranks[0]);
  const isSuitedTrips = isThreeOfAKind && isFlush;

  if (isSuitedTrips) return { payout: payouts.suitedTrips, type: 'Suited Triple' };
  if (isStraight && isFlush) return { payout: payouts.straightFlush, type: 'Straight Flush' };
  if (isThreeOfAKind) return { payout: payouts.threeOfAKind, type: 'Three of a Kind' };
  if (isStraight) return { payout: payouts.straight, type: 'Straight' };
  if (isFlush) return { payout: payouts.flush, type: 'Flush' };

  return null;
}
