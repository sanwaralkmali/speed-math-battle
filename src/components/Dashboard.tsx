import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GameData, Skill, GameType } from '@/types/game';
import { Gamepad2, Trophy, Zap } from 'lucide-react';

interface DashboardProps {
  onStartGame: (players: [string, string], gameType: GameType) => void;
}

export default function Dashboard({ onStartGame }: DashboardProps) {
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/skills.json')
      .then(res => res.json())
      .then((data: GameData) => {
        setGameData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load game data:', err);
        setLoading(false);
      });
  }, []);

  const handleStartGame = () => {
    if (selectedGameType && player1Name.trim() && player2Name.trim()) {
      onStartGame([player1Name.trim(), player2Name.trim()], selectedGameType);
    }
  };

  const canStart = selectedGameType && player1Name.trim() && player2Name.trim();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="animate-pulse-glow text-2xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Game Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-12 h-12 text-player1 animate-glow-player1" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-player1 to-player2 bg-clip-text text-transparent">
              Speed Duel
            </h1>
            <Zap className="w-12 h-12 text-player2 animate-glow-player2" />
          </div>
          <p className="text-xl text-muted-foreground">Simplify Showdown</p>
        </div>

        {/* Main Game Setup Card */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-gaming">
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
              Game Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-player1 font-semibold">Player 1 (QWER)</Label>
                <Input
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="border-player1/30 focus:border-player1/60"
                  placeholder="Enter player 1 name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-player2 font-semibold">Player 2 (UIOP)</Label>
                <Input
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="border-player2/30 focus:border-player2/60"
                  placeholder="Enter player 2 name"
                />
              </div>
            </div>

            {/* Skill Selection */}
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Skill</Label>
              <Select onValueChange={(value) => {
                const skill = gameData?.skills.find(s => s.skill === value);
                setSelectedSkill(skill || null);
                setSelectedGameType(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {gameData?.skills.map((skill) => (
                    <SelectItem key={skill.skill} value={skill.skill}>
                      {skill.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game Type Selection */}
            {selectedSkill && (
              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Game Type</Label>
                <Select onValueChange={(value) => {
                  const gameType = selectedSkill.gameTypes.find(gt => gt.type === value);
                  setSelectedGameType(gameType || null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSkill.gameTypes.map((gameType) => (
                      <SelectItem key={gameType.type} value={gameType.type}>
                        {gameType.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start Game Button */}
            <Button
              onClick={handleStartGame}
              disabled={!canStart}
              variant="gaming"
              size="xl"
              className="w-full animate-scale-in"
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Start Game
            </Button>

            {/* Leaderboard Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              disabled
            >
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboard (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Controls Info */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <Card className="bg-gradient-player1 border-player1/20">
            <CardContent className="p-4">
              <div className="font-bold text-lg mb-2">Player 1 Controls</div>
              <div className="flex justify-center gap-2">
                {['Q', 'W', 'E', 'R'].map((key) => (
                  <div key={key} className="w-8 h-8 bg-card/20 rounded border border-player1/30 flex items-center justify-center font-mono font-bold">
                    {key}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-player2 border-player2/20">
            <CardContent className="p-4">
              <div className="font-bold text-lg mb-2">Player 2 Controls</div>
              <div className="flex justify-center gap-2">
                {['U', 'I', 'O', 'P'].map((key) => (
                  <div key={key} className="w-8 h-8 bg-card/20 rounded border border-player2/30 flex items-center justify-center font-mono font-bold">
                    {key}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}