import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flag, Fuel, Gauge, Wrench, Star } from "lucide-react";
import NeonTrack from "@/components/race/NeonTrack";
import OvertakeParticles from "@/components/race/OvertakeParticles";
import CarSprite from "@/components/race/CarSprite";
import RaceResultModal from "@/components/race/RaceResultModal";
import carPlayerImg from "@/assets/car-player.png";
import carOpponentImg from "@/assets/car-opponent.png";
import { useGameState } from "@/hooks/useGameState";

const FINISH_LINE = 100;
const TICK_MS = 50;

const Race = () => {
  const { state, selectedCar, finishRace } = useGameState();

  const playerStats = selectedCar ?? { speed: 70, acceleration: 60, engineHealth: 100, name: "Unknown", level: 1 };

  const [opponent] = useState(() => {
    const lvl = selectedCar?.level ?? 1;
    const base = 50 + lvl * 5;
    return {
      speed: Math.min(100, base + Math.round(Math.random() * 20 - 10)),
      acceleration: Math.min(100, base + Math.round(Math.random() * 20 - 10)),
      name: ["Viper MK3", "Shadow GT", "Blaze R8", "Neon Fury"][Math.floor(Math.random() * 4)],
      health: 100,
      level: Math.max(1, lvl + Math.floor(Math.random() * 3 - 1)),
    };
  });

  const [raceState, setRaceState] = useState<"countdown" | "racing" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [overtakeTriggered, setOvertakeTriggered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [victory, setVictory] = useState(false);
  const [xpResult, setXpResult] = useState({ leveledUp: false, newLevel: 0 });
  const [cameraShake, setCameraShake] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);

  const prevLeader = useRef<"player" | "opponent" | "tie">("tie");

  // Countdown
  useEffect(() => {
    if (raceState !== "countdown") return;
    if (countdown <= 0) {
      setRaceState("racing");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, raceState]);

  // Race tick + parallax scroll
  useEffect(() => {
    if (raceState !== "racing") return;

    const interval = setInterval(() => {
      setPlayerProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (playerStats.speed / 100) * 0.6;
        const a = ((selectedCar?.acceleration ?? 60) / 100) * 0.4;
        const h = playerStats.engineHealth / 100;
        return Math.min(prev + (s + a) * r * h * 0.35, FINISH_LINE);
      });

      setOpponentProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (opponent.speed / 100) * 0.6;
        const a = (opponent.acceleration / 100) * 0.4;
        const h = opponent.health / 100;
        return Math.min(prev + (s + a) * r * h * 0.35, FINISH_LINE);
      });

      setScrollOffset((prev) => prev + 3);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [raceState, playerStats, selectedCar, opponent]);

  // Detect overtake + camera shake
  useEffect(() => {
    if (raceState !== "racing") return;
    const cur =
      playerProgress > opponentProgress + 1 ? "player"
        : opponentProgress > playerProgress + 1 ? "opponent"
        : "tie";
    if (cur !== "tie" && cur !== prevLeader.current && prevLeader.current !== "tie") {
      setOvertakeTriggered(true);
      setCameraShake(true);
      setTimeout(() => setOvertakeTriggered(false), 600);
      setTimeout(() => setCameraShake(false), 400);
    }
    prevLeader.current = cur;
  }, [playerProgress, opponentProgress, raceState]);

  // Detect finish
  const finishRaceRef = useRef(finishRace);
  finishRaceRef.current = finishRace;

  useEffect(() => {
    if (raceState !== "racing") return;
    if (playerProgress >= FINISH_LINE || opponentProgress >= FINISH_LINE) {
      setRaceState("finished");
      const won = playerProgress >= opponentProgress;
      setVictory(won);
      const result = finishRaceRef.current(won);
      setXpResult(result);
      setTimeout(() => setShowResult(true), 800);
    }
  }, [playerProgress, opponentProgress, raceState]);

  const handlePlayAgain = () => {
    window.location.reload();
  };

  const trackWidth = 85;
  const earnedNP = Math.round(((victory ? 150 : 20) * playerStats.engineHealth) / 100);

  return (
    <motion.div
      className="relative flex min-h-screen flex-col overflow-hidden bg-background"
      animate={cameraShake ? { x: [0, -4, 4, -2, 2, 0], y: [0, 2, -2, 1, -1, 0] } : {}}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 flex items-center justify-between px-6 py-4"
      >
        <h1 className="font-display text-xl font-black uppercase tracking-widest text-primary text-glow-cyan">
          TurboNitro
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <Star className="h-4 w-4 text-neon-orange" />
            <span className="font-display text-xs text-foreground">Lv.{selectedCar?.level ?? 1}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <Fuel className="h-4 w-4 text-neon-orange" />
            <span className="font-display text-xs text-foreground">{state.fuelTanks}/5</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="font-display text-xs text-foreground">Rev. {Math.max(0, 5 - (selectedCar?.racesSinceRevision ?? 0))}</span>
          </div>
        </div>
      </motion.header>

      {/* Progress bars */}
      <div className="relative z-20 px-6 pb-4">
        <div className="glass rounded-xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-wider text-primary">
              {playerStats.name} <span className="text-muted-foreground">(Lv.{selectedCar?.level ?? 1})</span>
            </span>
            <span className="font-display text-xs text-muted-foreground">{Math.round(playerProgress)}%</span>
          </div>
          <div className="relative mb-3 h-3 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${playerProgress}%` }}
            />
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-wider text-destructive">
              {opponent.name} <span className="text-muted-foreground">(Lv.{opponent.level})</span>
            </span>
            <span className="font-display text-xs text-muted-foreground">{Math.round(opponentProgress)}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
              style={{ width: `${opponentProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Track */}
      <div className="relative z-10 flex-1">
        <NeonTrack
          scrollOffset={scrollOffset}
          playerLane={playerProgress / FINISH_LINE}
          opponentLane={opponentProgress / FINISH_LINE}
        />

        {/* Finish flag */}
        <div
          className="absolute top-[12%] h-[76%] w-1 bg-foreground/50"
          style={{ left: "92%", boxShadow: "0 0 10px hsl(0 0% 100% / 0.3)" }}
        >
          <Flag className="absolute -left-3 -top-6 h-6 w-6 text-foreground" />
        </div>

        {/* Player car */}
        <div
          className="absolute z-10"
          style={{ top: "22%", left: `${5 + (playerProgress / FINISH_LINE) * trackWidth}%` }}
        >
          <CarSprite
            src={carPlayerImg}
            alt="Player"
            color="cyan"
            isRacing={raceState === "racing"}
          />
        </div>

        {/* Opponent car */}
        <div
          className="absolute z-10"
          style={{ top: "56%", left: `${5 + (opponentProgress / FINISH_LINE) * trackWidth}%` }}
        >
          <CarSprite
            src={carOpponentImg}
            alt="Opponent"
            color="red"
            isRacing={raceState === "racing"}
          />
        </div>

        <OvertakeParticles trigger={overtakeTriggered} x={Math.min(playerProgress, opponentProgress) * 8} y={200} />

        {raceState === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-display text-8xl font-black text-primary text-glow-cyan"
            >
              {countdown > 0 ? countdown : "GO!"}
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-20 border-t border-border/30 bg-muted/20 px-6 py-3 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="font-body text-xs text-muted-foreground">
                Motor: <span className={playerStats.engineHealth < 30 ? "text-destructive" : "text-foreground"}>{playerStats.engineHealth}%</span>
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-body">
              XP: +{victory ? 80 : 25} ao final
            </span>
          </div>
          <div className="font-display text-xs text-muted-foreground">
            ROI: {Math.round(playerStats.engineHealth)}%
          </div>
        </div>
      </motion.div>

      <RaceResultModal
        isOpen={showResult}
        victory={victory}
        nitroPoints={earnedNP}
        xpGained={victory ? 80 : 25}
        leveledUp={xpResult.leveledUp}
        newLevel={xpResult.newLevel}
        onClose={handlePlayAgain}
      />
    </motion.div>
  );
};

export default Race;
