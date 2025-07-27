import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Zap,
  Play,
  Users,
  Target,
  Trophy,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useRef } from "react";
import { useState as useReactState } from "react";

interface SkillsData {
  [group: string]: string[];
}

const PLAYER_COLORS = [
  {
    name: "Blue",
    class: "bg-blue-400",
    border: "border-blue-600",
    value: "blue",
    emoji: "🔵",
  },
  {
    name: "Green",
    class: "bg-green-400",
    border: "border-green-600",
    value: "green",
    emoji: "🟢",
  },
  {
    name: "Yellow",
    class: "bg-yellow-400",
    border: "border-yellow-600",
    value: "yellow",
    emoji: "🟡",
  },
  {
    name: "Pink",
    class: "bg-pink-400",
    border: "border-pink-600",
    value: "pink",
    emoji: "🩷",
  },
  {
    name: "Purple",
    class: "bg-purple-400",
    border: "border-purple-600",
    value: "purple",
    emoji: "🟣",
  },
];

interface DashboardProps {
  onStartGame: (params: {
    player1Name: string;
    player2Name: string;
    player1Color: string;
    player2Color: string;
    skill: string;
  }) => void;
}

// Footer component
function DashboardFooter() {
  return (
    <footer className="w-full py-3 text-center text-sm text-muted-foreground border-t bg-background/80 backdrop-blur-sm font-cairo flex-shrink-0">
      <p className="text-sm">
        🎓 Educational Game 2025 | Created with ❤️ by{" "}
        <a
          href="https://sanwaralkmali.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold"
        >
          Salah Alkmali
        </a>
      </p>
    </footer>
  );
}

// Instructions Modal Component
function InstructionsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-7 px-2 text-xs">
          <HelpCircle className="w-3 h-3" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-yellow-700 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            How to Play
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎮</span>
            <span>
              <strong>Player 1:</strong> Use QWER keys
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🎮</span>
            <span>
              <strong>Player 2:</strong> Use UIOP keys
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">✅</span>
            <span>Right answer = Earn points!</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">❌</span>
            <span>Wrong answer = Lose points</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <span>Wrong options get locked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <span>Highest score wins!</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to fetch skill title from question JSON
