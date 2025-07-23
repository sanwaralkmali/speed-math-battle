import { useState } from 'react';
import Dashboard from './Dashboard';
import GameScreen from './GameScreen';
import { GameType } from '@/types/game';

type AppState = 'dashboard' | 'playing';

export default function SpeedDuelApp() {
  const [appState, setAppState] = useState<AppState>('dashboard');
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [playerNames, setPlayerNames] = useState<[string, string]>(['Player 1', 'Player 2']);

  const handleStartGame = (players: [string, string], selectedGameType: GameType) => {
    setPlayerNames(players);
    setGameType(selectedGameType);
    setAppState('playing');
  };

  const handleBackToDashboard = () => {
    setAppState('dashboard');
    setGameType(null);
  };

  if (appState === 'playing' && gameType) {
    return (
      <GameScreen
        gameType={gameType}
        playerNames={playerNames}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return <Dashboard onStartGame={handleStartGame} />;
}