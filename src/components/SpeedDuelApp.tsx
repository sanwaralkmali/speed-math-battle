import { useState } from "react";
import Dashboard from "./Dashboard";
import GameScreen from "./GameScreen";
import { GameType } from "@/types/game";

// Helper to get the questions file path
function getQuestionsFile(skill: string) {
  return `/data/questions/${skill}.json`;
}

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    waves: [3, 3, 3, 1, 0], // 3 from wave 1, 3 from wave 2, 3 from wave 3, 1 from wave 4, 0 from wave 5
    total: 10,
  },
  medium: {
    waves: [2, 2, 2, 2, 2], // 2 from each wave 1-5
    total: 10,
  },
  hard: {
    waves: [1, 1, 2, 3, 3], // 1 from wave 1, 1 from wave 2, 2 from wave 3, 3 from wave 4, 3 from wave 5
    total: 10,
  },
};

type AppState = "dashboard" | "playing" | "loading";

export default function SpeedDuelApp() {
  const [appState, setAppState] = useState<AppState>("dashboard");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [playerNames, setPlayerNames] = useState<[string, string]>([
    "Player 1",
    "Player 2",
  ]);
  const [playerColors, setPlayerColors] = useState<[string, string]>([
    "blue",
    "green",
  ]);
  // Store last game params for rematch
  const [lastGameParams, setLastGameParams] = useState<any>(null);

  const handleStartGame = async ({
    player1Name,
    player2Name,
    player1Color,
    player2Color,
    skill,
    difficulty,
  }: {
    player1Name: string;
    player2Name: string;
    player1Color: string;
    player2Color: string;
    skill: string;
    difficulty: string;
  }) => {
    setAppState("loading");
    setLastGameParams({
      player1Name,
      player2Name,
      player1Color,
      player2Color,
      skill,
      difficulty,
    });
    try {
      const res = await fetch(getQuestionsFile(skill));
      if (!res.ok) throw new Error("Failed to load questions");
      const data = await res.json();

      // Group questions by wave
      const waves: Record<number, any[]> = {};
      for (const q of data.questions) {
        if (!waves[q.wave]) waves[q.wave] = [];
        waves[q.wave].push(q);
      }

      // Select questions based on difficulty
      const config =
        DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
      let selectedQuestions: any[] = [];

      for (let wave = 1; wave <= 5; wave++) {
        const questionsInWave = waves[wave] || [];
        const questionsToSelect = config.waves[wave - 1];

        if (questionsToSelect > 0 && questionsInWave.length > 0) {
          // Shuffle questions in this wave
          const shuffled = [...questionsInWave];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          // Take the required number of questions from this wave
          const waveQuestions = shuffled.slice(0, questionsToSelect);
          selectedQuestions = selectedQuestions.concat(waveQuestions);
        }
      }

      // Shuffle choices for each question and update answer
      function shuffleChoices(question: any) {
        const choices = [...question.choices];
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        // Update answer to match new choices
        return {
          ...question,
          choices,
          answer: question.answer, // keep as value, not index
        };
      }

      selectedQuestions = selectedQuestions.map(shuffleChoices);

      const gameType: GameType = {
        type: skill,
        title: data.title,
        questions: selectedQuestions,
      };

      setPlayerNames([player1Name, player2Name]);
      setPlayerColors([player1Color, player2Color]);
      setGameType(gameType);
      setAppState("playing");
    } catch (e) {
      alert("Failed to load questions for this skill.");
      setAppState("dashboard");
    }
  };

  const handleRematch = async () => {
    if (!lastGameParams) return;
    await handleStartGame(lastGameParams);
  };

  const handleBackToDashboard = () => {
    setAppState("dashboard");
    setGameType(null);
  };

  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-gaming">
        <div className="text-2xl font-bold animate-pulse-glow text-primary">
          Loading game...
        </div>
      </div>
    );
  }

  if (appState === "playing" && gameType) {
    return (
      <GameScreen
        gameType={gameType}
        playerNames={playerNames}
        playerColors={playerColors}
        onBackToDashboard={handleBackToDashboard}
        onRematch={handleRematch}
      />
    );
  }

  return <Dashboard onStartGame={handleStartGame} />;
}
