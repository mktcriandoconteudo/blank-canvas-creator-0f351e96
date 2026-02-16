import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Skull, Coins, Star, ArrowUp, Volume2, VolumeX } from "lucide-react";
import GlowButton from "@/components/garage/GlowButton";
import { useNavigate } from "react-router-dom";
import { formatNP } from "@/lib/utils";

interface RaceResultModalProps {
  isOpen: boolean;
  victory: boolean;
  nitroPoints: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  onClose: () => void;
  soundOn?: boolean;
  onToggleSound?: () => void;
}

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

const RaceResultModal = ({ isOpen, victory, nitroPoints, xpGained, leveledUp, newLevel, onClose, soundOn, onToggleSound }: RaceResultModalProps) => {
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
              className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
                victory ? "bg-primary/20 glow-cyan" : "bg-destructive/20"
              }`}
            >
              {victory ? <Trophy className="h-12 w-12 text-primary" /> : <Skull className="h-12 w-12 text-destructive" />}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`font-display text-4xl font-black uppercase tracking-wider ${
                victory ? "text-primary text-glow-cyan" : "text-destructive"
              }`}
            >
              {victory ? "Victory!" : "Defeat"}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 font-body text-muted-foreground"
            >
              {victory ? "Você dominou a pista!" : "Mais sorte na próxima corrida."}
            </motion.p>

            {/* Rewards row */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mx-auto mt-6 flex items-center justify-center gap-6"
            >
              <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-5 py-3">
                <Coins className="h-5 w-5 text-neon-orange" />
                <span className="font-display text-xl font-bold text-foreground">
                  {victory ? "+" : ""}{formatNP(nitroPoints)}
                </span>
                <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">NP</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 px-5 py-3">
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

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-4 font-body text-xs text-muted-foreground"
            >
              Desgaste do motor aplicado · Durabilidade reduz o dano
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
