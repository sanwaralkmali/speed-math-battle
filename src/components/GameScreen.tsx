import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameState, GameType, PLAYER_KEYS, Question } from "@/types/game";
import { Trophy, Home, RotateCcw, Smartphone, Monitor } from "lucide-react";
import { VictoryScreen } from "./VictoryScreen";
import { useToast } from "@/hooks/use-toast";

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

// Hook to detect if device is touch screen
function useIsTouchScreen() {
  const [isTouchScreen, setIsTouchScreen] = useState(false);

  useEffect(() => {
    const checkTouchScreen = () => {
      setIsTouchScreen(
        "ontouchstart" in window || navigator.maxTouchPoints > 0
      );
    };

    checkTouchScreen();
    window.addEventListener("resize", checkTouchScreen);
    return () => window.removeEventListener("resize", checkTouchScreen);
  }, []);

  return isTouchScreen;
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
  // Track if we are waiting to move to the next question after 3 wrong answers
  const [waitingForNext, setWaitingForNext] = useState(false);
  // Track if we are skipping a question due to 3 wrong answers
  const [skipQuestion, setSkipQuestion] = useState(false);

  const isTouchScreen = useIsTouchScreen();
  const { toast } = useToast();

  // Reset disabled options and feedback on new question
  useEffect(() => {
    setDisabledOptions([false, false, false, false]);
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
        toast({
          title: "No Points Awarded",
          description: "Failed to answer correctly after 3 attempts.",
          variant: "destructive",
        });
        setDisabledOptions([true, true, true, true]); // lock all options
        setTimeout(() => {
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
          // Show success toast for correct answer
          toast({
            title: "Correct Answer! 🎉",
            description: `${newPlayers[playerIndex].name} earned ${points} points!`,
            variant: "default",
          });
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
                  toast({
                    title: "No Points Awarded",
                    description: "Failed to answer correctly after 3 attempts.",
                    variant: "destructive",
                  });
                  setTimeout(() => {
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

  // Handle touch events for split buttons
  const handleTouchAnswer = useCallback(
    (event: React.TouchEvent, answerIndex: number) => {
      if (showFeedback || isGameFinished || waitingForNext || skipQuestion)
        return;

      const rect = event.currentTarget.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const width = rect.width;

      // Determine which player based on touch position
      const playerIndex = x < width / 2 ? 0 : 1;

      handleAnswer(playerIndex, answerIndex);
    },
    [handleAnswer, showFeedback, isGameFinished, waitingForNext, skipQuestion]
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Device Mode Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-200">
            {isTouchScreen ? (
              <>
                <Smartphone className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">
                  Touch Mode
                </span>
              </>
            ) : (
              <>
                <Monitor className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-gray-700">
                  Keyboard Mode
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header with Exit Button */}
        <div className="space-y-2">
          {/* Question Number and Game Title Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Question {gameState.currentQuestionIndex + 1} of{" "}
              {gameState.questions.length}
              {gameState.gameStatus === "sudden-death" && (
                <span className="text-yellow-500 font-bold ml-2">
                  SUDDEN DEATH!
                </span>
              )}
            </div>
            <div className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1.5 rounded-full border border-blue-200 text-center sm:text-left font-medium">
              {gameType.type
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </div>
          </div>
        </div>

        {/* Exit Button - Top Left */}
        <div className="absolute top-2 left-2 z-10">
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            size="sm"
            className="h-8 px-2"
          >
            <Home className="w-3 h-3 mr-1" />
            Back
          </Button>
        </div>

        {/* Player Cards */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 w-full">
          {/* Player 1 Card */}
          <div className="flex-1 w-full max-w-xs">
            <div
              className="rounded-xl border-2 shadow-lg flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/90 backdrop-blur-sm"
              style={{
                borderColor: gameState.players[0].color,
                boxShadow: `0 4px 20px 0 ${gameState.players[0].color}40`,
              }}
            >
              <div
                className="w-3 h-12 sm:w-4 sm:h-16 rounded-full"
                style={{ background: gameState.players[0].color, minWidth: 12 }}
              />
              <div className="flex-1">
                <div className="font-bold text-sm sm:text-lg text-gray-900 truncate">
                  {gameState.players[0].name}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                  {gameState.players[0].score}
                </div>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div className="flex-1 w-full max-w-xs">
            <div
              className="rounded-xl border-2 shadow-lg flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/90 backdrop-blur-sm flex-row-reverse"
              style={{
                borderColor: gameState.players[1].color,
                boxShadow: `0 4px 20px 0 ${gameState.players[1].color}40`,
              }}
            >
              <div
                className="w-3 h-12 sm:w-4 sm:h-16 rounded-full"
                style={{ background: gameState.players[1].color, minWidth: 12 }}
              />
              <div className="flex-1 text-right">
                <div className="font-bold text-sm sm:text-lg text-gray-900 truncate">
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
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl w-full relative">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 break-words leading-tight">
                {currentQuestion.question}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points Display - Separate from question card */}
        {typeof currentQuestion.points === "number" && (
          <div className="text-center">
            <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg border border-yellow-300 select-none">
              {currentQuestion.points} points
            </span>
          </div>
        )}

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
              "relative h-20 sm:h-24 transition-all duration-700 cursor-pointer border-2 ";
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
                onTouchStart={
                  isTouchScreen ? (e) => handleTouchAnswer(e, index) : undefined
                }
              >
                <CardContent className="p-3 sm:p-4 h-full flex flex-row items-center justify-between gap-2">
                  {/* Player 1 Key Label - Only show on keyboard devices */}
                  {!isTouchScreen && (
                    <div className="flex flex-col items-center justify-center mr-2 sm:mr-3">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-md`}
                        style={{
                          background: player1Selected ? player1Color : "white",
                          borderColor: player1Color,
                          color: player1Selected ? "white" : player1Color,
                        }}
                      >
                        {["Q", "W", "E", "R"][index]}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 font-medium hidden sm:block">
                        P1
                      </span>
                    </div>
                  )}

                  {/* Touch Mode Visual Indicators */}
                  {isTouchScreen && (
                    <div className="flex flex-col items-center justify-center mr-2 sm:mr-3">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center font-bold text-xs sm:text-sm shadow-md`}
                        style={{
                          background: player1Selected
                            ? player1Color
                            : "rgba(255,255,255,0.8)",
                          borderColor: player1Color,
                          color: player1Selected ? "white" : player1Color,
                        }}
                      >
                        👆
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {gameState.players[0].name}
                      </span>
                    </div>
                  )}

                  {/* Option Text */}
                  <div className="flex-1 font-semibold text-gray-900 break-words text-sm sm:text-base text-center px-2">
                    {option}
                  </div>

                  {/* Player 2 Key Label - Only show on keyboard devices */}
                  {!isTouchScreen && (
                    <div className="flex flex-col items-center justify-center ml-2 sm:ml-3">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-md`}
                        style={{
                          background: player2Selected ? player2Color : "white",
                          borderColor: player2Color,
                          color: player2Selected ? "white" : player2Color,
                        }}
                      >
                        {["U", "I", "O", "P"][index]}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 font-medium hidden sm:block">
                        P2
                      </span>
                    </div>
                  )}

                  {/* Touch Mode Visual Indicators */}
                  {isTouchScreen && (
                    <div className="flex flex-col items-center justify-center ml-2 sm:ml-3">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center font-bold text-xs sm:text-sm shadow-md`}
                        style={{
                          background: player2Selected
                            ? player2Color
                            : "rgba(255,255,255,0.8)",
                          borderColor: player2Color,
                          color: player2Selected ? "white" : player2Color,
                        }}
                      >
                        👆
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {gameState.players[1].name}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions - Different for touch vs keyboard */}
        <div className="text-center bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border border-gray-200">
          {isTouchScreen ? (
            <>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Touch Instructions:</strong>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  • Tap the <strong>left half</strong> of any option for{" "}
                  <strong>{gameState.players[0].name}</strong>
                </div>
                <div>
                  • Tap the <strong>right half</strong> of any option for{" "}
                  <strong>{gameState.players[1].name}</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Keyboard Controls:</strong>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  <strong>{gameState.players[0].name}</strong>: Press{" "}
                  <strong>Q, W, E, R</strong> keys
                </div>
                <div>
                  <strong>{gameState.players[1].name}</strong>: Press{" "}
                  <strong>U, I, O, P</strong> keys
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
