import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Gauge, Wrench, Star, Zap } from "lucide-react";
import SpeedLinesCanvas from "@/components/race/SpeedLinesCanvas";
import RaceResultModal from "@/components/race/RaceResultModal";
import { useGameState } from "@/hooks/useGameState";
import raceHighwayBg from "@/assets/race-highway-bg.jpg";
import citySkyline from "@/assets/city-skyline.jpg";
import carPlayerSide from "@/assets/car-player-side.png";
import carOpponentSide from "@/assets/car-opponent-side.png";

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
  const [bgOffset, setBgOffset] = useState(0);

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

  // Race tick + parallax
  useEffect(() => {
    if (raceState !== "racing") return;
    const interval = setInterval(() => {
      setPlayerProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (playerStats.speed / 100) * 0.6;
        const a = ((selectedCar?.acceleration ?? 60) / 100) * 0.4;
        const h = playerStats.engineHealth / 100;
        const boost = nitroActive ? 1.6 : 1;
        return Math.min(prev + (s + a) * r * h * 0.35 * boost, FINISH_LINE);
      });
      setOpponentProgress((prev) => {
        const r = 0.8 + Math.random() * 0.4;
        const s = (opponent.speed / 100) * 0.6;
        const a = (opponent.acceleration / 100) * 0.4;
        const h = opponent.health / 100;
        return Math.min(prev + (s + a) * r * h * 0.35, FINISH_LINE);
      });
      setBgOffset((prev) => prev + (nitroActive ? 6 : 3));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [raceState, playerStats, selectedCar, opponent, nitroActive]);

  // Detect overtake
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
  const isRacing = raceState === "racing";

  // Car vertical positioning based on who's ahead
  const playerAheadBy = playerProgress - opponentProgress;
  const playerCarY = 58; // % from top — player car in lower area
  const opponentCarY = 32; // % from top — opponent car in upper area (further ahead visually)

  return (
    <motion.div
      className="relative h-screen w-screen overflow-hidden"
      animate={cameraShake ? { x: [0, -6, 6, -3, 3, 0], y: [0, 3, -3, 2, -1, 0] } : {}}
      transition={{ duration: 0.35 }}
      style={{ background: "#020208" }}
    >
      {/* ====== LAYER 1: City skyline (far parallax) ====== */}
      <div
        className="absolute top-0 left-0 right-0 h-[45%] z-[1]"
        style={{
          backgroundImage: `url(${citySkyline})`,
          backgroundSize: "cover",
          backgroundPosition: `${-bgOffset * 0.15}px center`,
          filter: "brightness(0.7) saturate(1.3)",
        }}
      />
      {/* City overlay gradient */}
      <div className="absolute top-0 left-0 right-0 h-[45%] z-[1] bg-gradient-to-b from-transparent via-transparent to-[#020208]" />

      {/* ====== LAYER 2: Highway road (main parallax) ====== */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          backgroundImage: `url(${raceHighwayBg})`,
          backgroundSize: "cover",
          backgroundPosition: `${-bgOffset * 0.5}px center`,
          filter: `brightness(${nitroActive ? 1.2 : 0.85}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`,
          transition: "filter 0.3s ease",
        }}
      />
      {/* Road darkening overlay */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#020208]/70 via-transparent to-[#020208]/40" />

      {/* ====== LAYER 3: Speed lines + rain (canvas) ====== */}
      <SpeedLinesCanvas
        speed={speedKmh / 30}
        isRacing={isRacing}
        nitroActive={nitroActive}
      />

      {/* ====== LAYER 4: Cars ====== */}
      {/* Player car */}
      <motion.div
        className="absolute z-[6]"
        style={{
          bottom: `${100 - playerCarY - 20}%`,
          left: "10%",
          width: "45%",
          maxWidth: "550px",
        }}
        animate={isRacing ? {
          x: [0, -3, 3, -1, 1, 0],
          y: [0, -2, 2, -1, 0],
          rotate: [0, -0.3, 0.3, -0.15, 0],
        } : {}}
        transition={{
          duration: 0.4,
          repeat: isRacing ? Infinity : 0,
          ease: "linear",
        }}
      >
        <img
          src={carPlayerSide}
          alt="Player car"
          className="w-full h-auto"
          style={{
            mixBlendMode: "screen",
            filter: `
              brightness(${nitroActive ? 1.6 : 1.3})
              saturate(${nitroActive ? 1.5 : 1.2})
              drop-shadow(0 0 30px hsl(185, 80%, 55% / 0.5))
            `,
            transition: "filter 0.3s ease",
          }}
        />
        {/* Underglow reflection on road */}
        <div
          className="absolute -bottom-4 left-[10%] right-[10%] h-8 rounded-full"
          style={{
            background: `radial-gradient(ellipse, hsl(185, 80%, 55% / ${nitroActive ? 0.5 : 0.25}), transparent 70%)`,
            filter: "blur(12px)",
          }}
        />
        {/* Nitro flames */}
        <AnimatePresence>
          {nitroActive && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className="absolute right-[-15%] top-[35%] w-[25%] h-[30%]"
              style={{
                background: "radial-gradient(ellipse at right, hsl(210, 100%, 60% / 0.9), hsl(185, 100%, 50% / 0.4), transparent)",
                filter: "blur(6px)",
                transformOrigin: "right center",
              }}
            >
              <motion.div
                animate={{ opacity: [0.7, 1, 0.5, 1], scaleX: [1, 1.3, 0.9, 1.1] }}
                transition={{ duration: 0.15, repeat: Infinity }}
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at right, hsl(210, 100%, 80% / 0.8), transparent)",
                  filter: "blur(4px)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Opponent car */}
      <motion.div
        className="absolute z-[4]"
        style={{
          top: `${opponentCarY}%`,
          right: `${8 + (playerAheadBy > 0 ? playerAheadBy * 0.5 : 0)}%`,
          width: "35%",
          maxWidth: "420px",
          opacity: 0.9,
        }}
        animate={isRacing ? {
          x: [0, 2, -2, 1, 0],
          y: [0, -1, 1, 0],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: isRacing ? Infinity : 0,
          ease: "linear",
        }}
      >
        <img
          src={carOpponentSide}
          alt="Opponent car"
          className="w-full h-auto"
          style={{
            mixBlendMode: "screen",
            filter: `
              brightness(1.3)
              saturate(1.2)
              drop-shadow(0 0 25px hsl(0, 70%, 55% / 0.5))
            `,
            transform: `scale(${1 - playerAheadBy * 0.003})`,
          }}
        />
        {/* Underglow */}
        <div
          className="absolute -bottom-3 left-[15%] right-[15%] h-6 rounded-full"
          style={{
            background: "radial-gradient(ellipse, hsl(0, 70%, 55% / 0.2), transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </motion.div>

      {/* ====== LAYER 5: Nitro flash overlay ====== */}
      <AnimatePresence>
        {nitroActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0.05, 0.15, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-0 z-[7]"
            style={{
              background: "radial-gradient(ellipse at 30% 70%, hsl(210, 100%, 60% / 0.2), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ====== LAYER 6: HUD Overlay ====== */}

      {/* Top-left: Logo + stats */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-5 top-5 z-[10]"
      >
        <div className="rounded-xl border border-primary/15 bg-background/15 px-4 py-2.5 backdrop-blur-xl">
          <h1 className="font-display text-xs font-black uppercase tracking-[0.3em] text-primary text-glow-cyan">
            TurboNitro
          </h1>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-neon-orange" />
              <span className="font-display text-[10px] text-foreground/70">Lv.{selectedCar?.level ?? 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 text-neon-orange" />
              <span className="font-display text-[10px] text-foreground/70">{state.fuelTanks}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-primary" />
              <span className="font-display text-[10px] text-foreground/70">Rev.{Math.max(0, 5 - (selectedCar?.racesSinceRevision ?? 0))}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top-right: Race progress */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-5 top-5 z-[10]"
      >
        <div className="rounded-xl border border-primary/15 bg-background/15 px-4 py-2.5 backdrop-blur-xl min-w-[180px]">
          {/* Player */}
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-display text-[10px] uppercase tracking-wider text-primary">{playerStats.name}</span>
            <span className="font-display text-sm font-bold text-primary">{Math.round(playerProgress)}%</span>
          </div>
          <div className="relative mb-2.5 h-1 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${playerProgress}%`,
                background: "linear-gradient(90deg, hsl(185, 80%, 55%), hsl(210, 80%, 55%))",
                boxShadow: "0 0 12px hsl(185, 80%, 55% / 0.6)",
              }}
            />
          </div>
          {/* Opponent */}
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-display text-[10px] uppercase tracking-wider text-destructive">{opponent.name}</span>
            <span className="font-display text-sm font-bold text-destructive">{Math.round(opponentProgress)}%</span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-full bg-muted/20">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${opponentProgress}%`,
                background: "linear-gradient(90deg, hsl(0, 70%, 55%), hsl(30, 80%, 55%))",
                boxShadow: "0 0 12px hsl(0, 70%, 55% / 0.6)",
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
        className="absolute bottom-6 left-6 z-[10]"
      >
        <div className="flex items-end gap-1.5">
          <motion.span
            className="font-display text-6xl font-black tabular-nums text-primary"
            style={{
              textShadow: "0 0 30px hsl(185, 80%, 55% / 0.6), 0 0 80px hsl(185, 80%, 55% / 0.3)",
            }}
            animate={nitroActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.2, repeat: nitroActive ? Infinity : 0 }}
          >
            {isRacing || raceState === "finished" ? speedKmh : 0}
          </motion.span>
          <span className="mb-3 font-display text-sm text-muted-foreground/60">km/h</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Gauge className="h-3 w-3 text-primary/50" />
          <span className="font-body text-[10px] text-muted-foreground/60">
            Motor: <span className={playerStats.engineHealth < 30 ? "text-destructive" : "text-foreground/60"}>{playerStats.engineHealth}%</span>
          </span>
        </div>
      </motion.div>

      {/* Bottom-right: Nitro button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-6 right-6 z-[10]"
      >
        <button
          onClick={activateNitro}
          disabled={nitroCharges <= 0 || raceState !== "racing" || nitroActive}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-200 ${
            nitroActive
              ? "border-neon-orange/60 bg-neon-orange/15 scale-110"
              : nitroCharges > 0 && raceState === "racing"
              ? "border-primary/20 bg-background/10 backdrop-blur-xl hover:border-primary/50 active:scale-95"
              : "border-muted/10 bg-background/5 opacity-30"
          }`}
        >
          <Zap className={`h-7 w-7 transition-colors ${nitroActive ? "text-neon-orange" : "text-primary/70"}`} />
          <span className="absolute -bottom-0.5 right-1 font-display text-[9px] font-bold text-muted-foreground/50">
            x{nitroCharges}
          </span>
        </button>
      </motion.div>

      {/* ====== Countdown ====== */}
      <AnimatePresence>
        {raceState === "countdown" && (
          <div className="absolute inset-0 z-[20] flex items-center justify-center">
            {/* Darken overlay during countdown */}
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
            <motion.div
              key={countdown}
              initial={{ scale: 4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative font-display text-[140px] font-black text-primary"
              style={{
                textShadow: "0 0 60px hsl(185, 80%, 55% / 0.8), 0 0 120px hsl(185, 80%, 55% / 0.4), 0 0 200px hsl(185, 80%, 55% / 0.2)",
              }}
            >
              {countdown > 0 ? countdown : "GO!"}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result modal */}
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
