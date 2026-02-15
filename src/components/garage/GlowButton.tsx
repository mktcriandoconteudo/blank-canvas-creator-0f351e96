import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: "cyan" | "purple";
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const GlowButton = ({ children, variant = "cyan", icon, onClick, className }: GlowButtonProps) => {
  const isCyan = variant === "cyan";

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl px-8 py-4 font-display text-sm font-bold uppercase tracking-widest transition-all duration-300",
        isCyan
          ? "border border-primary/50 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20 hover:glow-cyan-strong"
          : "border border-accent/50 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20 hover:glow-purple-strong",
        className
      )}
    >
      {/* Glow sweep on hover */}
      <div
        className={cn(
          "absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-full",
          isCyan
            ? "bg-gradient-to-r from-transparent via-primary/15 to-transparent"
            : "bg-gradient-to-r from-transparent via-accent/15 to-transparent"
        )}
      />

      <div className="relative flex items-center justify-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
};

export default GlowButton;
