import { useState } from 'react';
import Dashboard from './Dashboard';
import GameScreen from './GameScreen';
import { GameType } from '@/types/game';

// Helper to get the questions file path
function getQuestionsFile(skill: string) {
  return `/data/questions/${skill}.json`;
}

type AppState = 'dashboard' | 'playing' | 'loading';

export default function SpeedDuelApp() {
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [playerNames, setPlayerNames] = useState<[string, string]>(['Player 1', 'Player 2']);
  const [playerColors, setPlayerColors] = useState<[string, string]>(['blue', 'green']);
  // Store last game params for rematch
  const [lastGameParams, setLastGameParams] = useState<any>(null);

  const handleStartGame = async ({ player1Name, player2Name, player1Color, player2Color, skill }: {
    player1Name: string;
    player2Name: string;
    player1Color: string;
    player2Color: string;
    skill: string;
  }) => {
    setAppState('loading');
    setLastGameParams({ player1Name, player2Name, player1Color, player2Color, skill });
    try {
      const res = await fetch(getQuestionsFile(skill));
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      // Select 2 random questions per wave (waves 1-5)
      const waves: Record<number, any[]> = {};
      for (const q of data.questions) {
        if (!waves[q.wave]) waves[q.wave] = [];
        waves[q.wave].push(q);
      }
      let selectedQuestions: any[] = [];
      for (let wave = 1; wave <= 5; wave++) {
        const qs = waves[wave] || [];
        for (let i = qs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [qs[i], qs[j]] = [qs[j], qs[i]];
        }
        selectedQuestions = selectedQuestions.concat(qs.slice(0, 2));
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
          answer: question.answer // keep as value, not index
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
      setAppState('playing');
    } catch (e) {
      alert('Failed to load questions for this skill.');
      setAppState('dashboard');
    }
  };

  const handleRematch = async () => {
    if (!lastGameParams) return;
    await handleStartGame(lastGameParams);
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
    setGameType(null);
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-gaming">
        <div className="text-2xl font-bold animate-pulse-glow text-primary">Loading game...</div>
      </div>
    );
  }

  if (appState === 'playing' && gameType) {
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