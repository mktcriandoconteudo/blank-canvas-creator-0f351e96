import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Gauge, Wrench, Star, Zap } from "lucide-react";
import RaceScene from "@/components/race3d/RaceScene";
import RaceResultModal from "@/components/race/RaceResultModal";
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
  const [showResult, setShowResult] = useState(false);
  const [victory, setVictory] = useState(false);
  const [xpResult, setXpResult] = useState({ leveledUp: false, newLevel: 0 });
  const [cameraShake, setCameraShake] = useState(false);
  const [nitroActive, setNitroActive] = useState(false);
  const [nitroCharges, setNitroCharges] = useState(3);

  const prevLeader = useRef<"player" | "opponent" | "tie">("tie");
  const finishRaceRef = useRef(finishRace);
  finishRaceRef.current = finishRace;

  // Countdown
  useEffect(() => {
    if (raceState !== "countdown") return;
    if (countdown <= 0) { setRaceState("racing"); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, raceState]);

  // Race tick
  useEffect(() => {
    if (raceState !== "racing") return;
    const interval = setInterval(() => {
      setPlayerProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (playerStats.speed / 100) * 0.6;
        const a = ((selectedCar?.acceleration ?? 60) / 100) * 0.4;
        const h = playerStats.engineHealth / 100;
        const nitroBoost = nitroActive ? 1.6 : 1;
        return Math.min(prev + (s + a) * r * h * 0.35 * nitroBoost, FINISH_LINE);
      });
      setOpponentProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (opponent.speed / 100) * 0.6;
        const a = (opponent.acceleration / 100) * 0.4;
        const h = opponent.health / 100;
        return Math.min(prev + (s + a) * r * h * 0.35, FINISH_LINE);
      });
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [raceState, playerStats, selectedCar, opponent, nitroActive]);

  // Detect overtake → camera shake
  useEffect(() => {
    if (raceState !== "racing") return;
    const cur = playerProgress > opponentProgress + 1 ? "player"
      : opponentProgress > playerProgress + 1 ? "opponent" : "tie";
    if (cur !== "tie" && cur !== prevLeader.current && prevLeader.current !== "tie") {
      setCameraShake(true);
      setTimeout(() => setCameraShake(false), 500);
    }
    prevLeader.current = cur;
  }, [playerProgress, opponentProgress, raceState]);

  // Detect finish
  useEffect(() => {
    if (raceState !== "racing") return;
    if (playerProgress >= FINISH_LINE || opponentProgress >= FINISH_LINE) {
      setRaceState("finished");
      setNitroActive(false);
      const won = playerProgress >= opponentProgress;
      setVictory(won);
      const result = finishRaceRef.current(won);
      setXpResult(result);
      setTimeout(() => setShowResult(true), 1200);
    }
  }, [playerProgress, opponentProgress, raceState]);

  // Nitro handler
  const activateNitro = () => {
    if (nitroCharges <= 0 || raceState !== "racing" || nitroActive) return;
    setNitroActive(true);
    setNitroCharges((c) => c - 1);
    setCameraShake(true);
    setTimeout(() => setCameraShake(false), 300);
    setTimeout(() => setNitroActive(false), 2500);
  };

  const handlePlayAgain = () => window.location.reload();
  const earnedNP = Math.round(((victory ? 150 : 20) * playerStats.engineHealth) / 100);
  const speedKmh = Math.round(180 + (playerProgress / 100) * 180 + (nitroActive ? 80 : 0));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* 3D Scene — full screen */}
      <div className="absolute inset-0 z-0">
        <RaceScene
          playerProgress={playerProgress}
          opponentProgress={opponentProgress}
          raceState={raceState}
          cameraShake={cameraShake}
          nitroActive={nitroActive}
        />
      </div>

      {/* === Holographic HUD overlay === */}
      
      {/* Top-left: Race info */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-6 top-6 z-20"
      >
        <div className="rounded-xl border border-primary/20 bg-background/20 px-5 py-3 backdrop-blur-md">
          <h1 className="font-display text-sm font-black uppercase tracking-[0.3em] text-primary text-glow-cyan">
            TurboNitro
          </h1>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-neon-orange" />
              <span className="font-display text-[11px] text-foreground/80">Lv.{selectedCar?.level ?? 1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-neon-orange" />
              <span className="font-display text-[11px] text-foreground/80">{state.fuelTanks}/5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-primary" />
              <span className="font-display text-[11px] text-foreground/80">Rev.{Math.max(0, 5 - (selectedCar?.racesSinceRevision ?? 0))}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top-right: Positions */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-6 top-6 z-20"
      >
        <div className="rounded-xl border border-primary/20 bg-background/20 px-5 py-3 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between gap-8">
            <span className="font-display text-[10px] uppercase tracking-wider text-primary">{playerStats.name}</span>
            <span className="font-display text-sm font-bold text-primary">{Math.round(playerProgress)}%</span>
          </div>
          <div className="relative mb-2 h-1.5 w-40 overflow-hidden rounded-full bg-muted/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${playerProgress}%`,
                background: "linear-gradient(90deg, hsl(185, 80%, 55%), hsl(210, 80%, 55%))",
                boxShadow: "0 0 10px hsl(185, 80%, 55% / 0.5)",
              }}
            />
          </div>
          <div className="mb-2 flex items-center justify-between gap-8">
            <span className="font-display text-[10px] uppercase tracking-wider text-destructive">{opponent.name}</span>
            <span className="font-display text-sm font-bold text-destructive">{Math.round(opponentProgress)}%</span>
          </div>
          <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-muted/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${opponentProgress}%`,
                background: "linear-gradient(90deg, hsl(0, 70%, 55%), hsl(30, 80%, 55%))",
                boxShadow: "0 0 10px hsl(0, 70%, 55% / 0.5)",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Bottom-left: Speedometer */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 left-8 z-20"
      >
        <div className="flex items-end gap-2">
          <span className="font-display text-5xl font-black tabular-nums text-primary text-glow-cyan">
            {raceState === "racing" ? speedKmh : 0}
          </span>
          <span className="mb-2 font-display text-sm text-muted-foreground">km/h</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-primary/60" />
          <span className="font-body text-[11px] text-muted-foreground">
            Motor: <span className={playerStats.engineHealth < 30 ? "text-destructive" : "text-foreground/80"}>{playerStats.engineHealth}%</span>
          </span>
        </div>
      </motion.div>

      {/* Bottom-right: Nitro button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-8 right-8 z-20"
      >
        <button
          onClick={activateNitro}
          disabled={nitroCharges <= 0 || raceState !== "racing" || nitroActive}
          className={`group relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all duration-200 ${
            nitroActive
              ? "border-neon-orange bg-neon-orange/20 scale-110"
              : nitroCharges > 0 && raceState === "racing"
              ? "border-primary/40 bg-background/20 backdrop-blur-md hover:border-primary hover:bg-primary/10 active:scale-95"
              : "border-muted/20 bg-background/10 opacity-40"
          }`}
        >
          <Zap className={`h-8 w-8 transition-colors ${nitroActive ? "text-neon-orange" : "text-primary"}`} />
          <span className="absolute -bottom-1 right-1 font-display text-[10px] font-bold text-muted-foreground">
            x{nitroCharges}
          </span>
        </button>
        <span className="mt-1 block text-center font-display text-[10px] uppercase tracking-wider text-muted-foreground">
          Nitro
        </span>
      </motion.div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {raceState === "countdown" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <motion.div
              key={countdown}
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-display text-[120px] font-black text-primary"
              style={{
                textShadow: "0 0 40px hsl(185, 80%, 55% / 0.8), 0 0 100px hsl(185, 80%, 55% / 0.4)",
              }}
            >
              {countdown > 0 ? countdown : "GO!"}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nitro active flash overlay */}
      <AnimatePresence>
        {nitroActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0.05, 0.1, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: "radial-gradient(ellipse at center, hsl(210, 100%, 60% / 0.15), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <RaceResultModal
        isOpen={showResult}
        victory={victory}
        nitroPoints={earnedNP}
        xpGained={victory ? 80 : 25}
        leveledUp={xpResult.leveledUp}
        newLevel={xpResult.newLevel}
        onClose={handlePlayAgain}
      />
    </div>
  );
};

export default Race;
