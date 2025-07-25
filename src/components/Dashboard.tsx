import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Zap, Play } from "lucide-react";
import { useRef } from "react";
import { useState as useReactState } from "react";

interface SkillsData {
  [group: string]: string[];
}

const PLAYER_COLORS = [
  {
    name: "Blue",
    class: "bg-blue-200",
    border: "border-blue-400",
    value: "blue",
  },
  {
    name: "Green",
    class: "bg-green-200",
    border: "border-green-400",
    value: "green",
  },
  {
    name: "Yellow",
    class: "bg-yellow-200",
    border: "border-yellow-400",
    value: "yellow",
  },
  {
    name: "Pink",
    class: "bg-pink-200",
    border: "border-pink-400",
    value: "pink",
  },
  {
    name: "Purple",
    class: "bg-purple-200",
    border: "border-purple-400",
    value: "purple",
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
    <footer className="w-full py-4 text-center text-sm text-muted-foreground border-t bg-background font-cairo flex-shrink-0">
      <p>
        Educational Game 2025 | Created for Educational purposes By{" "}
        <a
          href="https://sanwaralkmali.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Salah Alkmali
        </a>
      </p>
    </footer>
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
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center">
        <div className="animate-pulse-glow text-2xl font-bold text-primary">
          Loading...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-gaming flex items-center justify-center p-4">
        <div className="text-2xl font-bold text-destructive">
          No skill group selected or group not found.
        </div>
      </div>
    );
  }

  // Show warning overlay on small screens
  if (isSmallScreen && !hideWarning) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-6">
        <div className="max-w-md w-full bg-yellow-100 border-2 border-yellow-400 rounded-xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-700 mb-2">
            Keyboard Required
          </h2>
          <p className="text-yellow-800 mb-4">
            This game can only be played on a device with a keyboard.
            <br />
            For the best experience, please use a computer or a large screen
            device with a physical keyboard.
            <br />
            <span className="block mt-2 text-base text-muted-foreground">
              Phones and small screens are not supported.
            </span>
          </p>
          <Button variant="outline" onClick={() => setHideWarning(true)}>
            I Understand
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-gaming flex flex-col p-0">
      <div className="w-full max-w-2xl space-y-8 mx-auto flex-1 flex flex-col justify-center p-4">
        {/* Game Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-player1 to-player2 bg-clip-text text-transparent">
              Speed Math Battle
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Who will be the fastest math master?
          </p>
        </div>

        {/* Player Names and Color Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* Player 1 */}
          <div className="space-y-2">
            <Label className="font-semibold">Player 1 (QWER)</Label>
            <Input
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              className="border-player1/30 focus:border-player1/60"
              placeholder="Enter player 1 name"
            />
            <div className="flex gap-2 mt-2 justify-center">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 focus:outline-none transition-all duration-150 ${
                    color.class
                  } ${
                    player1Color === color.value
                      ? color.border + " ring-2 ring-offset-2 ring-blue-400"
                      : "border-transparent"
                  } ${
                    sameColor && player1Color === color.value
                      ? "border-red-500 ring-red-400"
                      : ""
                  } hover:scale-110`}
                  aria-label={color.name}
                  onClick={() => setPlayer1Color(color.value)}
                />
              ))}
            </div>
          </div>
          {/* Player 2 */}
          <div className="space-y-2">
            <Label className="font-semibold">Player 2 (UIOP)</Label>
            <Input
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              className="border-player2/30 focus:border-player2/60"
              placeholder="Enter player 2 name"
            />
            <div className="flex gap-2 mt-2 justify-center">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 focus:outline-none transition-all duration-150 ${
                    color.class
                  } ${
                    player2Color === color.value
                      ? color.border + " ring-2 ring-offset-2 ring-pink-400"
                      : "border-transparent"
                  } ${
                    sameColor && player2Color === color.value
                      ? "border-red-500 ring-red-400"
                      : ""
                  } hover:scale-110`}
                  aria-label={color.name}
                  onClick={() => setPlayer2Color(color.value)}
                />
              ))}
            </div>
          </div>
        </div>
        {sameColor && (
          <div className="text-center text-sm text-red-500 font-medium mt-2">
            Players must choose different colors.
          </div>
        )}

        {/* Skill Selection Instruction */}
        <div className="text-center text-base font-medium text-muted-foreground mt-2 mb-1">
          Choose a skill to play
        </div>

        {/* Skill Cards - responsive, one per row on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 justify-items-center items-stretch mt-2">
          {skills.map((skill) => (
            <Card
              key={skill}
              className={`w-full cursor-pointer transition-transform duration-200 border bg-card/80 px-4 py-4 shadow-md flex flex-col justify-center rounded-lg ${
                selectedSkill === skill
                  ? "ring-2 ring-primary scale-105 border-primary"
                  : "hover:scale-105 hover:shadow-lg border-border"
              }`}
              onClick={() => handleSkillClick(skill)}
              style={{ minHeight: 80, maxWidth: 400, margin: "0 auto" }}
            >
              <CardHeader className="p-2 pb-0 flex-1 flex items-center justify-center">
                <CardTitle className="capitalize text-center text-lg leading-tight w-full">
                  {skillTitles[skill] || skill.replace(/-/g, " ")}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Start Game Button */}
        <Button
          onClick={handleStartGame}
          disabled={
            !selectedSkill ||
            !player1Name.trim() ||
            !player2Name.trim() ||
            sameColor
          }
          variant="gaming"
          size="xl"
          className="w-full animate-scale-in mt-8"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Game
        </Button>
        {/* How to Play Card */}
        <Card className="border-2 border-yellow-400 bg-card/90 backdrop-blur-sm mb-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-yellow-600 flex items-center gap-2">
              <span role="img" aria-label="game">
                🎮
              </span>{" "}
              Game Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Each player uses their own keys to answer (QWER for Player 1,
                UIOP for Player 2).
              </li>
              <li>
                • This Game can only be played with a device that uses a
                keyboard.
              </li>
              <li>• Get the answer right to earn points!</li>
              <li>• If you answer wrong, you lose the same points.</li>
              <li>
                • Each question shows how many points you can win or lose.
              </li>
              <li>• Try to get the highest score!</li>

              <li>
                • If you pick a wrong answer, that option is locked for both
                players.
              </li>
              <li>
                • If all 3 wrong options are picked, the question is skipped.
              </li>
              <li>• The player with the most points at the end wins!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <DashboardFooter />
    </div>
  );
}
