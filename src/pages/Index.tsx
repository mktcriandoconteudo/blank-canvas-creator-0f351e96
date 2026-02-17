import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gauge, Wind, Shield, Wrench, Flag, Star, Plus, Coins, Volume2, VolumeX, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Droplets, ShieldCheck, Timer, X } from "lucide-react";
import MainNav from "@/components/MainNav";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import { formatNP } from "@/lib/utils";
import { getMaxFuel } from "@/lib/gameState";
// HD garage background images
import bgPhantom from "@/assets/garage-bg/car-phantom-bg.jpg";
import bgBlaze from "@/assets/garage-bg/car-blaze-bg.jpg";
import bgEclipse from "@/assets/garage-bg/car-eclipse-bg.jpg";
import bgFrost from "@/assets/garage-bg/car-frost-bg.jpg";
import bgInferno from "@/assets/garage-bg/car-inferno-bg.jpg";
import bgSolar from "@/assets/garage-bg/car-solar-bg.jpg";
import bgThunder from "@/assets/garage-bg/car-thunder-bg.jpg";
import bgVenom from "@/assets/garage-bg/car-venom-bg.jpg";
import biaAvatar from "@/assets/bia-avatar.png";
import raulAvatar from "@/assets/raul-avatar.png";

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
import { needsOilChange, kmSinceOilChange, isEngineBlown } from "@/lib/gameState";
import { useAuth } from "@/hooks/useAuth";
import { useInsurance } from "@/hooks/useInsurance";
import { INSURANCE_PLANS } from "@/lib/insurance";


/* ─── Per-car fuel timer ─── */
const CarFuelTimer = ({ lastRefill }: { lastRefill: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const refillTime = new Date(lastRefill).getTime() + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = Math.max(0, refillTime - now);
      if (diff <= 0) {
        setTimeLeft("Pronto para reabastecer!");
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastRefill]);

  return (
    <div className="flex items-center gap-1.5">
      <Timer className="h-3 w-3 text-neon-orange" />
      <span className="font-display text-[10px] font-bold text-neon-orange">
        ⛽ Reabastece em: {timeLeft}
      </span>
    </div>
  );
};

