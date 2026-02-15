import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gauge, Wind, Shield, Wrench, Flag, Star, Plus, Coins, Volume2, VolumeX, LogOut, User, Menu, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
// HD garage background images
import bgPhantom from "@/assets/garage-bg/car-phantom-bg.jpg";
import bgBlaze from "@/assets/garage-bg/car-blaze-bg.jpg";
import bgEclipse from "@/assets/garage-bg/car-eclipse-bg.jpg";
import bgFrost from "@/assets/garage-bg/car-frost-bg.jpg";
import bgInferno from "@/assets/garage-bg/car-inferno-bg.jpg";
import bgSolar from "@/assets/garage-bg/car-solar-bg.jpg";
import bgThunder from "@/assets/garage-bg/car-thunder-bg.jpg";
import bgVenom from "@/assets/garage-bg/car-venom-bg.jpg";

const CAR_IMAGES: Record<string, string> = {
  "phantom": bgPhantom,
  "blaze": bgBlaze,
  "eclipse": bgEclipse,
  "frost": bgFrost,
  "inferno": bgInferno,
  "solar": bgSolar,
  "thunder": bgThunder,
  "venom": bgVenom,
};

const getCarImage = (car: { name: string; model: string }): string => {
  const nameLower = car.name.toLowerCase();
  for (const [key, img] of Object.entries(CAR_IMAGES)) {
    if (nameLower.includes(key)) return img;
  }
  // Fallback: cycle through images based on index
  const keys = Object.keys(CAR_IMAGES);
  const hash = car.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return CAR_IMAGES[keys[hash % keys.length]];
};
import garageBgm from "@/assets/garagem-bgm.mp3";
import StatBar from "@/components/garage/StatBar";
import GlowButton from "@/components/garage/GlowButton";
import { useGameState } from "@/hooks/useGameState";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";


