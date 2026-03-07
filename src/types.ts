export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

export interface Hand {
  cards: Card[];
  score: number;
  isBusted: boolean;
  isBlackjack: boolean;
  isStood: boolean;
}

export type GameStatus = 'betting' | 'playing' | 'dealer-turn' | 'settled';

export interface RoundResult {
  id: string;
  playerScore: number;
  dealerScore: number;
  bet: number;
  payout: number;
  outcome: 'win' | 'loss' | 'push' | 'blackjack';
  timestamp: number;
}

export interface Stats {
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  totalHands: number;
  biggestWin: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  balance: number;
  stats: Stats;
  timestamp: number;
}

export interface LoanInfo {
  amount: number;
  interestRate: number;
  roundsRemaining: number;
  totalRepayment: number;
  isThreatened: boolean;
}

export interface GameState {
  deck: Card[];
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: Hand;
  balance: number;
  currentBet: number;
  status: GameStatus;
  message: string;
  dealerCommentary: string;
  consecutiveAllIns: number;
  history: RoundResult[];
  stats: Stats;
  leaderboard: LeaderboardEntry[];
  loan: LoanInfo | null;
  bankruptCount: number;
  isDead: boolean;
}
