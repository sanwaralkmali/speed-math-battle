import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, Home, Star } from "lucide-react";
import { GameState } from "@/types/game";

interface VictoryScreenProps {
  gameState: GameState;
  onRematch: () => void;
  onReturnHome: () => void;
}

export const VictoryScreen = ({
  gameState,
  onRematch,
  onReturnHome,
}: VictoryScreenProps) => {
  const winner = gameState.winner!;
  const loser = gameState.players.find((p) => p !== winner)!;

  const getPerformanceRating = (score: number, total: number) => {
    const percentage = (score / (total * 10)) * 100; // assuming 10 points per question as base
    if (percentage >= 80)
      return { rating: "Excellent!", color: "text-green-600", stars: 3 };
    if (percentage >= 60)
      return { rating: "Good!", color: "text-yellow-600", stars: 2 };
    return {
      rating: "Keep Practicing!",
      color: "text-muted-foreground",
      stars: 1,
    };
  };

  const winnerRating = getPerformanceRating(
    winner.score,
    gameState.questions.length
  );
  const loserRating = getPerformanceRating(
    loser.score,
    gameState.questions.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Victory Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Victory!
            </span>
          </h1>
          <motion.p
            className="text-xl font-semibold text-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span style={{ color: winner.color }}>{winner.name}</span> wins the battle!
          </motion.p>
        </motion.div>

        {/* Game Stats */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-semibold text-slate-700">
              Battle Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Winner Stats */}
              <motion.div
                className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">
                  {winner.name}
                </h3>
                <div className="space-y-2">
                  <Badge className="bg-yellow-500 text-white text-sm">
                    {winner.score} points
                  </Badge>
                  <p className={`font-semibold text-sm ${winnerRating.color}`}>
                    {winnerRating.rating}
                  </p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < winnerRating.stars
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Loser Stats */}
              <motion.div
                className="text-center p-6 bg-slate-50 rounded-xl border-2 border-slate-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-8 h-8 bg-slate-400 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white">
                  2
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {loser.name}
                </h3>
                <div className="space-y-2">
                  <Badge className="bg-slate-500 text-white text-sm">
                    {loser.score} points
                  </Badge>
                  <p className={`font-semibold text-sm ${loserRating.color}`}>
                    {loserRating.rating}
                  </p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < loserRating.stars
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onRematch}
            className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Rematch
          </Button>
          <Button
            onClick={onReturnHome}
            variant="outline"
            className="flex-1 h-12 text-base font-semibold border-slate-300 hover:bg-slate-50"
          >
            <Home className="w-5 h-5 mr-2" />
            New Game
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
