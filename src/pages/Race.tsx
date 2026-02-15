import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Gauge, Wrench, Star, Zap, Volume2, VolumeX } from "lucide-react";
import SpeedLinesCanvas from "@/components/race/SpeedLinesCanvas";
import RaceResultModal from "@/components/race/RaceResultModal";
import RaceVideoPlayer from "@/components/race/RaceVideoPlayer";
import { useGameState } from "@/hooks/useGameState";

// Cinematic videos — starting grid + race clips + victory/defeat finales
import raceBattleVideo1 from "@/assets/race-battle-video.mp4";
import raceBattleVideo2 from "@/assets/race-battle-video-2.mp4";
import raceVictoryVideo from "@/assets/race-battle-video-3.mp4";
import raceDefeatVideo from "@/assets/race-defeat-video.mp4";
import raceStartVideo from "@/assets/race-start-video.mp4";
import raceScenePlayer from "@/assets/race-scene-main.jpg";
import raceBgm from "@/assets/race-bgm.mp3";

const RACE_VIDEOS = [raceBattleVideo1, raceBattleVideo2, raceBattleVideo1];


const FINISH_LINE = 100;
const TICK_MS = 50;

const Race = () => {
  const navigate = useNavigate();
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
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);

  const prevLeader = useRef<"player" | "opponent" | "tie">("tie");
  const finishRaceRef = useRef(finishRace);
  finishRaceRef.current = finishRace;
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup BGM on unmount
  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
        bgmRef.current = null;
      }
    };
  }, []);

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

  // Start BGM only when race actually begins
  useEffect(() => {
    if (raceState !== "racing") return;
    if (bgmRef.current) return; // already playing
    if (!soundOnRef.current) return;
    const audio = new Audio(raceBgm);
    audio.loop = true;
    audio.volume = 0.4;
    bgmRef.current = audio;
    audio.play().catch(() => {});
  }, [raceState]);

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

  // Detect overtake — switch cinematic camera
  useEffect(() => {
    if (raceState !== "racing") return;
    const cur = playerProgress > opponentProgress + 3 ? "player"
      : opponentProgress > playerProgress + 3 ? "opponent" : "tie";
    if (cur !== prevLeader.current && cur !== "tie") {
      setCameraShake(true);
      setTimeout(() => setCameraShake(false), 600);
    }
    prevLeader.current = cur;
  }, [playerProgress, opponentProgress, raceState]);

  // Detect finish
  useEffect(() => {
    if (raceState !== "racing") return;
    if (playerProgress >= FINISH_LINE || opponentProgress >= FINISH_LINE) {
      setRaceState("finished");
      setNitroActive(false);
      // Stop BGM immediately
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
        bgmRef.current = null;
      }
      const won = playerProgress >= opponentProgress;
      setVictory(won);
      const result = finishRaceRef.current(won);
      setXpResult(result);
      setTimeout(() => setShowResult(true), 3500);
    }
  }, [playerProgress, opponentProgress, raceState]);

  const activateNitro = useCallback(() => {
    if (nitroCharges <= 0 || raceState !== "racing" || nitroActive) return;
    setNitroActive(true);
    setNitroCharges((c) => c - 1);
    setCameraShake(true);
    setTimeout(() => setCameraShake(false), 400);
    setTimeout(() => setNitroActive(false), 2500);
  }, [nitroCharges, raceState, nitroActive]);

  const handlePlayAgain = () => window.location.reload();
  const earnedNP = Math.round(((victory ? 150 : 20) * playerStats.engineHealth) / 100);
  const speedKmh = Math.round(180 + (playerProgress / 100) * 180 + (nitroActive ? 80 : 0));
  const isRacing = raceState === "racing";


  return (
    <motion.div
      className="relative h-screen w-screen overflow-hidden select-none"
      animate={cameraShake ? { x: [0, -8, 8, -4, 4, 0], y: [0, 4, -4, 2, -1, 0] } : {}}
      transition={{ duration: 0.4 }}
      style={{ background: "#020208" }}
    >
      {/* ====== LAYER 1: Start video (countdown) ====== */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          opacity: raceState === "countdown" ? 1 : 0,
          transition: "opacity 0.8s ease",
          pointerEvents: "none",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.85) saturate(1.2) contrast(1.1)" }}
        >
          <source src={raceStartVideo} type="video/mp4" />
        </video>
      </div>

      {/* ====== LAYER 2: Race videos in sequence (during race) ====== */}
      <RaceVideoPlayer
        videos={RACE_VIDEOS}
        finaleVideo={raceState === "finished" ? (victory ? raceVictoryVideo : raceDefeatVideo) : undefined}
        isActive={raceState !== "countdown"}
        poster={raceScenePlayer}
        nitroActive={nitroActive}
        isRacing={isRacing}
      />




      {/* ====== LAYER 3: Cinematic vignette + grade ====== */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background: `
            radial-gradient(ellipse at 50% 80%, transparent 30%, rgba(0,0,0,0.5) 100%),
            linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)
          `,
        }}
      />

      {/* ====== LAYER 4: Cinematic letterbox bars ====== */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[8%] z-[4] bg-gradient-to-b from-black/80 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[8%] z-[4] bg-gradient-to-t from-black/80 to-transparent" />

      {/* ====== LAYER 5: Speed lines + rain (canvas) ====== */}
      <SpeedLinesCanvas
        speed={speedKmh / 30}
        isRacing={isRacing}
        nitroActive={nitroActive}
      />

      {/* ====== LAYER 6: Nitro flash overlay ====== */}
      <AnimatePresence>
        {nitroActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0.1, 0.25, 0.1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-[8]"
            style={{
              background: "radial-gradient(ellipse at 50% 60%, hsl(210, 100%, 60% / 0.25), hsl(185, 80%, 50% / 0.1), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ====== LAYER 7: Motion blur on edges when racing ====== */}
      {isRacing && (
        <div
          className="pointer-events-none absolute inset-0 z-[6]"
          style={{
            background: `
              linear-gradient(to right, rgba(0,0,0,${nitroActive ? 0.5 : 0.3}) 0%, transparent 15%, transparent 85%, rgba(0,0,0,${nitroActive ? 0.5 : 0.3}) 100%)
            `,
          }}
        />
      )}

      {/* ====== HUD OVERLAY ====== */}

      {/* Top-left: Logo + stats */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-5 top-[10%] z-[10]"
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

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => {
          const next = !soundOn;
          setSoundOn(next);
          soundOnRef.current = next;
          if (!next) {
            if (bgmRef.current) { bgmRef.current.pause(); }
          } else {
            if (raceState === "racing" && bgmRef.current) {
              bgmRef.current.play().catch(() => {});
            }
          }
        }}
        className="absolute left-5 top-[22%] z-[10] flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-background/15 backdrop-blur-xl transition-colors hover:bg-background/30"
      >
        {soundOn ? (
          <Volume2 className="h-4 w-4 text-primary/70" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground/50" />
        )}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-5 top-[10%] z-[10]"
      >
        <div className="rounded-xl border border-primary/15 bg-background/15 px-4 py-2.5 backdrop-blur-xl min-w-[180px]">
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
        className="absolute bottom-[10%] left-6 z-[10]"
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
        className="absolute bottom-[10%] right-6 z-[10]"
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

      {/* Center: Overtake flash text */}
      <AnimatePresence>
        {cameraShake && isRacing && (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: [0, 1, 0], scale: [2, 1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-[9] flex items-center justify-center pointer-events-none"
          >
            <span
              className="font-display text-5xl font-black uppercase text-primary/80"
              style={{ textShadow: "0 0 40px hsl(185, 80%, 55% / 0.8)" }}
            >
              {playerProgress > opponentProgress ? "OVERTAKE!" : "OVERTAKEN!"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== Countdown ====== */}
      <AnimatePresence>
        {raceState === "countdown" && (
          <div className="absolute inset-0 z-[20] flex items-center justify-center">
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
