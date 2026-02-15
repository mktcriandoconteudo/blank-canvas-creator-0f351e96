import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Gauge, Wrench, Star, Zap, Volume2, VolumeX } from "lucide-react";
import SpeedLinesCanvas from "@/components/race/SpeedLinesCanvas";
import RaceResultModal from "@/components/race/RaceResultModal";
import RaceVideoPlayer from "@/components/race/RaceVideoPlayer";
import SimpleVideoPlayer from "@/components/race/SimpleVideoPlayer";
import { useGameState } from "@/hooks/useGameState";

// Cinematic videos — starting grid + race clips + victory/defeat finales
import raceBattleVideo1 from "@/assets/race-battle-video.mp4";
import raceVictoryVideo from "@/assets/race-victory-video.mp4";
import azulGanha from "@/assets/azul_ganha.mp4";
import raceDefeatVideo from "@/assets/race-defeat-video.mp4";
import azulPerde from "@/assets/azul_perde.mp4";
// raceStartVideo removed
import raceScenePlayer from "@/assets/race-scene-main.jpg";
import raceBgm from "@/assets/race-bgm.mp3";

// Car-specific videos
const CAR_VICTORY_VIDEOS: Record<string, string> = {
  "thunder": azulGanha,
};
const CAR_DEFEAT_VIDEOS: Record<string, string> = {
  "thunder": azulPerde,
};


const RACE_VIDEOS = [raceBattleVideo1];


const FINISH_LINE = 100;
const TICK_MS = 50;

