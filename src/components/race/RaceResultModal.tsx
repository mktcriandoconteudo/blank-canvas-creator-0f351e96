import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Coins, Star, ArrowUp, Volume2, VolumeX, Lock } from "lucide-react";
import GlowButton from "@/components/garage/GlowButton";
import { useNavigate } from "react-router-dom";
import { formatNP } from "@/lib/utils";

interface RaceResultModalProps {
  isOpen: boolean;
  victory: boolean;
  playerPosition?: number; // 1-4
  nitroPoints: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  onClose: () => void;
  soundOn?: boolean;
  onToggleSound?: () => void;
}

const POSITION_LABELS = ["1º", "2º", "3º", "4º"];
const POSITION_STYLES = [
  { bg: "bg-neon-green/20", border: "border-neon-green/40", text: "text-neon-green", glow: "shadow-[0_0_20px_hsl(150,70%,50%,0.3)]" },
  { bg: "bg-primary/20", border: "border-primary/40", text: "text-primary", glow: "shadow-[0_0_20px_hsl(185,80%,55%,0.3)]" },
  { bg: "bg-neon-orange/20", border: "border-neon-orange/40", text: "text-neon-orange", glow: "" },
  { bg: "bg-muted/20", border: "border-muted-foreground/30", text: "text-muted-foreground", glow: "" },
];

const Confetti = ({ count = 40 }: { count?: number }) => {
  const colors = [
    "hsl(185, 80%, 55%)",
    "hsl(270, 60%, 60%)",
    "hsl(150, 70%, 50%)",
    "hsl(30, 90%, 55%)",
    "hsl(50, 90%, 60%)",
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 100 + "%", y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: "120%", rotate: Math.random() * 720 - 360, opacity: [1, 1, 0] }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1, ease: "easeIn" }}
          className="absolute h-3 w-2 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length], left: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
};

const RaceResultModal = ({ isOpen, victory, playerPosition, nitroPoints, xpGained, leveledUp, newLevel, onClose, soundOn, onToggleSound }: RaceResultModalProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm"
        >
          {victory && <Confetti />}

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="glass-strong relative mx-4 w-full max-w-md rounded-3xl p-10 text-center shadow-2xl"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className={`relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
                victory ? "bg-primary/20 glow-cyan" : "bg-destructive/20"
              }`}
            >
              {victory ? <Trophy className="h-12 w-12 text-primary" /> : <Skull className="h-12 w-12 text-destructive" />}

              {/* Position badge */}
              {playerPosition != null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 300 }}
                  className={`absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-2 ${POSITION_STYLES[playerPosition - 1]?.bg} ${POSITION_STYLES[playerPosition - 1]?.border} ${POSITION_STYLES[playerPosition - 1]?.glow}`}
                >
                  <span className={`font-display text-sm font-black ${POSITION_STYLES[playerPosition - 1]?.text}`}>
                    {POSITION_LABELS[playerPosition - 1]}
                  </span>
                </motion.div>
              )}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`font-display text-4xl font-black uppercase tracking-wider ${
                victory ? "text-primary text-glow-cyan" : "text-destructive"
              }`}
            >
              {victory ? "Victory!" : `${POSITION_LABELS[playerPosition ? playerPosition - 1 : 1]} Lugar`}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 font-body text-muted-foreground"
            >
              {victory
                ? "Você dominou a pista!"
                : playerPosition === 2
                  ? "Quase lá! Faltou pouco para a vitória."
                  : playerPosition === 3
                    ? "Boa corrida, mas dá pra melhorar!"
                    : "Mais sorte na próxima corrida."}
            </motion.p>

            {/* Rewards row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mx-auto mt-6 flex items-center justify-center gap-4"
            >
              <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-3">
                <Coins className="h-5 w-5 text-neon-orange" />
                <span className="font-display text-xl font-bold text-foreground">
                  {victory ? "+" : ""}{formatNP(Math.round(nitroPoints * 0.6))}
                </span>
                <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">NP Livre</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-3">
                <Lock className="h-5 w-5 text-neon-purple" />
                <span className="font-display text-xl font-bold text-foreground">
                  {victory ? "+" : ""}{formatNP(nitroPoints - Math.round(nitroPoints * 0.6))}
                </span>
                <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">NP Upgrade</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-4 py-3">
                <Star className="h-5 w-5 text-neon-green" />
                <span className="font-display text-xl font-bold text-foreground">+{xpGained}</span>
                <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">XP</span>
              </div>
            </motion.div>

            {/* Level up banner */}
            {leveledUp && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-full bg-neon-green/15 border border-neon-green/30 px-6 py-2"
              >
                <ArrowUp className="h-4 w-4 text-neon-green" />
                <span className="font-display text-sm font-bold text-neon-green">
                  NÍVEL {newLevel}! +3 pontos de atributo
                </span>
              </motion.div>
            )}

            {/* Position reward table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mt-4 rounded-xl border border-border/20 bg-muted/20 p-3"
            >
              <span className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">Prêmios por posição</span>
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {["1º", "2º", "3º", "4º"].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-lg px-2 py-1.5 text-center transition-all ${
                      playerPosition === i + 1
                        ? `${POSITION_STYLES[i]?.bg} ${POSITION_STYLES[i]?.border} border`
                        : "bg-muted/10"
                    }`}
                  >
                    <span className={`block font-display text-[10px] font-black ${
                      playerPosition === i + 1 ? POSITION_STYLES[i]?.text : "text-muted-foreground/60"
                    }`}>{label}</span>
                    <span className={`block font-mono text-[8px] ${
                      playerPosition === i + 1 ? "text-foreground" : "text-muted-foreground/40"
                    }`}>{["100%", "40%", "15%", "5%"][i]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95 }}
              className="mt-3 font-body text-xs text-muted-foreground"
            >
              60% NP livre · 40% bloqueado para upgrades · Desgaste aplicado
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 flex flex-col gap-3"
            >
              <div className="flex gap-3">
                <GlowButton variant="purple" className="flex-1" onClick={() => navigate("/garage")}>
                  Garagem
                </GlowButton>
                <GlowButton variant="cyan" className="flex-1" onClick={onClose}>
                  Correr Novamente
                </GlowButton>
              </div>
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  className="mx-auto flex items-center gap-2 rounded-lg border border-primary/15 bg-background/15 px-4 py-2 backdrop-blur-xl transition-colors hover:bg-background/30"
                >
                  {soundOn ? (
                    <Volume2 className="h-4 w-4 text-primary/70" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                    {soundOn ? "Som ligado" : "Som desligado"}
                  </span>
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RaceResultModal;
