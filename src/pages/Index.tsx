import { motion } from "framer-motion";
import { Zap, Gauge, Wind, Shield, Wrench, Flag, Star, Plus, Coins, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import garageScene from "@/assets/garage-scene.jpg";
import garageBgm from "@/assets/garagem-bgm.mp3";
import StatBar from "@/components/garage/StatBar";
import GlowButton from "@/components/garage/GlowButton";
import { useGameState } from "@/hooks/useGameState";


const Index = () => {
  const navigate = useNavigate();
  const { state, selectedCar, addPoint, repair, updateState } = useGameState();
  const [garageSoundOn, setGarageSoundOn] = useState(true);
  const garageBgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(garageBgm);
    audio.loop = true;
    audio.volume = 0.5;
    garageBgmRef.current = audio;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    // Try immediately, and also on first user interaction (browser autoplay policy)
    tryPlay();
    const handleInteraction = () => {
      if (garageBgmRef.current && garageSoundOn) {
        garageBgmRef.current.play().catch(() => {});
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      audio.pause();
      audio.src = "";
      garageBgmRef.current = null;
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  const toggleGarageSound = useCallback(() => {
    setGarageSoundOn(prev => {
      const next = !prev;
      if (garageBgmRef.current) {
        if (next) {
          garageBgmRef.current.play().catch(() => {});
        } else {
          garageBgmRef.current.pause();
        }
      }
      return next;
    });
  }, []);

  if (!selectedCar) return null;

  const xpPercent = (selectedCar.xp / selectedCar.xpToNext) * 100;
  const needsRevision = selectedCar.racesSinceRevision >= 5;
  const repairCost = 50 + selectedCar.level * 10;

  const stats = [
    { label: "Velocidade", key: "speed" as const, value: selectedCar.speed, icon: <Gauge className="h-4 w-4" />, gradient: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    { label: "Aceleração", key: "acceleration" as const, value: selectedCar.acceleration, icon: <Zap className="h-4 w-4" />, gradient: "bg-gradient-to-r from-violet-500 to-purple-500" },
    { label: "Handling", key: "handling" as const, value: selectedCar.handling, icon: <Wind className="h-4 w-4" />, gradient: "bg-gradient-to-r from-emerald-500 to-teal-500" },
    { label: "Durabilidade", key: "durability" as const, value: selectedCar.durability, icon: <Shield className="h-4 w-4" />, gradient: "bg-gradient-to-r from-amber-500 to-orange-500" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${garageScene})` }} />
      <div className="absolute inset-0 bg-gradient-to-l from-background/70 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/50" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-8 py-4"
        >
          <h1 className="font-display text-2xl font-black uppercase tracking-widest text-primary text-glow-cyan">
            TurboNitro
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleGarageSound}
              className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm transition-colors hover:bg-muted/50"
            >
              {garageSoundOn ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                {garageSoundOn ? "Som" : "Mudo"}
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 backdrop-blur-sm">
              <Coins className="h-4 w-4 text-neon-orange" />
              <span className="font-display text-xs text-foreground">{state.nitroPoints} NP</span>
            </div>
            <div className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Garagem
            </div>
          </div>
        </motion.header>

        {/* Main */}
        <main className="flex flex-1 items-end justify-between gap-8 px-8 pb-8 lg:items-center lg:px-16">
          {/* Left: Car info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md"
          >
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
              Classe Lendária
            </p>
            <h2 className="font-display text-5xl font-black uppercase tracking-tight text-foreground lg:text-6xl">
              {selectedCar.name.split(" ")[0]}{" "}
              <span className="text-primary text-glow-cyan">{selectedCar.name.split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Token {selectedCar.tokenId} · {selectedCar.ownerWallet}
            </p>

            {/* XP / Level badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 glass rounded-xl p-4 max-w-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-neon-orange" />
                  <span className="font-display text-sm font-bold text-foreground">
                    Nível {selectedCar.level}
                  </span>
                </div>
                <span className="font-display text-xs text-muted-foreground">
                  {selectedCar.xp}/{selectedCar.xpToNext} XP
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-orange to-yellow-400"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-body text-muted-foreground">
                <span>{selectedCar.wins}W · {selectedCar.racesCount}R</span>
                {selectedCar.attributePoints > 0 && (
                  <span className="text-neon-green font-display font-bold animate-pulse">
                    +{selectedCar.attributePoints} pontos!
                  </span>
                )}
              </div>
            </motion.div>

            {/* Revision warning */}
            {needsRevision && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 glass rounded-xl p-3 max-w-xs border-destructive/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-destructive">⚠ Revisão necessária!</span>
                  <button
                    onClick={() => repair(repairCost)}
                    className="font-display text-xs text-primary hover:underline"
                  >
                    Reparar ({repairCost} NP)
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right: Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-xs"
          >
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Atributos
                </h3>
                <div className="flex items-center gap-1 text-xs">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className="font-body text-muted-foreground">
                    Motor: <span className={selectedCar.engineHealth < 30 ? "text-destructive" : "text-foreground"}>{selectedCar.engineHealth}%</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {stats.map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <div className="flex-1">
                      <StatBar
                        label={stat.label}
                        value={stat.value}
                        gradient={stat.gradient}
                        delay={0.5 + i * 0.15}
                        icon={stat.icon}
                      />
                    </div>
                    {selectedCar.attributePoints > 0 && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        onClick={() => addPoint(stat.key)}
                        className="mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neon-green/50 bg-neon-green/10 text-neon-green transition-all hover:bg-neon-green/30 hover:scale-110"
                      >
                        <Plus className="h-3 w-3" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

              <div className="flex flex-col gap-3 sm:flex-row">
                <GlowButton variant="purple" icon={<Wrench className="h-4 w-4" />} className="flex-1">
                  Peças
                </GlowButton>
                {state.fuelTanks > 0 ? (
                  <GlowButton
                    variant="cyan"
                    icon={<Flag className="h-4 w-4" />}
                    className="flex-1"
                    onClick={() => navigate("/race")}
                  >
                    Iniciar Corrida
                  </GlowButton>
                ) : (
                  <div className="flex-1 flex flex-col gap-1">
                    <button
                      disabled
                      className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-destructive/70 cursor-not-allowed"
                    >
                      ⛽ Sem Fuel
                    </button>
                  </div>
                )}
              </div>

              {/* Admin: Reset Fuel */}
              <button
                onClick={() => {
                  updateState((prev) => ({ ...prev, fuelTanks: 5 }));
                }}
                className="mt-2 w-full rounded-lg border border-neon-orange/30 bg-neon-orange/10 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-neon-orange transition-colors hover:bg-neon-orange/20"
              >
                🔧 Admin: Resetar Fuel (5/5)
              </button>

              <p className="mt-2 text-center font-body text-[10px] text-muted-foreground">
                ⛽ {state.fuelTanks}/5 tanques · 🔧 Rev. em {Math.max(0, 5 - selectedCar.racesSinceRevision)} corridas
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;