async function fetchSkillTitle(skill: string): Promise<string | null> {
  try {
    const res = await fetch(`/data/questions/${skill}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  } catch {
    return null;
  }
}

// Responsive hook to detect small screens
function useIsSmallScreen() {
  const [isSmall, setIsSmall] = useReactState(false);
  useEffect(() => {
    function check() {
      setIsSmall(window.innerWidth < 700);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isSmall;
}

export default function Dashboard({ onStartGame }: DashboardProps) {
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [player1Color, setPlayer1Color] = useState(PLAYER_COLORS[0].value);
  const [player2Color, setPlayer2Color] = useState(PLAYER_COLORS[1].value);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [skillTitles, setSkillTitles] = useState<{ [skill: string]: string }>(
    {}
  );
  const fetchedTitles = useRef<{ [skill: string]: boolean }>({});
  const isSmallScreen = useIsSmallScreen();
  const [hideWarning, setHideWarning] = useReactState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const group = params.get("skill");
    if (!group) {
      setSkills([]);
      setLoading(false);
      setNotFound(true);
      return;
    }
    fetch("/data/skills.json")
      .then((res) => res.json())
      .then((data: SkillsData) => {
        if (data[group]) {
          setSkills(data[group]);
          setNotFound(false);
        } else {
          setSkills([]);
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setSkills([]);
        setNotFound(true);
        setLoading(false);
      });
  }, []);

  // Fetch titles for all skills in the group
  useEffect(() => {
    if (skills.length === 0) return;
    skills.forEach((skill) => {
      if (!fetchedTitles.current[skill]) {
        fetchedTitles.current[skill] = true;
        fetchSkillTitle(skill).then((title) => {
          if (title) {
            setSkillTitles((prev) => ({ ...prev, [skill]: title }));
          }
        });
      }
    });
  }, [skills]);

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(skill);
  };

  const handleStartGame = () => {
    if (selectedSkill && player1Name.trim() && player2Name.trim()) {
      onStartGame({
        player1Name: player1Name.trim(),
        player2Name: player2Name.trim(),
        player1Color,
        player2Color,
        skill: selectedSkill,
      });
    }
  };

  const sameColor = player1Color === player2Color;

  if (loading) {
    return (
      <div className="h-screen bg-gradient-fun flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-bounce-gentle text-4xl">🎮</div>
          <div className="text-lg font-bold text-primary animate-pulse">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="h-screen bg-gradient-fun flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-float">❓</div>
          <div className="text-lg font-bold text-destructive">
            No skill group selected.
          </div>
        </div>
      </div>
    );
  }

  // Show warning overlay on small screens
  if (isSmallScreen && !hideWarning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-4">
        <div className="max-w-sm w-full bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-lg p-4 text-center">
          <div className="text-4xl mb-3 animate-bounce-gentle">⚠️</div>
          <h2 className="text-lg font-bold text-yellow-700 mb-2">
            Keyboard Required
          </h2>
          <p className="text-sm text-yellow-800 mb-3">
            This game needs a keyboard to play!
          </p>
          <Button
            variant="outline"
            onClick={() => setHideWarning(true)}
            className="text-sm px-4 py-1"
          >
            Got it! 👍
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-fun flex flex-col">
      {/* Compact Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-fun opacity-30"></div>
        <div className="relative z-10 text-center py-2 px-4">
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
            <div className="text-xl sm:text-2xl animate-float">⚡</div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              Speed Math Battle
            </h1>
            <div className="text-xl sm:text-2xl animate-float">🎯</div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Ready to become a math champion? 🏆
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-3">
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto space-y-3">
          {/* Compact Player Setup */}
          <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-1">
              <CardTitle className="text-sm font-bold text-primary flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Player 1 */}
                <div className="space-y-1 p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded border border-blue-200">
                  <Label className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                    <span className="text-lg">👤</span>
                    Player 1 (QWER)
                  </Label>
                  <Input
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="text-xs h-7 border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                    placeholder="Player 1 name"
                  />
                  <div className="flex gap-1 justify-center">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-6 h-6 rounded-full border focus:outline-none transition-all duration-200 text-xs ${
                          color.class
                        } ${
                          player1Color === color.value
                            ? color.border + " ring-1 ring-blue-200 scale-110"
                            : "border-transparent hover:scale-110"
                        } ${
                          sameColor && player1Color === color.value
                            ? "border-red-500 ring-red-200"
                            : ""
                        }`}
                        aria-label={color.name}
                        onClick={() => setPlayer1Color(color.value)}
                      >
                        {color.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player 2 */}
                <div className="space-y-1 p-2 bg-gradient-to-br from-pink-50 to-purple-50 rounded border border-pink-200">
                  <Label className="text-xs font-semibold text-pink-700 flex items-center gap-1">
                    <span className="text-lg">👤</span>
                    Player 2 (UIOP)
                  </Label>
                  <Input
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="text-xs h-7 border border-pink-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                    placeholder="Player 2 name"
                  />
                  <div className="flex gap-1 justify-center">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-6 h-6 rounded-full border focus:outline-none transition-all duration-200 text-xs ${
                          color.class
                        } ${
                          player2Color === color.value
                            ? color.border + " ring-1 ring-pink-200 scale-110"
                            : "border-transparent hover:scale-110"
                        } ${
                          sameColor && player2Color === color.value
                            ? "border-red-500 ring-red-200"
                            : ""
                        }`}
                        aria-label={color.name}
                        onClick={() => setPlayer2Color(color.value)}
                      >
                        {color.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {sameColor && (
                <div className="text-center text-xs text-red-600 font-semibold bg-red-50 p-1 rounded border border-red-200">
                  ⚠️ Choose different colors!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Skill Selection */}
          <Card className="bg-white/90 backdrop-blur-sm border border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-1">
              <CardTitle className="text-sm font-bold text-primary flex items-center justify-center gap-1">
                <Target className="w-4 h-4" />
                Choose Skill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {skills.map((skill) => (
                  <Card
                    key={skill}
                    className={`skill-card cursor-pointer border bg-gradient-to-br from-white to-gray-50 shadow-md hover:shadow-lg transition-all duration-200 ${
                      selectedSkill === skill
                        ? "selected border-primary bg-gradient-to-br from-blue-50 to-purple-50 shadow-primary/20"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                    onClick={() => handleSkillClick(skill)}
                  >
                    <CardContent className="p-2 text-center">
                      <div className="text-2xl mb-1">
                        {selectedSkill === skill ? "🎯" : "📚"}
                      </div>
                      <h3 className="text-xs font-semibold text-gray-800 leading-tight">
                        {skillTitles[skill] || skill.replace(/-/g, " ")}
                      </h3>
                      {selectedSkill === skill && (
                        <div className="mt-1 text-primary font-medium flex items-center justify-center gap-1 text-xs">
                          <Sparkles className="w-2 h-2" />
                          Selected!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compact Start Button and Help Button */}
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleStartGame}
              disabled={
                !selectedSkill ||
                !player1Name.trim() ||
                !player2Name.trim() ||
                sameColor
              }
              className="text-sm font-bold px-6 py-2 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Play className="w-4 h-4 mr-1" />
              Start Battle! ⚡
            </Button>
            <InstructionsModal />
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
