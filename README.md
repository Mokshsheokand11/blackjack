# BlackJack

A modern, visually stunning Blackjack web application built with React, Vite, and Tailwind CSS. It features a sleek dark mode UI, smooth animations with Motion (Framer Motion), and an AI-powered dealer with witty commentary using the Gemini API.

## Features

- **Classic Blackjack Rules:** Hit, Stand, Split, and Dealer hitting until 17.
- **AI Dealer Commentary:** The dealer ("Gemini") provides dynamic and contextual commentary based on the game state (requires Gemini API key).
- **Premium UI:** Beautiful dark theme with glowing accents, smooth transitions, and confetti celebrations upon winning.
- **Fast Development:** Scaffolded with Vite for lightning-fast HMR and building.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (v4)
- **Animations:** Motion (Framer Motion)
- **Icons:** Lucide React
- **AI Integrations:** Google GenAI API (`@google/genai`)
- **Other:** Canvas Confetti

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Gemini API Key (optional, but required for the AI dealer commentary)

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd blackjack
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup (Optional but recommended):**
   Create a \`.env\` file in the root directory and add your Gemini API Key.
   \`\`\`env
   GEMINI_API_KEY="your_api_key_here"
   \`\`\`
   *Note: If no API key is provided, the game will still function perfectly, but the dealer will use a default offline commentary.*

4. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser:**
   Navigate to \`http://localhost:3000\` (or the port specified in your console).

## Build for Production

To create a production-ready build:
\`\`\`bash
npm run build
\`\`\`
The build output will be placed in the \`dist\` directory, which you can then serve using any static site hosting service.

## License

This project is licensed under the MIT License.
