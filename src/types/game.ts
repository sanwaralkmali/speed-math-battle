export interface Question {
  id?: number;
  wave?: number;
  question: string;
  choices: string[];
  answer: string;
  points?: number;
}

export interface GameType {
  type: string;
  title: string;
  questions: Question[];
}

export interface Skill {
  skill: string;
  title: string;
  gameTypes: GameType[];
}

export interface GameData {
  skills: Skill[];
}

export interface Player {
  name: string;
  score: number;
  color: string; // allow any string for color
}

export interface GameState {
  currentQuestionIndex: number;
  players: [Player, Player];
  selectedAnswers: (number | null)[];
  gameStatus: 'waiting' | 'playing' | 'finished' | 'sudden-death';
  winner: Player | null;
  questions: Question[];
}

export const PLAYER_KEYS = {
  player1: ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
  player2: ['KeyU', 'KeyI', 'KeyO', 'KeyP']
} as const;