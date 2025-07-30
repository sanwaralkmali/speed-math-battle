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
  TrendingUp,
} from "lucide-react";
import { useRef } from "react";
import { useState as useReactState } from "react";

interface SkillsData {
  [group: string]: string[];
}

const PLAYER_COLORS = [
  {
    name: "Blue",
    class: "bg-blue-500",
    border: "border-blue-600",
    value: "blue",
    emoji: "🔵",
  },
  {
    name: "Green",
    class: "bg-green-500",
    border: "border-green-600",
    value: "green",
    emoji: "🟢",
  },
  {
    name: "Yellow",
    class: "bg-yellow-500",
    border: "border-yellow-600",
    value: "yellow",
    emoji: "🟡",
  },
  {
    name: "Pink",
    class: "bg-pink-500",
    border: "border-pink-600",
    value: "pink",
    emoji: "🩷",
  },
  {
    name: "Purple",
    class: "bg-purple-500",
    border: "border-purple-600",
    value: "purple",
    emoji: "🟣",
  },
];

const DIFFICULTY_LEVELS = [
  {
    name: "Easy",
    value: "easy",
    description: "Perfect for beginners",
    icon: "😊",
    color: "from-green-400 to-emerald-500",
    questions: "10 questions (3-3-3-1 waves)",
  },
  {
    name: "Medium",
    value: "medium",
    description: "Balanced challenge",
    icon: "😐",
    color: "from-yellow-400 to-orange-500",
    questions: "10 questions (2-2-2-2-2 waves)",
  },
  {
    name: "Hard",
    value: "hard",
    description: "For math experts",
    icon: "😰",
    color: "from-red-400 to-pink-500",
    questions: "10 questions (1-1-2-3-3 waves)",
  },
];

interface DashboardProps {
  onStartGame: (params: {
    player1Name: string;
    player2Name: string;
    player1Color: string;
    player2Color: string;
    skill: string;
    difficulty: string;
  }) => void;
}

// Footer component
function DashboardFooter() {
  return (
    <footer className="w-full py-4 text-center text-sm text-muted-foreground border-t bg-background/80 backdrop-blur-sm font-cairo flex-shrink-0">
      <a
        href="https://sanwaralkmali.github.io/mathlogame"
        className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
      >
        <img src="/MATHLOGAME.png" alt="MATHLOGAME" className="h-12 w-auto" />
        Powered by
        <span className="mathlogame-logo"> MATHLOGAME</span>
      </a>
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
            <span className="text-sm">⏭️</span>
            <span>3 wrong answers = Skip question</span>
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
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player1Color, setPlayer1Color] = useState(PLAYER_COLORS[0].value);
  const [player2Color, setPlayer2Color] = useState(PLAYER_COLORS[1].value);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [skillTitles, setSkillTitles] = useState<{ [skill: string]: string }>(
    {}
  );
  const fetchedTitles = useRef<{ [skill: string]: boolean }>({});
  const isSmallScreen = useIsSmallScreen();

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
          // Auto-select if only one skill
          if (data[group].length === 1) {
            setSelectedSkill(data[group][0]);
          }
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
    if (selectedSkill) {
      // Use default names if inputs are empty
      const p1Name = player1Name.trim() || "Player 1";
      const p2Name = player2Name.trim() || "Player 2";

      onStartGame({
        player1Name: p1Name,
        player2Name: p2Name,
        player1Color,
        player2Color,
        skill: selectedSkill,
        difficulty: selectedDifficulty,
      });
    }
  };

  const sameColor = player1Color === player2Color;

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="text-6xl animate-pulse">⚡</div>
          <h2 className="text-xl font-semibold text-slate-700">
            Loading Skills...
          </h2>
          <p className="text-slate-500">Preparing your math battle!</p>
        </div>
      </div>
    );
  }

  // Show not found screen
  if (!skills || skills.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="text-6xl">😕</div>
          <h2 className="text-xl font-semibold text-slate-700">
            No Skills Found
          </h2>
          <p className="text-slate-500">No skill group selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-[650px] mx-auto px-6 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="text-3xl">⚡</div>
              <h1 className="text-3xl font-bold text-slate-800">
                Speed Math Battle
              </h1>
              <div className="text-3xl">🎯</div>
            </div>
            <p className="text-slate-600 font-medium">
              Ready to become a math champion? 🏆
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="w-full max-w-[650px] mx-auto space-y-6">
          {/* Player Setup */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player 1 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600">
                  Player 1
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                          player1Color === color.value
                            ? `${color.class} ${color.border} scale-110 shadow-md`
                            : "bg-gray-100 border-gray-300 hover:scale-105 hover:shadow-sm"
                        }`}
                        onClick={() => setPlayer1Color(color.value)}
                      >
                        <span className="text-xs">{color.emoji}</span>
                      </button>
                    ))}
                  </div>
                  <Input
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    className="flex-1 text-sm"
                    placeholder="Enter Player 1 name"
                  />
                </div>
              </div>

              {/* Player 2 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-600">
                  Player 2
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color.value}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                          player2Color === color.value
                            ? `${color.class} ${color.border} scale-110 shadow-md`
                            : "bg-gray-100 border-gray-300 hover:scale-105 hover:shadow-sm"
                        }`}
                        onClick={() => setPlayer2Color(color.value)}
                      >
                        <span className="text-xs">{color.emoji}</span>
                      </button>
                    ))}
                  </div>
                  <Input
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="flex-1 text-sm"
                    placeholder="Enter Player 2 name"
                  />
                </div>
              </div>

              {/* Same Color Warning */}
              {player1Color === player2Color && (
                <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
                  ⚠️ Players have the same color! Please choose different
                  colors.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Difficulty Selection */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Difficulty Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all duration-200 text-center ${
                      selectedDifficulty === difficulty.value
                        ? `bg-gradient-to-r ${difficulty.color} border-transparent text-white shadow-md`
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm"
                    }`}
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">{difficulty.icon}</span>
                      <span className="font-semibold text-sm">
                        {difficulty.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skill Selection */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg font-semibold text-slate-700 flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                Choose Your Skill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <Card
                    key={skill}
                    className={`cursor-pointer border-2 transition-all duration-200 hover:shadow-md ${
                      selectedSkill === skill
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    onClick={() => handleSkillClick(skill)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">
                        {selectedSkill === skill ? "🎯" : "📚"}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 leading-tight">
                        {skillTitles[skill] || skill.replace(/-/g, " ")}
                      </h3>
                      {selectedSkill === skill && (
                        <div className="text-blue-600 font-medium flex items-center justify-center gap-1 text-xs mt-1">
                          <Sparkles className="w-3 h-3" />
                          Selected!
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start Button and Help */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={handleStartGame}
              disabled={
                !selectedSkill ||
                !player1Name.trim() ||
                !player2Name.trim() ||
                sameColor
              }
              className="text-base font-semibold px-8 py-3 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Play className="w-5 h-5 mr-2" />
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