const Race = () => {
  const navigate = useNavigate();
  const { state, selectedCar, finishRace, loading } = useGameState();
  const playerStats = selectedCar ?? { speed: 70, acceleration: 60, engineHealth: 100, name: "Unknown", level: 1 };
  
  // Debug: log which car is actually selected
  console.log("[RACE MOUNT]", { selectedCarId: state.selectedCarId, selectedCarName: selectedCar?.name, allCars: state.cars.map(c => c.id + "=" + c.name) });

  const noFuel = !loading && state.fuelTanks <= 0;

  // Pre-determine race outcome so Thunder Bolt can play the right video from the start
  const [preWin] = useState(() => Math.random() > 0.45); // ~55% win chance
  
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
  const [finaleVideoSrc, setFinaleVideoSrc] = useState<string | undefined>(undefined);
  const [xpResult, setXpResult] = useState({ leveledUp: false, newLevel: 0 });
  const [cameraShake, setCameraShake] = useState(false);
  const [nitroActive, setNitroActive] = useState(false);
  const [nitroCharges, setNitroCharges] = useState(3);
  const [bgOffset, setBgOffset] = useState(0);
  // Capture car key — update when selectedCar loads
  const carKeyRef = useRef(selectedCar?.name.toLowerCase().split(" ")[0] ?? "");
  useEffect(() => {
    if (selectedCar?.name) {
      const key = selectedCar.name.toLowerCase().split(" ")[0];
      carKeyRef.current = key;
      console.log("[RACE] carKey locked:", key);
    }
  }, [selectedCar?.name]);
  
  // Check if current car is Thunder Bolt
  const isThunder = carKeyRef.current === "thunder" || (selectedCar?.name ?? "").toLowerCase().startsWith("thunder");
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);

  const prevLeader = useRef<"player" | "opponent" | "tie">("tie");
  const finishRaceRef = useRef(finishRace);
  finishRaceRef.current = finishRace;
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  
  const countdownVideoRef = useRef<HTMLVideoElement | null>(null);

  // Force video playback on first user interaction (iOS + Android workaround)
  useEffect(() => {
    const tryPlay = () => {
      if (countdownVideoRef.current && countdownVideoRef.current.paused) {
        countdownVideoRef.current.load();
        countdownVideoRef.current.play().catch(() => {});
      }
    };
    // Try immediately
    tryPlay();
    // Also listen for user gesture
    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("click", tryPlay, { once: true });
    return () => {
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
  }, []);

  // Cleanup audio on unmount
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
    if (noFuel || raceState !== "countdown") return;
    if (countdown <= 0) {
      setRaceState("racing");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, raceState, noFuel]);

  // Thunder Bolt: force race to end at exactly 10 seconds
  useEffect(() => {
    if (raceState !== "racing" || !isThunder) return;
    const timer = setTimeout(() => {
      setRaceState("finished");
      setNitroActive(false);
      setPlayerProgress(FINISH_LINE);
      setOpponentProgress(preWin ? FINISH_LINE * 0.9 : FINISH_LINE);
      setVictory(preWin);
      console.log("[THUNDER] Race ended at 10s, won:", preWin);
      const result = finishRaceRef.current(preWin);
      setXpResult(result);
      setTimeout(() => setShowResult(true), 500);
    }, 10000);
    return () => clearTimeout(timer);
  }, [raceState, isThunder]);

  // Start BGM when race begins — persists through finish, cleaned on unmount
  useEffect(() => {
    if (raceState !== "racing") return;
    setSoundOn(true);
    soundOnRef.current = true;

    const bgmAudio = new Audio(raceBgm);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.4;
    bgmRef.current = bgmAudio;
    bgmAudio.play().catch(() => {});
    // NO cleanup here — audio persists through "finished" state
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

  // isThunder declared above after carKeyRef

  // Detect finish
  useEffect(() => {
    if (raceState !== "racing") return;
    if (playerProgress >= FINISH_LINE || opponentProgress >= FINISH_LINE) {
      setRaceState("finished");
      setNitroActive(false);
      
      // For Thunder Bolt, use pre-determined result; for others, use actual race result
      const won = isThunder ? preWin : playerProgress >= opponentProgress;
      setVictory(won);

      const carName = selectedCar?.name ?? playerStats.name ?? "";
      const carKey = carKeyRef.current || carName.toLowerCase().split(" ")[0];
      if (!carKeyRef.current && carKey) carKeyRef.current = carKey;
      
      console.log("[RACE FINISH]", { carName, carKey, isThunder, won, preWin });
      
      if (!isThunder) {
        // Non-Thunder cars use finale video swap
        const hasCustom = !!(CAR_VICTORY_VIDEOS[carKey]);
        if (hasCustom) {
          setFinaleVideoSrc(won ? CAR_VICTORY_VIDEOS[carKey] : CAR_DEFEAT_VIDEOS[carKey]);
        } else {
          setFinaleVideoSrc(won ? raceDefeatVideo : raceVictoryVideo);
        }
      }
      // Thunder Bolt doesn't need finaleVideoSrc — it already plays the right video from start
      
      const result = finishRaceRef.current(won);
      setXpResult(result);
      setTimeout(() => setShowResult(true), isThunder ? 10000 : 5500);
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

  const toggleSound = useCallback(() => {
    const next = !soundOnRef.current;
    console.log("[toggleSound] switching to:", next, "bgmRef exists:", !!bgmRef.current, "paused:", bgmRef.current?.paused);
    setSoundOn(next);
    soundOnRef.current = next;
    if (!next) {
      if (bgmRef.current) { bgmRef.current.pause(); }
    } else {
      if (bgmRef.current) { bgmRef.current.play().catch(() => {}); }
    }
  }, []);
  const earnedNP = Math.round(((victory ? 150 : 20) * playerStats.engineHealth) / 100);
  const speedKmh = raceState === "countdown" ? 0 : Math.round((playerProgress / 100) * 320 + (nitroActive ? 80 : 0));
  const isRacing = raceState === "racing";


  return (
    <motion.div
      className="relative h-screen w-screen overflow-hidden select-none"
      animate={cameraShake ? { x: [0, -8, 8, -4, 4, 0], y: [0, 4, -4, 2, -1, 0] } : {}}
      transition={{ duration: 0.4 }}
      style={{ background: "#020208" }}
    >
      {/* ====== Race videos ====== */}
      {isThunder ? (
        <SimpleVideoPlayer
          videoSrc={preWin ? azulGanha : azulPerde}
          isActive={true}
          nitroActive={nitroActive}
          isRacing={isRacing}
        />
      ) : (
        <RaceVideoPlayer
          videos={RACE_VIDEOS}
          finaleVideo={finaleVideoSrc}
          isActive={true}
          poster={raceScenePlayer}
          nitroActive={nitroActive}
          isRacing={isRacing}
        />
      )}




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
        className="absolute left-3 top-[8%] z-[10] sm:left-5 sm:top-[10%]"
      >
        <div className="rounded-xl border border-primary/15 bg-background/15 px-3 py-2 backdrop-blur-xl sm:px-4 sm:py-2.5">
          <h1 className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-primary text-glow-cyan sm:text-xs">
            TurboNitro
          </h1>
          <div className="mt-1 flex items-center gap-2 sm:mt-1.5 sm:gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-neon-orange" />
              <span className="font-display text-[9px] text-foreground/70 sm:text-[10px]">Lv.{selectedCar?.level ?? 1}</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 text-neon-orange" />
              <span className="font-display text-[9px] text-foreground/70 sm:text-[10px]">{state.fuelTanks}/5</span>
            </div>
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3 text-primary" />
              <span className="font-display text-[9px] text-foreground/70 sm:text-[10px]">Rev.{Math.max(0, 5 - (selectedCar?.racesSinceRevision ?? 0))}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sound toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={toggleSound}
        className="absolute left-3 top-[20%] z-[10] flex h-7 w-7 items-center justify-center rounded-lg border border-primary/15 bg-background/15 backdrop-blur-xl transition-colors hover:bg-background/30 sm:left-5 sm:top-[22%] sm:h-8 sm:w-8"
      >
        {soundOn ? (
          <Volume2 className="h-3.5 w-3.5 text-primary/70 sm:h-4 sm:w-4" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground/50 sm:h-4 sm:w-4" />
        )}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-3 top-[8%] z-[10] sm:right-5 sm:top-[10%]"
      >
        <div className="rounded-xl border border-primary/15 bg-background/15 px-3 py-2 backdrop-blur-xl min-w-[140px] sm:px-4 sm:py-2.5 sm:min-w-[180px]">
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
        className="absolute bottom-[8%] left-3 z-[10] sm:bottom-[10%] sm:left-6"
      >
        <div className="flex items-end gap-1">
          <motion.span
            className="font-display text-4xl font-black tabular-nums text-primary sm:text-6xl"
            style={{
              textShadow: "0 0 30px hsl(185, 80%, 55% / 0.6), 0 0 80px hsl(185, 80%, 55% / 0.3)",
            }}
            animate={nitroActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.2, repeat: nitroActive ? Infinity : 0 }}
          >
            {isRacing || raceState === "finished" ? speedKmh : 0}
          </motion.span>
          <span className="mb-1.5 font-display text-[10px] text-muted-foreground/60 sm:mb-3 sm:text-sm">km/h</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <Gauge className="h-3 w-3 text-primary/50" />
          <span className="font-body text-[9px] text-muted-foreground/60 sm:text-[10px]">
            Motor: <span className={playerStats.engineHealth < 30 ? "text-destructive" : "text-foreground/60"}>{playerStats.engineHealth}%</span>
          </span>
        </div>
      </motion.div>

      {/* Bottom-right: Nitro button */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-[8%] right-3 z-[10] sm:bottom-[10%] sm:right-6"
      >
        <button
          onClick={activateNitro}
          disabled={nitroCharges <= 0 || raceState !== "racing" || nitroActive}
          className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 sm:h-16 sm:w-16 ${
            nitroActive
              ? "border-neon-orange/60 bg-neon-orange/15 scale-110"
              : nitroCharges > 0 && raceState === "racing"
              ? "border-primary/20 bg-background/10 backdrop-blur-xl hover:border-primary/50 active:scale-95"
              : "border-muted/10 bg-background/5 opacity-30"
          }`}
        >
          <Zap className={`h-5 w-5 transition-colors sm:h-7 sm:w-7 ${nitroActive ? "text-neon-orange" : "text-primary/70"}`} />
          <span className="absolute -bottom-0.5 right-1 font-display text-[8px] font-bold text-muted-foreground/50 sm:text-[9px]">
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
              className="font-display text-3xl font-black uppercase text-primary/80 sm:text-5xl"
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
              className="relative font-display text-[80px] font-black text-primary sm:text-[140px]"
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
        soundOn={soundOn}
        onToggleSound={toggleSound}
      />

      {/* No fuel overlay */}
      <AnimatePresence>
        {noFuel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-6 rounded-2xl border border-primary/20 bg-card/50 p-8 backdrop-blur-xl sm:p-12"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
                <Fuel className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center">
                <h2 className="font-display text-2xl font-black uppercase tracking-wider text-foreground sm:text-3xl">
                  Sem Combustível
                </h2>
                <p className="mt-2 max-w-xs font-body text-sm text-muted-foreground">
                  Seus tanques estão vazios! Volte à garagem para reabastecer antes de correr.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-2">
                <Fuel className="h-4 w-4 text-primary" />
                <span className="font-display text-sm text-primary">
                  {state.fuelTanks}/5 Tanques
                </span>
              </div>
              <button
                onClick={() => navigate("/garage")}
                className="rounded-xl bg-primary px-8 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(185_80%_55%/0.3)] active:scale-95"
              >
                ⛽ Ir para Garagem
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Race;
