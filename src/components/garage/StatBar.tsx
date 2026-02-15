import { motion } from "framer-motion";

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  gradient: string;
  delay?: number;
  icon: React.ReactNode;
}

const StatBar = ({ label, value, max = 100, gradient, delay = 0, icon }: StatBarProps) => {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary/80">{icon}</span>
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-foreground/80">
            {label}
          </span>
        </div>
        <span className="font-display text-sm font-bold text-primary text-glow-cyan">
          {value}
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }}
          className={`absolute inset-y-0 left-0 rounded-full ${gradient}`}
          style={{
            boxShadow: `0 0 12px hsl(185 80% 55% / 0.4)`,
          }}
        />
        {/* Shine effect */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ duration: 1.5, delay: delay + 1, ease: "easeInOut" }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </div>
    </motion.div>
  );
};

export default StatBar;
