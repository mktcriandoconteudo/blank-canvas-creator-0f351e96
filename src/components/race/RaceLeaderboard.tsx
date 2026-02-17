/**
 * RaceLeaderboard — Live position tracker during the race
 * 
 * Shows 4 cars competing with positions alternating dynamically.
 * On finish, locks the final positions with the winner highlighted.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface RacerInfo {
  name: string;
  pilotName?: string;
  speed: number;
  power: number;       // acceleration
  handling: number;
  isPlayer: boolean;
  progress: number;    // 0-100
}

interface Props {
  player: RacerInfo;
  opponent: RacerInfo;
  raceState: "countdown" | "racing" | "finished";
  victory: boolean;
}

const POSITION_LABELS = ["1st", "2nd", "3rd", "4th"];
const POSITION_COLORS = [
  "bg-neon-green text-neon-green",
  "bg-primary text-primary",
  "bg-neon-orange text-neon-orange",
  "bg-muted-foreground text-muted-foreground",
];
const POSITION_BG_COLORS = [
  "border-neon-green/30 bg-neon-green/5",
  "border-primary/20 bg-primary/5",
  "border-neon-orange/20 bg-neon-orange/5",
  "border-border/20 bg-muted/5",
];

// Extra AI racers (generated once)
const EXTRA_NAMES = [
  "Spectra X7", "Nova RS", "Apex V12", "Vortex GT",
  "Drift King", "Bolt 990", "Razor Edge", "Phoenix S",
];

function pickTwo(): [string, string] {
  const shuffled = [...EXTRA_NAMES].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

const RaceLeaderboard = ({ player, opponent, raceState, victory }: Props) => {
  const [extraNames] = useState(() => pickTwo());

  // Generate random stats for extras
  const [extraStats] = useState(() => ({
    extra1: { speed: 50 + Math.round(Math.random() * 35), power: 50 + Math.round(Math.random() * 35), handling: 45 + Math.round(Math.random() * 30) },
    extra2: { speed: 45 + Math.round(Math.random() * 30), power: 45 + Math.round(Math.random() * 30), handling: 40 + Math.round(Math.random() * 30) },
  }));

  // Fluctuating position scores — updated frequently with randomness to force swaps
  const [positionScores, setPositionScores] = useState<number[]>([0, 0, 0, 0]);

  const tickCount = useRef(0);

  useEffect(() => {
    if (raceState !== "racing") return;
    const interval = setInterval(() => {
      tickCount.current += 1;
      // Pure random positions — ignore stats entirely so swaps ALWAYS happen
      setPositionScores([
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
      ]);
    }, 2000); // every 2s
    return () => clearInterval(interval);
  }, [raceState]);

  // Build racers array
  const racers = [
    { name: player.name, pilotName: player.pilotName, isPlayer: true, speed: player.speed, power: player.power, handling: player.handling, score: positionScores[0] },
    { name: opponent.name, isPlayer: false, speed: opponent.speed, power: opponent.power, handling: opponent.handling, score: positionScores[1] },
    { name: extraNames[0], isPlayer: false, ...extraStats.extra1, score: positionScores[2] },
    { name: extraNames[1], isPlayer: false, ...extraStats.extra2, score: positionScores[3] },
  ];

  // Sort by fluctuating score
  const sorted = [...racers].sort((a, b) => b.score - a.score);

  // On finish, lock player to 1st if victory, else 2nd
  const finalSorted = raceState === "finished"
    ? (() => {
        const withoutPlayer = sorted.filter(r => !r.isPlayer);
        const playerRacer = sorted.find(r => r.isPlayer)!;
        if (victory) {
          return [playerRacer, ...withoutPlayer.slice(0, 3)];
        } else {
          return [withoutPlayer[0], playerRacer, ...withoutPlayer.slice(1, 3)];
        }
      })()
    : sorted;

  const isVisible = raceState === "racing" || raceState === "finished";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ delay: 0.2 }}
          className="absolute right-3 top-[32%] z-[10] sm:right-5 sm:top-[34%] w-[160px] sm:w-[220px]"
        >
          <div className="rounded-xl border border-border/20 bg-background/20 backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/10">
              <span className="font-display text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground">
                Posições
              </span>
              {raceState === "racing" && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                  <span className="font-display text-[7px] sm:text-[8px] uppercase text-neon-green">AO VIVO</span>
                </span>
              )}
              {raceState === "finished" && (
                <span className="font-display text-[7px] sm:text-[8px] uppercase text-primary">FINAL</span>
              )}
            </div>

            {/* Positions */}
            <div className="p-1.5 space-y-1">
              {finalSorted.map((racer, idx) => (
                <motion.div
                  key={racer.name}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-lg border px-2 py-1.5 sm:py-2 transition-colors ${
                    racer.isPlayer 
                      ? POSITION_BG_COLORS[idx] + " ring-1 ring-neon-green/30 shadow-[0_0_12px_-3px_hsl(var(--neon-green)/0.3)]" 
                      : POSITION_BG_COLORS[idx]
                  }`}
                >
                  {/* Position badge */}
                  <span className={`flex h-4 w-7 sm:h-5 sm:w-8 items-center justify-center rounded font-display text-[7px] sm:text-[8px] font-black uppercase ${
                    POSITION_COLORS[idx].split(" ")[0]
                  }/20 ${POSITION_COLORS[idx].split(" ")[1]}`}>
                    {POSITION_LABELS[idx]}
                  </span>

                  {/* Car info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`font-display text-[9px] sm:text-[10px] font-bold truncate ${
                        racer.isPlayer ? "text-neon-green" : "text-foreground/80"
                      }`}>
                        {racer.name}
                      </span>
                      {racer.isPlayer && (
                        <span className="text-[7px] text-neon-green">★</span>
                      )}
                    </div>
                    {/* Pilot name for player */}
                    {racer.isPlayer && racer.pilotName && (
                      <span className="block font-body text-[7px] sm:text-[8px] text-neon-green/70 truncate -mt-0.5">
                        {racer.pilotName}
                      </span>
                    )}
                    {/* Mini stats */}
                    <div className="flex gap-2 mt-0.5">
                      <span className="font-mono text-[7px] sm:text-[8px] text-muted-foreground/60">
                        S:{racer.speed}
                      </span>
                      <span className="font-mono text-[7px] sm:text-[8px] text-muted-foreground/60">
                        P:{racer.power}
                      </span>
                      <span className="font-mono text-[7px] sm:text-[8px] text-muted-foreground/60 hidden sm:inline">
                        H:{racer.handling}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RaceLeaderboard;
