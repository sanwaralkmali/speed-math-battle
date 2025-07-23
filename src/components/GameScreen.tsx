import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState, GameType, PLAYER_KEYS, Question } from '@/types/game';
import { Trophy, Home, RotateCcw } from 'lucide-react';

interface GameScreenProps {
  gameType: GameType;
  playerNames: [string, string];
  onBackToDashboard: () => void;
}

export default function GameScreen({ gameType, playerNames, onBackToDashboard }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    players: [
      { name: playerNames[0], score: 0, color: 'player1' },
      { name: playerNames[1], score: 0, color: 'player2' }
    ],
    selectedAnswers: [null, null],
    gameStatus: 'playing',
    winner: null,
    questions: gameType.questions.slice(0, 10)
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTimeout, setFeedbackTimeout] = useState<NodeJS.Timeout | null>(null);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const isGameFinished = gameState.gameStatus === 'finished' || gameState.winner;

  const handleAnswer = useCallback((playerIndex: number, answerIndex: number) => {
    if (showFeedback || gameState.selectedAnswers[playerIndex] !== null) return;

    setGameState(prev => {
      const newSelectedAnswers = [...prev.selectedAnswers];
      newSelectedAnswers[playerIndex] = answerIndex;

      const newPlayers = [...prev.players];
      const isCorrect = answerIndex === currentQuestion.answerIndex;
      
      if (isCorrect) {
        newPlayers[playerIndex].score += 1;
      } else {
        newPlayers[playerIndex].score -= 1;
      }

      return {
        ...prev,
        selectedAnswers: newSelectedAnswers,
        players: [newPlayers[0], newPlayers[1]]
      };
    });

    setShowFeedback(true);

    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    
    const timeout = setTimeout(() => {
      setShowFeedback(false);
      setGameState(prev => {
        const nextQuestionIndex = prev.currentQuestionIndex + 1;
        
        // Check if game is finished
        if (nextQuestionIndex >= prev.questions.length) {
          const [player1, player2] = prev.players;
          
          // Check for sudden death
          if (player1.score === player2.score) {
            // Add sudden death question if available
            const allQuestions = gameType.questions;
            const suddenDeathQuestion = allQuestions[10]; // 11th question
            
            if (suddenDeathQuestion) {
              return {
                ...prev,
                currentQuestionIndex: nextQuestionIndex,
                questions: [...prev.questions, suddenDeathQuestion],
                selectedAnswers: [null, null],
                gameStatus: 'sudden-death'
              };
            }
          }
          
          const winner = player1.score > player2.score ? player1 : 
                        player2.score > player1.score ? player2 : null;
          
          return {
            ...prev,
            gameStatus: 'finished',
            winner
          };
        }

        return {
          ...prev,
          currentQuestionIndex: nextQuestionIndex,
          selectedAnswers: [null, null]
        };
      });
    }, 2000);

    setFeedbackTimeout(timeout);
  }, [showFeedback, gameState.selectedAnswers, currentQuestion, feedbackTimeout, gameType.questions]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showFeedback || isGameFinished) return;

      const player1KeyIndex = PLAYER_KEYS.player1.indexOf(event.code as any);
      const player2KeyIndex = PLAYER_KEYS.player2.indexOf(event.code as any);

      if (player1KeyIndex !== -1) {
        handleAnswer(0, player1KeyIndex);
      } else if (player2KeyIndex !== -1) {
        handleAnswer(1, player2KeyIndex);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
    };
  }, [handleAnswer, showFeedback, isGameFinished, feedbackTimeout]);

  const restartGame = () => {
    setGameState({
      currentQuestionIndex: 0,
      players: [
        { name: playerNames[0], score: 0, color: 'player1' },
        { name: playerNames[1], score: 0, color: 'player2' }
      ],
      selectedAnswers: [null, null],
      gameStatus: 'playing',
      winner: null,
      questions: gameType.questions.slice(0, 10)
    });
    setShowFeedback(false);
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
  };

  if (isGameFinished) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-gaming max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <Trophy className="w-20 h-20 mx-auto text-yellow-500 animate-pulse-glow" />
              {gameState.winner ? (
                <div>
                  <h1 className="text-4xl font-bold mb-2">🏆 Victory!</h1>
                  <p className="text-2xl">
                    <span className={`font-bold ${gameState.winner.color === 'player1' ? 'text-player1' : 'text-player2'}`}>
                      {gameState.winner.name}
                    </span>
                    {' '}wins!
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-bold mb-2">🤝 Tie Game!</h1>
                  <p className="text-2xl">Great match!</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg bg-gradient-player1 border border-player1/20`}>
                <div className="font-bold text-lg">{gameState.players[0].name}</div>
                <div className="text-2xl font-bold">{gameState.players[0].score}</div>
              </div>
              <div className={`p-4 rounded-lg bg-gradient-player2 border border-player2/20`}>
                <div className="font-bold text-lg">{gameState.players[1].name}</div>
                <div className="text-2xl font-bold">{gameState.players[1].score}</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={restartGame} variant="gaming" size="lg">
                <RotateCcw className="w-5 h-5 mr-2" />
                Restart Game
              </Button>
              <Button onClick={onBackToDashboard} variant="outline" size="lg">
                <Home className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-gaming p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Player Cards */}
        <div className="flex justify-between items-center">
          <Card className="bg-gradient-player1 border-player1/20 shadow-player1">
            <CardContent className="p-4">
              <div className="font-bold text-lg">{gameState.players[0].name}</div>
              <div className="text-2xl font-bold">{gameState.players[0].score}</div>
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}
              {gameState.gameStatus === 'sudden-death' && (
                <span className="text-yellow-500 font-bold ml-2">SUDDEN DEATH!</span>
              )}
            </div>
            <Button onClick={onBackToDashboard} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>

          <Card className="bg-gradient-player2 border-player2/20 shadow-player2">
            <CardContent className="p-4">
              <div className="font-bold text-lg">{gameState.players[1].name}</div>
              <div className="text-2xl font-bold">{gameState.players[1].score}</div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-gaming">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-3xl font-bold mb-4">{currentQuestion.question}</div>
            </div>
          </CardContent>
        </Card>

        {/* Option Cards */}
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            const player1Selected = gameState.selectedAnswers[0] === index;
            const player2Selected = gameState.selectedAnswers[1] === index;
            const isCorrect = index === currentQuestion.answerIndex;
            
            let cardClass = "relative h-20 transition-all duration-300 cursor-pointer border-2 ";
            
            if (showFeedback) {
              if (player1Selected && player2Selected) {
                cardClass += isCorrect ? "bg-green-500/50 border-green-500" : "bg-red-500/50 border-red-500 animate-shake";
              } else if (player1Selected) {
                cardClass += isCorrect ? "bg-green-500/50 border-green-500" : "bg-red-500/50 border-red-500 animate-shake";
              } else if (player2Selected) {
                cardClass += isCorrect ? "bg-green-500/50 border-green-500" : "bg-red-500/50 border-red-500 animate-shake";
              } else if (isCorrect) {
                cardClass += "bg-green-500/30 border-green-500/50";
              } else {
                cardClass += "bg-card/30 border-border";
              }
            } else {
              if (player1Selected && player2Selected) {
                cardClass += "bg-gradient-to-r from-player1/50 to-player2/50 border-primary";
              } else if (player1Selected) {
                cardClass += "bg-player1/50 border-player1";
              } else if (player2Selected) {
                cardClass += "bg-player2/50 border-player2";
              } else {
                cardClass += "bg-gradient-to-r from-player1/20 to-player2/20 border-border hover:border-primary/50";
              }
            }

            return (
              <Card key={index} className={cardClass}>
                <CardContent className="p-4 h-full flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-player1/20 rounded border border-player1/30 flex items-center justify-center font-mono font-bold text-sm">
                      {['Q', 'W', 'E', 'R'][index]}
                    </div>
                    <div className="font-semibold">{option}</div>
                  </div>
                  <div className="w-8 h-8 bg-player2/20 rounded border border-player2/30 flex items-center justify-center font-mono font-bold text-sm">
                    {['U', 'I', 'O', 'P'][index]}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}