interface LastRaceResult {
  victory: boolean;
  npEarned: number;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  carName: string;
  timestamp: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { state, selectedCar, addPoint, repair, oilChange, updateState, selectCar, loading } = useGameState();
  const { user, session } = useAuth();
  const [garageSoundOn, setGarageSoundOn] = useState(true);
  const [showStats, setShowStats] = useState(window.innerWidth >= 768);
  const [showInsurance, setShowInsurance] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);
  const [lastRace, setLastRace] = useState<LastRaceResult | null>(null);
  
  const [raulVisible, setRaulVisible] = useState(false);
  const [raulHasAppeared, setRaulHasAppeared] = useState(false); // once true, all repairs go through queue
  const [raulMessageIndex, setRaulMessageIndex] = useState(0);
  const [mechanicQueue, setMechanicQueue] = useState<number | null>(null); // seconds remaining
  
  const [biaVisible, setBiaVisible] = useState(false);
  const [biaDismissed, setBiaDismissed] = useState(false);
  const [biaMessageIndex, setBiaMessageIndex] = useState(0);
  const garageBgmRef = useRef<HTMLAudioElement | null>(null);

  // Load last race result from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lastRaceResult");
      if (stored) {
        const parsed: LastRaceResult = JSON.parse(stored);
        // Only show if less than 30 minutes old
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          setLastRace(parsed);
        }
        localStorage.removeItem("lastRaceResult");
      }
    } catch {}
  }, []);

  const { policy, isInsured, daysLeft, claimsLeft, purchase } = useInsurance(
    selectedCar?.id ?? null,
    state.walletAddress
  );

  // Bia random pop-up messages
  const BIA_MESSAGES = [
    "😏 \"Psiu! Vai correr sem seguro mesmo? Corajoso, hein...\"",
    "🤭 \"Oi sumido(a)! Tô passando pra lembrar que acidentes acontecem, viu!\"",
    "😜 \"Sabe aquele carro lindo? Imagina ele todo amassado... Seguro resolve!\"",
    "🙈 \"Ai, desculpa aparecer assim do nada! Mas é que eu vi seu carro sem proteção e fiquei preocupada...\"",
    "💅 \"Oie! Vim rapidinho só pra dizer que hoje tá um ótimo dia pra contratar um seguro, tá?\"",
    "🤗 \"E aí, piloto(a)! Lembra de mim? Sou a Bia! Vim te fazer uma proposta irrecusável!\"",
    "😇 \"Não quero ser chata, mas... já pensou no prejuízo se o motor fundir SEM seguro? Ai ai...\"",
    "🫣 \"Tô só passando... fingindo que não vi esse carro sem seguro... ops, vi sim!\"",
    "😎 \"Sabia que quem tem seguro dorme tranquilo? Eu sei porque eu vendo, né kk\"",
    "🥺 \"Por favorzinho, deixa eu te proteger? Prometo que vale a pena!\"",
    "💁‍♀️ \"Amiga, amigo... carro sem seguro em 2026? Tá brincando né?\"",
    "😤 \"Olha, eu sou persistente SIM! E vou continuar aparecendo até você contratar!\"",
  ];

  // Bia appears randomly every 15-40 seconds, only if NOT insured
  useEffect(() => {
    if (isInsured) {
      setBiaVisible(false);
      return;
    }
    if (biaDismissed) return;

    // Initial random delay before first appearance
    const initialDelay = setTimeout(() => {
      setBiaVisible(true);
      setBiaMessageIndex(Math.floor(Math.random() * BIA_MESSAGES.length));
    }, 5000 + Math.random() * 10000);

    return () => clearTimeout(initialDelay);
  }, [isInsured, biaDismissed, selectedCar?.id]);

  // Auto-cycle: disappear after 12s, reappear after 15-40s with a new message
  useEffect(() => {
    if (!biaVisible || isInsured) return;

    const hideTimer = setTimeout(() => {
      setBiaVisible(false);
      // Schedule reappearance
      const reappearTimer = setTimeout(() => {
        if (!biaDismissed && !isInsured) {
          setBiaMessageIndex(Math.floor(Math.random() * BIA_MESSAGES.length));
          setBiaVisible(true);
        }
      }, 15000 + Math.random() * 25000);
      // Store cleanup ref
      return () => clearTimeout(reappearTimer);
    }, 12000);

    return () => clearTimeout(hideTimer);
  }, [biaVisible, isInsured, biaDismissed]);

  // Reset Bia dismissed when switching cars
  useEffect(() => {
    setBiaDismissed(false);
    setBiaVisible(false);
    setShowInsurance(false);
    setRaulVisible(false);
    setRaulHasAppeared(false);
    setMechanicQueue(null);
  }, [selectedCar?.id]);

  // Raul pop-up timer — appears randomly, stays once appeared
  useEffect(() => {
    if (raulHasAppeared) return; // already showed up, stays permanently
    const initialDelay = setTimeout(() => {
      setRaulVisible(true);
      setRaulHasAppeared(true);
      setRaulMessageIndex(Math.floor(Math.random() * 10));
    }, 3000 + Math.random() * 8000);
    return () => clearTimeout(initialDelay);
  }, [raulHasAppeared, selectedCar?.id]);

  // Mechanic queue countdown
  useEffect(() => {
    if (mechanicQueue === null || mechanicQueue <= 0) return;
    const interval = setInterval(() => {
      setMechanicQueue(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mechanicQueue]);

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

  if (loading) return null;

  // No cars - redirect to marketplace
  if (state.cars.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="text-6xl">🏎️</div>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-foreground">
            Sua garagem está vazia!
          </h1>
          <p className="font-body text-sm text-muted-foreground max-w-md">
            Você precisa comprar um carro no Marketplace antes de poder correr. 
            Use seus Nitro Points para adquirir seu primeiro veículo.
          </p>
          <div className="flex items-center justify-center gap-2 text-neon-orange font-display text-sm font-bold">
            <Coins className="h-4 w-4" />
            {formatNP(state.nitroPoints)} NP disponíveis
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate("/marketplace")}
              className="rounded-xl bg-primary px-8 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ir ao Marketplace
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-border/30 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/10 transition-colors"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!selectedCar) return null;

  const xpPercent = (selectedCar.xp / selectedCar.xpToNext) * 100;
  const needsRevision = selectedCar.racesSinceRevision >= 5;
  const repairCost = 50 + selectedCar.level * 10;
  const oilNeeded = needsOilChange(selectedCar);
  const kmSinceOil = kmSinceOilChange(selectedCar);
  const oilCost = 30 + selectedCar.level * 5;
  const hasMechanicalIssues = needsRevision || isEngineBlown(selectedCar) || selectedCar.engineHealth < 50 || oilNeeded;

  // Helper: start mechanic queue for a repair action
  const startMechanicQueue = (action: "repair" | "oil") => {
    const queueTime = action === "repair" ? 30 + Math.floor(Math.random() * 60) : 20 + Math.floor(Math.random() * 40);
    setMechanicQueue(queueTime);
    
    setTimeout(() => {
      if (action === "repair") repair(repairCost);
      else oilChange(oilCost);
      setMechanicQueue(0);
      
    }, queueTime * 1000);
  };

  // Handle repair click — instant if Raul hasn't appeared, queue otherwise
  const handleRepairClick = () => {
    if (raulHasAppeared) {
      startMechanicQueue("repair");
    } else {
      repair(repairCost);
    }
  };
  const handleOilClick = () => {
    if (raulHasAppeared) {
      startMechanicQueue("oil");
    } else {
      oilChange(oilCost);
    }
  };

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
        <MainNav nitroPoints={state.nitroPoints} transparent />

        {/* Garage-specific controls */}
        <div className="flex items-center justify-end gap-2 px-4 py-1 sm:px-8">
          <button
            onClick={toggleGarageSound}
            className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-muted/50"
          >
            {garageSoundOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        {/* Main */}
        <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-24 sm:pb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-16">
          {/* Left: Car info + car navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left"
          >
            {/* Car name */}
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/70 sm:text-xs">
              Classe Lendária
            </p>
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {selectedCar.name.split(" ")[0]}{" "}
              <span className="text-primary text-glow-cyan">{selectedCar.name.split(" ").slice(1).join(" ")}</span>
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-card/50 px-1.5 py-0.5 font-display text-[10px] font-bold text-primary border border-primary/20">
                PLACA {selectedCar.licensePlate}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-card/50 px-1.5 py-0.5 font-display text-[10px] font-bold text-foreground border border-border/20">
                Token {selectedCar.tokenId}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-card/50 px-1.5 py-0.5 font-display text-[10px] font-bold text-foreground border border-border/20">
                Piloto: <span className="text-primary">{user?.username ?? "—"}</span>
                <span className="text-primary/60">({carIndex + 1}/{state.cars.length})</span>
              </span>
            </div>

            {/* XP / Level badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 glass rounded-xl p-3 max-w-xs w-full sm:mt-6 sm:p-4"
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-neon-orange sm:h-4 sm:w-4" />
                  <span className="font-display text-xs font-bold text-foreground sm:text-sm">
                    Nível {selectedCar.level}
                  </span>
                </div>
                <span className="font-display text-[10px] text-muted-foreground sm:text-xs">
                  {selectedCar.xp}/{selectedCar.xpToNext} XP
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50 sm:h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-orange to-yellow-400"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-body text-muted-foreground sm:mt-2 sm:text-xs">
                <span>{selectedCar.wins}W · {selectedCar.racesCount}R</span>
                {selectedCar.attributePoints > 0 && (
                  <span className="text-neon-green font-display font-bold animate-pulse">
                    +{selectedCar.attributePoints} pontos!
                  </span>
                )}
              </div>
            </motion.div>

            {/* Last Race Result Banner */}
            <AnimatePresence>
              {lastRace && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-3 w-full max-w-xs rounded-xl border p-3 backdrop-blur-sm ${
                    lastRace.victory
                      ? "border-neon-green/30 bg-neon-green/10"
                      : "border-destructive/30 bg-destructive/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-display text-xs font-bold uppercase tracking-wider ${
                      lastRace.victory ? "text-neon-green" : "text-destructive"
                    }`}>
                      {lastRace.victory ? "🏆 Última Corrida: Vitória!" : "💀 Última Corrida: Derrota"}
                    </span>
                    <button
                      onClick={() => setLastRace(null)}
                      className="text-muted-foreground/50 hover:text-muted-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-neon-orange" />
                      <span className="font-display text-sm font-bold text-foreground">
                        +{lastRace.npEarned} NP
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-neon-green" />
                      <span className="font-display text-sm font-bold text-foreground">
                        +{lastRace.xpEarned} XP
                      </span>
                    </div>
                  </div>
                  {lastRace.leveledUp && (
                    <div className="mt-1.5 flex items-center gap-1 text-neon-green">
                      <Zap className="h-3 w-3" />
                      <span className="font-display text-[10px] font-bold">
                        NÍVEL {lastRace.newLevel}! +3 pontos de atributo
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mecânico Raul — pop-up aleatório com fila de espera */}
            <AnimatePresence>
              {raulVisible && (
                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`mt-3 w-full max-w-xs rounded-xl border p-3 backdrop-blur-xl shadow-lg relative ${
                    isEngineBlown(selectedCar) ? "border-destructive/40 bg-background/95" : 
                    (selectedCar.engineHealth < 50 || oilNeeded || selectedCar.durability < 30) ? "border-neon-orange/30 bg-background/90" :
                    "border-primary/20 bg-card/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img src={raulAvatar} alt="Mecânico Raul" className="h-10 w-10 shrink-0 rounded-full border-2 border-neon-orange/40 object-cover" />
                    <div className="flex-1 space-y-2">
                      <span className="font-display text-xs font-bold text-neon-orange">
                        Raul, Mecânico:
                      </span>

                      {/* Contextual message */}
                      <p className="font-body text-[11px] text-foreground/80">
                        {(() => {
                          const healthyMsgs = [
                            "🧰 \"Fala, chefe! Tô aqui embaixo do capô conferindo tudo. Por enquanto tá suave!\"",
                            "😎 \"E aí, piloto! Passei pra dar um oi. Tá cuidando bem do carro, hein? Gosto assim!\"",
                            "🔧 \"Opa! Só dando uma olhada rápida... Motor tá redondinho, pode acelerar tranquilo!\"",
                            "☕ \"Tô tomando meu cafezinho aqui na oficina. Se precisar, é só chamar!\"",
                            "🏎️ \"Esse carro tá uma beleza! Quem cuida, tem. Bora pra pista?\"",
                            "👨‍🔧 \"Mecânico que não aparece é mecânico que confia no dono. E eu confio em você!\"",
                          ];
                          if (isEngineBlown(selectedCar)) {
                            const msgs = [
                              "🔥 \"PARA TUDO, CHEFE! Motor fundiu! Vai custar caro... mas o Raul resolve. Confia!\"",
                              "💀 \"Ihhhh... esse motor deu o último suspiro. Fica frio que eu ressuscito ele!\"",
                            ];
                            return msgs[raulMessageIndex % msgs.length];
                          }
                          if (selectedCar.engineHealth <= 10) {
                            const msgs = [
                              `🚨 "Chefe, pelo amor! Motor em ${selectedCar.engineHealth}%! Se correr mais uma, pode fundir! Me deixa dar um trato!"`,
                              `😰 "Tô suando frio aqui! ${selectedCar.engineHealth}% de motor... isso tá um milagre andando!"`,
                            ];
                            return msgs[raulMessageIndex % msgs.length];
                          }
                          if (selectedCar.engineHealth < 50) {
                            const msgs = [
                              `⚠️ "Ô meu bom, motor em ${selectedCar.engineHealth}% não é brincadeira não. Traz pra cá que eu dou um jeito!"`,
                              `🤔 "Motor tá reclamando, chefe... ${selectedCar.engineHealth}% e caindo. Bora fazer uma revisão?"`,
                            ];
                            return msgs[raulMessageIndex % msgs.length];
                          }
                          if (oilNeeded) {
                            const kmOver = kmSinceOil - 100;
                            const msgs = [
                              `🛢️ "Esse óleo tá mais velho que receita da vovó! ${kmOver}km sem trocar... Motor sofrendo 1.5x mais!"`,
                              `😤 "Chefe, tá querendo matar o motor? Óleo vencido há ${kmOver}km! Troca isso logo!"`,
                              `🫠 "Olha, eu já vi muito motor fundir por óleo vencido... e o seu tá com ${kmOver}km sem troca!"`,
                            ];
                            return msgs[raulMessageIndex % msgs.length];
                          }
                          if (selectedCar.durability < 30) {
                            const msgs = [
                              `🛞 "Esses pneus tão implorando por piedade! ${selectedCar.durability}% de durabilidade? Vai derrapar até na reta!"`,
                              `😬 "Durabilidade em ${selectedCar.durability}%... Tá mais liso que pista de sabão! Bora arrumar?"`,
                            ];
                            return msgs[raulMessageIndex % msgs.length];
                          }
                          return healthyMsgs[raulMessageIndex % healthyMsgs.length];
                        })()}
                      </p>

                      {/* Queue timer or repair buttons */}
                      {mechanicQueue !== null && mechanicQueue > 0 ? (
                        <div className="rounded-lg border border-neon-orange/30 bg-neon-orange/10 p-2.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Wrench className="h-4 w-4 text-neon-orange" />
                            </motion.div>
                            <span className="font-display text-xs font-bold text-neon-orange">
                              🔧 Raul tá trabalhando...
                            </span>
                          </div>
                          <p className="font-body text-[10px] text-muted-foreground italic">
                            "Calma aí, chefe! Tem mais gente na fila... Já já é sua vez!"
                          </p>
                          <div className="flex items-center gap-2">
                            <Timer className="h-3 w-3 text-neon-orange" />
                            <span className="font-display text-sm font-bold text-neon-orange tabular-nums">
                              {Math.floor(mechanicQueue / 60).toString().padStart(2, "0")}:{(mechanicQueue % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                            <motion.div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-orange to-yellow-400"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: mechanicQueue, ease: "linear" }}
                            />
                          </div>
                        </div>
                      ) : mechanicQueue === 0 ? (
                        <div className="rounded-lg border border-neon-green/30 bg-neon-green/10 p-2.5">
                          <p className="font-body text-[11px] text-neon-green font-bold">
                            ✅ "Prontinho, chefe! Tá novo em folha. Pode ir pra pista!"
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {(needsRevision || isEngineBlown(selectedCar) || selectedCar.engineHealth < 50) && (
                            <button
                              onClick={() => startMechanicQueue("repair")}
                              className="w-full rounded-lg border border-neon-orange/30 bg-neon-orange/10 px-3 py-2 font-display text-xs font-bold text-neon-orange transition-colors hover:bg-neon-orange/20"
                            >
                              🔧 Reparar Motor ({repairCost} NP) — entrar na fila
                            </button>
                          )}
                          {oilNeeded && (
                            <button
                              onClick={() => startMechanicQueue("oil")}
                              className="w-full rounded-lg border border-neon-orange/30 bg-neon-orange/10 px-3 py-2 font-display text-xs font-bold text-neon-orange transition-colors hover:bg-neon-orange/20"
                            >
                              🛢️ Trocar Óleo ({oilCost} NP) — entrar na fila
                            </button>
                          )}
                          {!(needsRevision || isEngineBlown(selectedCar) || selectedCar.engineHealth < 50 || oilNeeded || selectedCar.durability < 30) && (
                            <p className="font-body text-[10px] text-muted-foreground italic">
                              Tudo em ordem! O Raul só veio dar um oi. 👋
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <div className="glass-strong rounded-2xl p-4 shadow-2xl sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <h3 className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                        Atributos
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        {/* Oil warning light */}
                        {oilNeeded && (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="flex items-center gap-1"
                            title="Troca de óleo necessária!"
                          >
                            <Droplets className="h-3.5 w-3.5 text-destructive" />
                            <span className="font-display text-[10px] font-bold text-destructive">ÓLEO</span>
                          </motion.div>
                        )}
                        {selectedCar.engineHealth <= 10 && selectedCar.engineHealth > 0 && (
                          <motion.div
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="flex items-center gap-1"
                            title="Motor em estado crítico! Alto risco de fundir!"
                          >
                            <Shield className="h-3.5 w-3.5 text-destructive" />
                            <span className="font-display text-[10px] font-bold text-destructive">MOTOR {selectedCar.engineHealth}%</span>
                          </motion.div>
                        )}
                        {isEngineBlown(selectedCar) && (
                          <motion.div
                            animate={{ opacity: [1, 0.1, 1] }}
                            transition={{ duration: 0.4, repeat: Infinity }}
                            className="flex items-center gap-1"
                            title="Motor fundido!"
                          >
                            <Shield className="h-3.5 w-3.5 text-destructive" />
                            <span className="font-display text-[10px] font-bold text-destructive">🔥 FUNDIU</span>
                          </motion.div>
                        )}
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          <span className="font-body text-muted-foreground">
                            {selectedCar.totalKm.toLocaleString()} km
                          </span>
                        </div>
                        <span className="text-muted-foreground/30">|</span>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="font-body text-muted-foreground">
                            Motor: <span className={selectedCar.engineHealth <= 10 ? "text-destructive font-bold" : selectedCar.engineHealth < 30 ? "text-destructive" : "text-foreground"}>{selectedCar.engineHealth}%</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
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
                            onClick={handleRepairClick}
                            className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/20 sm:w-auto"
                          >
                            🔧 Reparar ({repairCost} NP){raulHasAppeared ? " — fila" : ""}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {oilNeeded && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ opacity: [1, 0.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            >
                              <Droplets className="h-4 w-4 text-destructive" />
                            </motion.div>
                            <div>
                              <span className="font-display text-xs font-bold text-destructive">🛢 Trocar óleo!</span>
                              <p className="font-body text-[10px] text-destructive/70">
                                {kmSinceOil} km sem troca · Motor desgastando 1.5x mais rápido
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleOilClick}
                            className="w-full rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-3 py-2 font-display text-xs font-bold text-neon-orange transition-colors hover:bg-neon-orange/20 sm:w-auto"
                          >
                            🛢 Trocar Óleo ({oilCost} NP){raulHasAppeared ? " — fila" : ""}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Insurance Section — Bia, Corretora de Seguros (random pop-up) */}
                    <AnimatePresence>
                      {isInsured && policy && daysLeft <= 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: -30, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 30, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="mt-3 rounded-xl border border-neon-orange/30 bg-card/30 p-3 backdrop-blur-sm"
                        >
                          <div className="flex items-start gap-3">
                            <img src={biaAvatar} alt="Bia Corretora" className="h-10 w-10 shrink-0 rounded-full border-2 border-neon-orange/40 object-cover" />
                            <div className="flex-1 space-y-2">
                              <span className="font-display text-xs font-bold text-neon-orange">
                                Bia, Corretora:
                              </span>
                              <p className="font-body text-[11px] text-neon-orange">
                                ⏰ "Ei! Seu seguro vence em {daysLeft} dia{daysLeft !== 1 ? "s" : ""}! Renova comigo antes que expire, vai!"
                              </p>
                              <div className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-body text-muted-foreground">
                                  <span>Cobertura: <span className="text-foreground font-bold">{policy.coveragePercent}%</span></span>
                                  <span>Sinistros: <span className="text-foreground font-bold">{claimsLeft} restantes</span></span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-body text-muted-foreground">
                                  <span>Expira em: <span className="text-destructive font-bold">{daysLeft} dias</span></span>
                                  <span>Corridas: <span className="text-foreground font-bold">{policy.racesRemaining}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {!isInsured && biaVisible && !biaDismissed && (
                        <motion.div
                          initial={{ opacity: 0, x: -30, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 30, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="mt-3 rounded-xl border border-primary/20 bg-card/30 p-3 backdrop-blur-sm"
                        >
                          <div className="flex items-start gap-3">
                            <img src={biaAvatar} alt="Bia Corretora" className="h-10 w-10 shrink-0 rounded-full border-2 border-primary/40 object-cover" />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-display text-xs font-bold text-primary">
                                  Bia, Corretora:
                                </span>
                                <button
                                  onClick={() => { setBiaDismissed(true); setBiaVisible(false); }}
                                  className="flex h-5 w-5 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>

                              <p className="font-body text-[11px] text-primary/80" dangerouslySetInnerHTML={{ __html: BIA_MESSAGES[biaMessageIndex] }} />

                              {!showInsurance ? (
                                <button
                                  onClick={() => setShowInsurance(true)}
                                  className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                                >
                                  💬 Tá bom Bia, me mostra os planos!
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <p className="font-body text-[10px] text-muted-foreground italic">
                                    "Oba! Sabia que ia aceitar! Escolhe aí:"
                                  </p>
                                  {INSURANCE_PLANS.map((plan) => (
                                    <button
                                      key={plan.id}
                                      disabled={purchasingPlan === plan.id || state.nitroPoints < plan.premium}
                                      onClick={async () => {
                                        setPurchasingPlan(plan.id);
                                        try {
                                          const result = await purchase(plan);
                                          if (result.success) {
                                            updateState((prev) => ({
                                              ...prev,
                                              nitroPoints: prev.nitroPoints - plan.premium,
                                            }));
                                            setShowInsurance(false);
                                            setBiaVisible(false);
                                          }
                                        } finally {
                                          setPurchasingPlan(null);
                                        }
                                      }}
                                      className={`w-full rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 ${
                                        plan.id === "basic"
                                          ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                                          : plan.id === "standard"
                                          ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                                          : "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-display text-xs font-bold text-foreground">
                                          {plan.emoji} {plan.name}
                                        </span>
                                        <span className="font-display text-xs font-bold text-primary">
                                          {plan.premium} NP
                                        </span>
                                      </div>
                                      <p className="mt-0.5 font-body text-[10px] text-muted-foreground">
                                        {plan.coveragePercent}% cobertura · {plan.maxClaims} sinistros · {plan.durationDays} dias
                                      </p>
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setShowInsurance(false)}
                                    className="w-full rounded-lg px-3 py-1.5 font-display text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                                  >
                                    Fechar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent sm:my-5" />

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <GlowButton variant="purple" icon={<Wrench className="h-4 w-4" />} className="flex-1">
                        Peças
                      </GlowButton>
                      {(mechanicQueue !== null && mechanicQueue > 0) || (hasMechanicalIssues && raulHasAppeared) ? (
                        <div className="flex-1 flex flex-col gap-1">
                          <button
                            disabled
                            className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-destructive/70 cursor-not-allowed"
                          >
                            🔧 Na Oficina
                          </button>
                          <p className="font-body text-[10px] text-destructive/70 text-center">
                            Corrija os defeitos mecânicos antes de correr
                          </p>
                        </div>
                      ) : selectedCar.fuelTanks > 0 ? (
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

                    {/* Per-car fuel indicator with timer */}
                    <div className="mt-3 rounded-xl border border-primary/20 bg-card/30 p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-primary" />
                          <span className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                            Combustível
                          </span>
                        </div>
                        <span className={`font-display text-xs font-bold ${selectedCar.fuelTanks > 0 ? "text-neon-green" : "text-destructive"}`}>
                          {selectedCar.fuelTanks}/{getMaxFuel(selectedCar.model)}
                        </span>
                      </div>
                      {/* Fuel bar */}
                      <div className="flex gap-1 mb-2">
                        {[...Array(getMaxFuel(selectedCar.model))].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                              i < selectedCar.fuelTanks
                                ? "bg-gradient-to-r from-neon-green to-emerald-400"
                                : "bg-muted/30"
                            }`}
                          />
                        ))}
                      </div>
                      {/* Timer countdown — only when tank is EMPTY */}
                      {selectedCar.fuelTanks <= 0 && (
                        <CarFuelTimer lastRefill={selectedCar.lastFuelRefill} />
                      )}
                      {selectedCar.fuelTanks > 0 && selectedCar.fuelTanks >= getMaxFuel(selectedCar.model) && (
                        <p className="font-body text-[10px] text-neon-green/70">
                          ✅ Tanque cheio · {getMaxFuel(selectedCar.model)} corridas disponíveis
                        </p>
                      )}
                    </div>

                    <p className="mt-2 text-center font-body text-[10px] text-muted-foreground">
                      🔧 Rev. em {Math.max(0, 5 - selectedCar.racesSinceRevision)} corridas · 🛢 Óleo: {Math.max(0, 100 - kmSinceOil)} km restante
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Floating car navigation arrows — hidden on small screens to avoid overlap */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-between px-4 sm:flex sm:px-8">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/70 hover:border-primary/60 hover:scale-110 active:scale-90 disabled:opacity-15 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          >
            <ChevronLeft className="h-6 w-6 text-primary sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
          </button>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-card/40 backdrop-blur-xl transition-all hover:bg-card/70 hover:border-primary/60 hover:scale-110 active:scale-90 disabled:opacity-15 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          >
            <ChevronRight className="h-6 w-6 text-primary sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
          </button>
        </div>

        {/* Mobile swipe navigation hint — bottom bar */}
        <div className="fixed bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-4 sm:hidden">
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card/60 backdrop-blur-xl active:scale-90 disabled:opacity-15"
          >
            <ChevronLeft className="h-5 w-5 text-primary" />
          </button>
          <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
            {carIndex + 1} / {state.cars.length}
          </span>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-card/60 backdrop-blur-xl active:scale-90 disabled:opacity-15"
          >
            <ChevronRight className="h-5 w-5 text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
