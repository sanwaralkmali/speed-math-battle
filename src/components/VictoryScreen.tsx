import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Home, Star } from 'lucide-react';
import { GameState } from '@/types/game';

interface VictoryScreenProps {
  gameState: GameState;
  onRematch: () => void;
  onReturnHome: () => void;
}

export const VictoryScreen = ({ gameState, onRematch, onReturnHome }: VictoryScreenProps) => {
  const winner = gameState.winner!;
  const loser = gameState.players.find(p => p !== winner)!;

  const getPerformanceRating = (score: number, total: number) => {
    const percentage = (score / (total * 10)) * 100; // assuming 10 points per question as base
    if (percentage >= 80) return { rating: 'Excellent!', color: 'text-green-600', stars: 3 };
    if (percentage >= 60) return { rating: 'Good!', color: 'text-yellow-600', stars: 2 };
    return { rating: 'Keep Practicing!', color: 'text-muted-foreground', stars: 1 };
  };

  const winnerRating = getPerformanceRating(winner.score, gameState.questions.length);
  const loserRating = getPerformanceRating(loser.score, gameState.questions.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-4">
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
            <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Victory!
            </span>
          </h1>
          <motion.p 
            className="text-2xl font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span style={{ color: winner.color }}>{winner.name}</span> wins the battle!
          </motion.p>
        </motion.div>

        {/* Game Stats */}
        <Card className="game-card mb-6">
          <CardHeader>
            <CardTitle className="text-center">Battle Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Winner Stats */}
              <motion.div
                className="text-center p-2 sm:p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{winner.name}</h3>
                <div className="space-y-2">
                  <Badge className="bg-yellow-500 text-white">
                    Winner - {winner.score} points
                  </Badge>
                  <p className={`font-semibold ${winnerRating.color}`}>
                    {winnerRating.rating}
                  </p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < winnerRating.stars 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Loser Stats */}
              <motion.div
                className="text-center p-2 sm:p-4 bg-muted/30 rounded-lg border"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{loser.name}</h3>
                <div className="space-y-2">
                  <Badge variant="secondary">
                    {loser.score} points
                  </Badge>
                  <p className={`font-semibold ${loserRating.color}`}>
                    {loserRating.rating}
                  </p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${
                          i < loserRating.stars 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-gray-300'
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
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={onRematch}
            className="flex-1 h-10 sm:h-12 text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 hover:opacity-90"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Rematch
          </Button>
          <Button
            onClick={onReturnHome}
            variant="outline"
            className="flex-1 h-10 sm:h-12 px-4 sm:px-6 text-base sm:text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            New Game
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}; 