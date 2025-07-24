import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameState, GameType, PLAYER_KEYS, Question } from "@/types/game";
import { Trophy, Home, RotateCcw } from "lucide-react";
import { VictoryScreen } from "./VictoryScreen";

interface GameScreenProps {
  gameType: GameType;
  playerNames: [string, string];
  playerColors?: [string, string];
  onBackToDashboard: () => void;
  onRematch?: () => void;
}

// Utility to get a very light version of a color (rgba or blend)
function lightColor(color: string, alpha = 0.12) {
  // If color is a named color, use a fallback palette
  const palette: Record<string, string> = {
    blue: "0, 123, 255",
    green: "40, 167, 69",
    yellow: "255, 193, 7",
    pink: "232, 62, 140",
    purple: "111, 66, 193",
  };
  if (color in palette) {
    return `rgba(${palette[color]}, ${alpha})`;
  }
  // If color is hex or rgb, just use it with alpha
  if (color.startsWith("#")) {
    // Convert hex to rgb
    const hex = color.replace("#", "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb")) {
    return color.replace(")", `, ${alpha})`).replace("rgb(", "rgba(");
  }
  return color;
}

export default function GameScreen({
  gameType,
  playerNames,
  playerColors,
  onBackToDashboard,
  onRematch,
}: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentQuestionIndex: 0,
    players: [
      {
        name: playerNames[0],
        score: 0,
        color: playerColors ? playerColors[0] : "player1",
      },
      {
        name: playerNames[1],
        score: 0,
        color: playerColors ? playerColors[1] : "player2",
      },
    ],
    selectedAnswers: [null, null],
    gameStatus: "playing",
    winner: null,
    questions: gameType.questions.slice(0, 10),
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTimeout, setFeedbackTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [disabledOptions, setDisabledOptions] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  // Track if we are waiting to move to the next question after 3 wrong answers
  const [waitingForNext, setWaitingForNext] = useState(false);
  // Track if we are skipping a question due to 3 wrong answers
  const [skipQuestion, setSkipQuestion] = useState(false);

  // Reset disabled options and feedback on new question
  useEffect(() => {
    setDisabledOptions([false, false, false, false]);
    setFeedbackMessage(null);
  }, [gameState.currentQuestionIndex]);

  // Reset waitingForNext and skipQuestion on new question
  useEffect(() => {
    setWaitingForNext(false);
    setSkipQuestion(false);
  }, [gameState.currentQuestionIndex]);

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const isGameFinished =
    gameState.gameStatus === "finished" || gameState.winner;

  // For each question, compute answerIndex from answer and choices
  const getAnswerIndex = (question: any) =>
    question.choices.findIndex((c: string) => c === question.answer);

  // Handle answer selection
  const handleAnswer = useCallback(
    (playerIndex: number, answerIndex: number) => {
      if (
        showFeedback ||
        gameState.selectedAnswers[playerIndex] !== null ||
        disabledOptions[answerIndex] ||
        waitingForNext ||
        skipQuestion
      )
        return;

      const currentQ = gameState.questions[gameState.currentQuestionIndex];
      const answerIdx = getAnswerIndex(currentQ);
      const isCorrect = answerIndex === answerIdx;
      const points = currentQ.points || 0;

      // Check if this answer will be the third wrong answer
      const willBeThirdWrong =
        !disabledOptions[answerIndex] &&
        disabledOptions.filter(Boolean).length === 2 &&
        !isCorrect;
      if (willBeThirdWrong) {
        setWaitingForNext(true);
        setSkipQuestion(true);
        setFeedbackMessage("Failed to answer. No points awarded.");
        setDisabledOptions([true, true, true, true]); // lock all options
        setTimeout(() => {
          setFeedbackMessage(null);
          setWaitingForNext(false);
          setSkipQuestion(false);
          setGameState((prev3) => {
            const nextQuestionIndex = prev3.currentQuestionIndex + 1;
            if (nextQuestionIndex >= prev3.questions.length) {
              const [player1, player2] = prev3.players;
              const winner =
                player1.score > player2.score
                  ? player1
                  : player2.score > player1.score
                  ? player2
                  : null;
              return { ...prev3, gameStatus: "finished", winner };
            }
            setDisabledOptions([false, false, false, false]);
            return {
              ...prev3,
              currentQuestionIndex: prev3.currentQuestionIndex + 1,
              selectedAnswers: [null, null],
            };
          });
        }, 2500);
        return;
      }

      setGameState((prev) => {
        const newSelectedAnswers = [...prev.selectedAnswers];
        newSelectedAnswers[playerIndex] = answerIndex;
        const newPlayers = [...prev.players];
        if (isCorrect) {
          newPlayers[playerIndex].score += points;
        } else {
          newPlayers[playerIndex].score -= points;
        }
        return {
          ...prev,
          selectedAnswers: newSelectedAnswers,
          players: [newPlayers[0], newPlayers[1]],
        };
      });

      setShowFeedback(true);

      setTimeout(() => {
        setShowFeedback(false);
        setGameState((prev) => {
          if (isCorrect) {
            const nextQuestionIndex = prev.currentQuestionIndex + 1;
            if (nextQuestionIndex >= prev.questions.length) {
              const [player1, player2] = prev.players;
              const winner =
                player1.score > player2.score
                  ? player1
                  : player2.score > player1.score
                  ? player2
                  : null;
              return { ...prev, gameStatus: "finished", winner };
            }
            return {
              ...prev,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              selectedAnswers: [null, null],
            };
          } else {
            setDisabledOptions((opts) => {
              const newOpts = [...opts];
              newOpts[answerIndex] = true;
              return newOpts;
            });
            setTimeout(() => {
              setGameState((prev2) => {
                const disabledCount =
                  disabledOptions.filter(Boolean).length + 1;
                if (disabledCount >= 3) {
                  // Immediately lock input before feedback delay
                  setWaitingForNext(true);
                  setSkipQuestion(true);
                  setFeedbackMessage("Failed to answer. No points awarded.");
                  setTimeout(() => {
                    setFeedbackMessage(null);
                    setWaitingForNext(false);
                    setSkipQuestion(false);
                    setGameState((prev3) => {
                      const nextQuestionIndex = prev3.currentQuestionIndex + 1;
                      if (nextQuestionIndex >= prev3.questions.length) {
                        const [player1, player2] = prev3.players;
                        const winner =
                          player1.score > player2.score
                            ? player1
                            : player2.score > player1.score
                            ? player2
                            : null;
                        return { ...prev3, gameStatus: "finished", winner };
                      }
                      setDisabledOptions([false, false, false, false]);
                      return {
                        ...prev3,
                        currentQuestionIndex: prev3.currentQuestionIndex + 1,
                        selectedAnswers: [null, null],
                      };
                    });
                  }, 2500);
                  return prev2;
                }
                return prev2;
              });
            }, 400);
            setGameState((prev2) => {
              const newSelected = [...prev2.selectedAnswers];
              newSelected[playerIndex] = null;
              return { ...prev2, selectedAnswers: newSelected };
            });
          }
          return prev;
        });
      }, 2500); // 2.5 seconds for feedback
    },
    [
      showFeedback,
      gameState.selectedAnswers,
      gameState.questions,
      gameState.currentQuestionIndex,
      disabledOptions,
      waitingForNext,
      skipQuestion,
    ]
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showFeedback || isGameFinished || waitingForNext || skipQuestion)
        return;

      const player1KeyIndex = PLAYER_KEYS.player1.indexOf(event.code as any);
      const player2KeyIndex = PLAYER_KEYS.player2.indexOf(event.code as any);

      if (player1KeyIndex !== -1) {
        handleAnswer(0, player1KeyIndex);
      } else if (player2KeyIndex !== -1) {
        handleAnswer(1, player2KeyIndex);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
    };
  }, [
    handleAnswer,
    showFeedback,
    isGameFinished,
    waitingForNext,
    skipQuestion,
    feedbackTimeout,
  ]);

  const restartGame = () => {
    if (onRematch) {
      onRematch();
    } else {
      setGameState({
        currentQuestionIndex: 0,
        players: [
          {
            name: playerNames[0],
            score: 0,
            color: playerColors ? playerColors[0] : "player1",
          },
          {
            name: playerNames[1],
            score: 0,
            color: playerColors ? playerColors[1] : "player2",
          },
        ],
        selectedAnswers: [null, null],
        gameStatus: "playing",
        winner: null,
        questions: gameType.questions.slice(0, 10),
      });
      setShowFeedback(false);
      if (feedbackTimeout) clearTimeout(feedbackTimeout);
    }
  };

  if (isGameFinished) {
    return (
      <VictoryScreen
        gameState={gameState}
        onRematch={restartGame}
        onReturnHome={onBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-gaming p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Player Cards */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 w-full">
          {/* Player 1 Card */}
          <div className="flex-1 w-full max-w-xs">
            <div
              className="rounded-xl border-2 shadow-md flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/90"
              style={{
                borderColor: gameState.players[0].color,
                boxShadow: `0 0 12px 0 ${gameState.players[0].color}33`,
              }}
            >
              <div
                className="w-3 h-12 sm:w-4 sm:h-16 rounded-full"
                style={{ background: gameState.players[0].color, minWidth: 12 }}
              />
              <div className="flex-1">
                <div className="font-bold text-base sm:text-lg text-gray-900 truncate">
                  {gameState.players[0].name}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                  {gameState.players[0].score}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center flex-shrink-0 w-full sm:w-auto my-2 sm:my-0">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">
              Question {gameState.currentQuestionIndex + 1} of{" "}
              {gameState.questions.length}
              {gameState.gameStatus === "sudden-death" && (
                <span className="text-yellow-500 font-bold ml-2">
                  SUDDEN DEATH!
                </span>
              )}
            </div>
            <Button onClick={onBackToDashboard} variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>

          {/* Player 2 Card */}
          <div className="flex-1 w-full max-w-xs">
            <div
              className="rounded-xl border-2 shadow-md flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/90 flex-row-reverse"
              style={{
                borderColor: gameState.players[1].color,
                boxShadow: `0 0 12px 0 ${gameState.players[1].color}33`,
              }}
            >
              <div
                className="w-3 h-12 sm:w-4 sm:h-16 rounded-full"
                style={{ background: gameState.players[1].color, minWidth: 12 }}
              />
              <div className="flex-1 text-right">
                <div className="font-bold text-base sm:text-lg text-gray-900 truncate">
                  {gameState.players[1].name}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                  {gameState.players[1].score}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-gaming w-full relative">
          <CardContent className="p-4 sm:p-8">
            {/* Points label */}
            {typeof currentQuestion.points === "number" && (
              <span className="absolute top-3 right-4 sm:top-4 sm:right-6 bg-yellow-200 text-yellow-900 font-bold px-3 py-1 rounded-full text-xs shadow border border-yellow-300 select-none">
                {currentQuestion.points} points
              </span>
            )}
            <div className="text-center">
              <div className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 break-words">
                {currentQuestion.question}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Option Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
          {currentQuestion.choices.map((option: string, index: number) => {
            const player1Selected = gameState.selectedAnswers[0] === index;
            const player2Selected = gameState.selectedAnswers[1] === index;
            const answerIndex = getAnswerIndex(currentQuestion);
            const isCorrect =
              index === answerIndex && (player1Selected || player2Selected);
            const player1Color = gameState.players[0].color;
            const player2Color = gameState.players[1].color;
            const isDisabled = disabledOptions[index];
            let cardClass =
              "relative h-20 transition-all duration-700 cursor-pointer border-2 ";
            let cardStyle: any = { transition: "background 0.7s, border 0.7s" };
            // Default: split background
            if (!player1Selected && !player2Selected) {
              cardStyle.background = `linear-gradient(90deg, ${lightColor(
                player1Color
              )} 0%, ${lightColor(player1Color)} 50%, ${lightColor(
                player2Color
              )} 50%, ${lightColor(player2Color)} 100%)`;
              cardStyle.borderColor = "#e5e7eb"; // light border
            } else if (player1Selected && player2Selected) {
              cardStyle.background = `linear-gradient(90deg, ${lightColor(
                player1Color,
                0.5
              )} 0%, ${lightColor(player2Color, 0.5)} 100%)`;
              cardStyle.borderColor = player1Color;
            } else if (player1Selected) {
              cardStyle.background = lightColor(player1Color, 0.5);
              cardStyle.borderColor = player1Color;
            } else if (player2Selected) {
              cardStyle.background = lightColor(player2Color, 0.5);
              cardStyle.borderColor = player2Color;
            }
            if (isDisabled) {
              cardClass +=
                "opacity-50 grayscale bg-muted border-muted-foreground cursor-not-allowed ";
            }
            // Feedback animation
            if (showFeedback && (player1Selected || player2Selected)) {
              if (isCorrect) {
                cardClass += " animate-pulse ";
              } else {
                cardClass += " animate-shake ";
              }
            }
            return (
              <Card
                key={index}
                className={cardClass + " w-full"}
                style={cardStyle}
              >
                <CardContent className="p-2 sm:p-4 h-full flex flex-row items-center justify-between gap-2 sm:gap-0">
                  {/* Player 1 Key Label */}
                  <div className="flex flex-col items-center justify-center mr-2 sm:mr-3">
                    <div
                      className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs sm:text-sm`}
                      style={{
                        background: player1Selected ? player1Color : undefined,
                        borderColor: player1Color,
                      }}
                    >
                      {["Q", "W", "E", "R"][index]}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                      P1
                    </span>
                  </div>
                  {/* Option Text */}
                  <div className="flex-1 font-semibold text-gray-900 break-words text-xs sm:text-base text-center px-1">
                    {option}
                  </div>
                  {/* Player 2 Key Label */}
                  <div className="flex flex-col items-center justify-center ml-2 sm:ml-3">
                    <div
                      className={`w-8 h-8 rounded border flex items-center justify-center font-mono font-bold text-xs sm:text-sm`}
                      style={{
                        background: player2Selected ? player2Color : undefined,
                        borderColor: player2Color,
                      }}
                    >
                      {["U", "I", "O", "P"][index]}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">
                      P2
                    </span>
                  </div>
                  {/* Feedback icons */}
                  {showFeedback &&
                    (player1Selected || player2Selected) &&
                    (isCorrect ? (
                      <span
                        className="absolute right-2 top-2 text-2xl"
                        style={{ color: "#fff", textShadow: "0 0 8px #0008" }}
                      >
                        ✔️
                      </span>
                    ) : (
                      <span
                        className="absolute right-2 top-2 text-2xl"
                        style={{ color: "#fff", textShadow: "0 0 8px #0008" }}
                      >
                        ✖️
                      </span>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {feedbackMessage && (
          <div className="text-center text-lg text-red-500 font-bold mt-4 animate-pulse">
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
}
