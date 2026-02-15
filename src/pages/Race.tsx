import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flag, Fuel, Gauge, Wrench } from "lucide-react";
import NeonTrack from "@/components/race/NeonTrack";
import OvertakeParticles from "@/components/race/OvertakeParticles";
import RaceResultModal from "@/components/race/RaceResultModal";
import carPlayerImg from "@/assets/car-player.png";
import carOpponentImg from "@/assets/car-opponent.png";

interface CarStats {
  speed: number;
  acceleration: number;
  name: string;
  health: number;
}

const FINISH_LINE = 100;
const TICK_MS = 50;

const Race = () => {

  // Car attributes (would come from game state / Supabase)
  const [player] = useState<CarStats>({
    speed: 87,
    acceleration: 72,
    name: "Phantom X9",
    health: 92,
  });
  const [opponent] = useState<CarStats>({
    speed: 78,
    acceleration: 80,
    name: "Viper MK3",
    health: 100,
  });

  const [raceState, setRaceState] = useState<"countdown" | "racing" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [overtakeTriggered, setOvertakeTriggered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [victory, setVictory] = useState(false);
  const [fuelUsed, setFuelUsed] = useState(0);

  const prevLeader = useRef<"player" | "opponent" | "tie">("tie");

  // ROI formula: adjusted earnings based on car health
  const calculateNitroPoints = (won: boolean, health: number) => {
    const base = won ? 150 : 20;
    return Math.round((base * health) / 100);
  };

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

  // Race tick
  useEffect(() => {
    if (raceState !== "racing") return;

    const interval = setInterval(() => {
      setPlayerProgress((prev) => {
        const randomFactor = 0.8 + Math.random() * 0.4;
        const speedEffect = (player.speed / 100) * 0.6;
        const accelEffect = (player.acceleration / 100) * 0.4;
        const healthMod = player.health / 100;
        const delta = (speedEffect + accelEffect) * randomFactor * healthMod * 0.35;
        return Math.min(prev + delta, FINISH_LINE);
      });

      setOpponentProgress((prev) => {
        const randomFactor = 0.8 + Math.random() * 0.4;
        const speedEffect = (opponent.speed / 100) * 0.6;
        const accelEffect = (opponent.acceleration / 100) * 0.4;
        const healthMod = opponent.health / 100;
        const delta = (speedEffect + accelEffect) * randomFactor * healthMod * 0.35;
        return Math.min(prev + delta, FINISH_LINE);
      });

      setFuelUsed((f) => f + 1);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [raceState, player, opponent]);

  // Detect overtake
  useEffect(() => {
    if (raceState !== "racing") return;
    const currentLeader =
      playerProgress > opponentProgress + 1
        ? "player"
        : opponentProgress > playerProgress + 1
        ? "opponent"
        : "tie";

    if (currentLeader !== "tie" && currentLeader !== prevLeader.current && prevLeader.current !== "tie") {
      setOvertakeTriggered(true);
      setTimeout(() => setOvertakeTriggered(false), 600);
    }
    prevLeader.current = currentLeader;
  }, [playerProgress, opponentProgress, raceState]);

  // Detect finish
  useEffect(() => {
    if (raceState !== "racing") return;
    if (playerProgress >= FINISH_LINE || opponentProgress >= FINISH_LINE) {
      setRaceState("finished");
      const won = playerProgress >= opponentProgress;
      setVictory(won);
      setTimeout(() => setShowResult(true), 800);
    }
  }, [playerProgress, opponentProgress, raceState]);

  const resetRace = () => {
    setRaceState("countdown");
    setCountdown(3);
    setPlayerProgress(0);
    setOpponentProgress(0);
    setShowResult(false);
    setFuelUsed(0);
    prevLeader.current = "tie";
  };

  const trackWidth = 85; // percentage of container for car movement

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
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
            <Fuel className="h-4 w-4 text-neon-orange" />
            <span className="font-display text-xs text-foreground">
              {Math.max(0, 5 - Math.floor(fuelUsed / 100))}/5 Tanques
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="font-display text-xs text-foreground">
              Corrida 3/5
            </span>
          </div>
        </div>
      </motion.header>

      {/* Progress bars */}
      <div className="relative z-20 px-6 pb-4">
        <div className="glass rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-wider text-primary">
              {player.name}
            </span>
            <span className="font-display text-xs text-muted-foreground">
              {Math.round(playerProgress)}%
            </span>
          </div>
          <div className="relative mb-4 h-3 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${playerProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-xs uppercase tracking-wider text-destructive">
              {opponent.name}
            </span>
            <span className="font-display text-xs text-muted-foreground">
              {Math.round(opponentProgress)}%
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted/50">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
              style={{ width: `${opponentProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      </div>

      {/* Track area */}
      <div className="relative z-10 flex-1">
        <NeonTrack />

        {/* Finish line */}
        <div
          className="absolute top-[25%] h-[60%] w-1 bg-foreground/50"
          style={{ left: "92%", boxShadow: "0 0 10px hsl(0 0% 100% / 0.3)" }}
        >
          <Flag className="absolute -left-3 -top-6 h-6 w-6 text-foreground" />
        </div>

        {/* Player car */}
        <motion.div
          className="absolute z-10"
          style={{
            top: "30%",
            left: `${5 + (playerProgress / FINISH_LINE) * trackWidth}%`,
          }}
          animate={{
            rotate: raceState === "racing" ? [0, -0.5, 0.5, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            repeat: raceState === "racing" ? Infinity : 0,
          }}
        >
          <img
            src={carPlayerImg}
            alt="Player car"
            className="h-16 w-16 -rotate-90 object-contain"
            style={{
              mixBlendMode: "lighten",
              filter: "drop-shadow(0 0 12px hsl(185 80% 55% / 0.5))",
            }}
          />
          {/* Exhaust trail */}
          {raceState === "racing" && (
            <div className="absolute -left-8 top-1/2 -translate-y-1/2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 rounded-full bg-primary/40"
                  animate={{ width: [4, 20, 0], opacity: [0.8, 0.3, 0] }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.12,
                    repeat: Infinity,
                  }}
                  style={{ top: `${(i - 1) * 5}px` }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Opponent car */}
        <motion.div
          className="absolute z-10"
          style={{
            top: "58%",
            left: `${5 + (opponentProgress / FINISH_LINE) * trackWidth}%`,
          }}
          animate={{
            rotate: raceState === "racing" ? [0, 0.5, -0.5, 0] : 0,
          }}
          transition={{
            duration: 0.3,
            repeat: raceState === "racing" ? Infinity : 0,
          }}
        >
          <img
            src={carOpponentImg}
            alt="Opponent car"
            className="h-16 w-16 -rotate-90 object-contain"
            style={{
              mixBlendMode: "lighten",
              filter: "drop-shadow(0 0 12px hsl(0 70% 55% / 0.5))",
            }}
          />
          {raceState === "racing" && (
            <div className="absolute -left-8 top-1/2 -translate-y-1/2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 rounded-full bg-destructive/40"
                  animate={{ width: [4, 20, 0], opacity: [0.8, 0.3, 0] }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.12,
                    repeat: Infinity,
                  }}
                  style={{ top: `${(i - 1) * 5}px` }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Overtake particles */}
        <OvertakeParticles
          trigger={overtakeTriggered}
          x={Math.min(playerProgress, opponentProgress) * 8}
          y={200}
        />

        {/* Countdown overlay */}
        {raceState === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-display text-8xl font-black text-primary text-glow-cyan"
            >
              {countdown > 0 ? countdown : "GO!"}
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom bar — economy info */}
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
                Saúde Motor: <span className="text-foreground">{player.health}%</span>
              </span>
            </div>
            <div className="text-xs text-muted-foreground font-body">
              Revisão em: <span className="text-neon-orange">2 corridas</span>
            </div>
          </div>
          <div className="font-display text-xs text-muted-foreground">
            ROI: {Math.round((calculateNitroPoints(true, player.health) / 150) * 100)}%
          </div>
        </div>
      </motion.div>

      {/* Result modal */}
      <RaceResultModal
        isOpen={showResult}
        victory={victory}
        nitroPoints={calculateNitroPoints(victory, player.health)}
        onClose={resetRace}
      />
    </div>
  );
};

// Helper function exported for economy calculations
export const calculateROI = (earnings: number, carHealth: number) => {
  return (earnings * carHealth) / 100;
};

export default Race;
