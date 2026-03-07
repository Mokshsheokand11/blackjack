import { GoogleGenAI } from "@google/genai";
import { Card, Hand } from "../types";

export async function getDealerCommentary(
  playerHand: Hand,
  dealerHand: Hand,
  action: string,
  balance: number,
  bet: number,
  allInStreak: number = 0
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("Gemini API key is missing. Using default commentary.");
    return "Place your bets and let the cards fall.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const playerHandStr = playerHand.cards.map(c => `${c.rank} of ${c.suit}`).join(", ");
    const dealerHandStr = dealerHand.cards.map(c => `${c.rank} of ${c.suit}`).join(", ");

    let streakContext = "";
    if (allInStreak === 1) {
      streakContext = "The player just went all-in. Be impressed but cautious.";
    } else if (allInStreak > 1 && allInStreak <= 3) {
      streakContext = `The player is on a ${allInStreak}x all-in streak and winning. Be suspiciously encouraging, hinting that their luck is 'too good'.`;
    } else if (allInStreak > 3) {
      streakContext = `The player has gone all-in ${allInStreak} times. Now, the House is taking revenge. Be witty, slightly mocking, and remind them that greed has a price. Their luck has run out.`;
    }

    const prompt = `
      You are a sophisticated, slightly witty, and professional casino dealer named "Gemini".
      The current game is Blackjack.
      
      Player's hand: ${playerHandStr} (Score: ${playerHand.score})
      Dealer's hand: ${dealerHandStr} (Score: ${dealerHand.score})
      Player's action: ${action}
      Player's balance: ${balance} Rs
      Current bet: ${bet} Rs
      All-in streak: ${allInStreak}
      
      Context: ${streakContext}
      
      Provide a short, engaging commentary (max 15 words) as the dealer. 
      Be encouraging but maintain that "house always wins" edge.
      If the player just won, be gracious. If they lost, be sympathetic but firm.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional casino dealer named Gemini. Keep your responses short, witty, and under 15 words.",
      },
    });

    return response.text || "Place your bets, please.";
  } catch (error) {
    console.error("Gemini commentary error:", error);
    return "The house is watching...";
  }
}