const Index = () => {
  const navigate = useNavigate();
  const { state, selectedCar, addPoint, repair, updateState, selectCar, loading } = useGameState();
  const { user, signOut } = useAuth();
  const [garageSoundOn, setGarageSoundOn] = useState(true);
  const [refilling, setRefilling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const garageBgmRef = useRef<HTMLAudioElement | null>(null);

  const audioStartedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(garageBgm);
    audio.loop = true;
    audio.volume = 0.5;
    garageBgmRef.current = audio;

    // Try autoplay immediately
    audio.play().then(() => {
      audioStartedRef.current = true;
    }).catch(() => {
      // Browser blocked autoplay — will start on first user interaction
    });

    return () => {
      audio.pause();
      audio.src = "";
      garageBgmRef.current = null;
    };
  }, []);

  // Ensure audio starts on first user interaction if autoplay was blocked
  useEffect(() => {
    if (audioStartedRef.current) return;

    const handleInteraction = () => {
      if (garageBgmRef.current && garageSoundOn) {
        garageBgmRef.current.play().then(() => {
          audioStartedRef.current = true;
        }).catch(() => {});
      }
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, [garageSoundOn]);

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

  if (loading || !selectedCar) return null;

  const xpPercent = (selectedCar.xp / selectedCar.xpToNext) * 100;
  const needsRevision = selectedCar.racesSinceRevision >= 5;
  const repairCost = 50 + selectedCar.level * 10;

  const carIndex = state.cars.findIndex((c) => c.id === state.selectedCarId);
  const hasPrev = carIndex > 0;
  const hasNext = carIndex < state.cars.length - 1;
  const goToPrev = () => { if (hasPrev) selectCar(state.cars[carIndex - 1].id); };
  const goToNext = () => { if (hasNext) selectCar(state.cars[carIndex + 1].id); };
  const currentBg = getCarImage(selectedCar);

  const stats = [
    { label: "Velocidade", key: "speed" as const, value: selectedCar.speed, icon: <Gauge className="h-4 w-4" />, gradient: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    { label: "Aceleração", key: "acceleration" as const, value: selectedCar.acceleration, icon: <Zap className="h-4 w-4" />, gradient: "bg-gradient-to-r from-violet-500 to-purple-500" },
    { label: "Handling", key: "handling" as const, value: selectedCar.handling, icon: <Wind className="h-4 w-4" />, gradient: "bg-gradient-to-r from-emerald-500 to-teal-500" },
    { label: "Durabilidade", key: "durability" as const, value: selectedCar.durability, icon: <Shield className="h-4 w-4" />, gradient: "bg-gradient-to-r from-amber-500 to-orange-500" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <motion.div
        key={currentBg}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-l from-background/70 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/50" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-3 sm:px-8 sm:py-4"
        >
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-black uppercase tracking-widest text-primary text-glow-cyan sm:text-2xl">
              TurboNitro
            </h1>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-4 md:flex">
              <button onClick={() => navigate("/")} className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
                Home
              </button>
              <button onClick={() => navigate("/marketplace")} className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
                Marketplace
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleGarageSound}
                className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-muted/50"
              >
                {garageSoundOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1 backdrop-blur-sm">
                <Coins className="h-4 w-4 text-neon-orange" />
                <span className="font-display text-[10px] text-foreground sm:text-xs">{state.nitroPoints} NP</span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1 backdrop-blur-sm sm:flex">
                <User className="h-4 w-4 text-primary" />
                <span className="font-display text-[10px] text-foreground sm:text-xs">{user?.username ?? "Piloto"}</span>
              </div>
              <button
                onClick={signOut}
                className="hidden items-center gap-1 rounded-lg bg-muted/30 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-destructive/20 sm:flex"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/30 backdrop-blur-sm md:hidden"
              >
                {menuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-2 overflow-hidden rounded-xl border border-border/20 bg-background/90 backdrop-blur-2xl md:hidden"
              >
                <div className="flex flex-col gap-1 px-3 py-2">
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-display text-sm text-foreground">{user?.username ?? "Piloto"}</span>
                  </div>
                  {[
                    { label: "Home", action: () => { navigate("/"); setMenuOpen(false); } },
                    { label: "Marketplace", action: () => { navigate("/marketplace"); setMenuOpen(false); } },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="rounded-lg px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-card/50 hover:text-primary"
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="rounded-lg px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-destructive/70 transition-colors hover:bg-destructive/10"
                  >
                    Sair
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Main */}
        <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 sm:pb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-16">
          {/* Left: Car info + car navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex max-w-md flex-col items-center text-center lg:items-start lg:text-left"
          >
            {/* Car name + nav arrows */}
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
              Classe Lendária
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrev}
                disabled={!hasPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/60 disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {selectedCar.name.split(" ")[0]}{" "}
                <span className="text-primary text-glow-cyan">{selectedCar.name.split(" ").slice(1).join(" ")}</span>
              </h2>
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card/30 backdrop-blur-sm transition-all hover:bg-card/60 disabled:opacity-20"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            </div>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Token {selectedCar.tokenId} · Piloto: {user?.username ?? "—"}
              <span className="ml-2 text-primary/60">
                ({carIndex + 1}/{state.cars.length})
              </span>
            </p>

            {/* XP / Level badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 glass rounded-xl p-4 max-w-xs w-full"
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

          </motion.div>

          {/* Right: Collapsible Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-xs self-center lg:self-auto"
          >
            {/* Toggle button */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="mb-2 flex w-full items-center justify-between rounded-xl border border-primary/15 bg-card/30 px-4 py-2.5 backdrop-blur-sm transition-colors hover:bg-card/50"
            >
              <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {showStats ? "Fechar Atributos" : "Ver Atributos"}
              </span>
              {showStats ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-primary" />
              )}
            </button>

            <AnimatePresence>
              {showStats && (
                <motion.div
                  key="stats"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
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
                              delay={0.1 + i * 0.1}
                              icon={stat.icon}
                            />
                          </div>
                          {selectedCar.attributePoints > 0 && (
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                              onClick={() => addPoint(stat.key)}
                              className="mt-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neon-green/50 bg-neon-green/10 text-neon-green transition-all hover:bg-neon-green/30 hover:scale-110"
                            >
                              <Plus className="h-3 w-3" />
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>

                    {needsRevision && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-display text-xs font-bold text-destructive">⚠ Revisão necessária!</span>
                          <button
                            onClick={() => repair(repairCost)}
                            className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/20 sm:w-auto"
                          >
                            🔧 Reparar ({repairCost} NP)
                          </button>
                        </div>
                      </motion.div>
                    )}

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

                    {state.fuelTanks < 5 && state.nitroPoints >= 50 && (
                      <button
                        disabled={refilling}
                        onClick={async () => {
                          setRefilling(true);
                          try {
                            const { data, error } = await supabase.rpc("refill_fuel", {
                              _wallet_address: state.walletAddress,
                            });
                            if (error) throw error;
                            if (data === true) {
                              updateState((prev) => ({
                                ...prev,
                                fuelTanks: 5,
                                nitroPoints: prev.nitroPoints - 50,
                              }));
                            }
                          } catch (e) {
                            console.error("Refill failed:", e);
                          } finally {
                            setRefilling(false);
                          }
                        }}
                        className="mt-2 w-full rounded-lg border border-neon-green/30 bg-neon-green/10 px-3 py-2 font-display text-xs uppercase tracking-wider text-neon-green transition-colors hover:bg-neon-green/20 disabled:opacity-50"
                      >
                        ⛽ Reabastecer (50 NP)
                      </button>
                    )}

                    <p className="mt-2 text-center font-body text-[10px] text-muted-foreground">
                      ⛽ {state.fuelTanks}/5 tanques · 🔧 Rev. em {Math.max(0, 5 - selectedCar.racesSinceRevision)} corridas
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Floating car navigation arrows — always visible */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-4 sm:px-8">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/70 hover:border-primary/60 hover:scale-110 active:scale-90 disabled:opacity-15 sm:h-16 sm:w-16"
          >
            <ChevronLeft className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
          </button>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/70 hover:border-primary/60 hover:scale-110 active:scale-90 disabled:opacity-15 sm:h-16 sm:w-16"
          >
            <ChevronRight className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
