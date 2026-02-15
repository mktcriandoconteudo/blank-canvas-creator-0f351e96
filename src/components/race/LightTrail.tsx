import { motion } from "framer-motion";

interface LightTrailProps {
  color: "cyan" | "red";
  isRacing: boolean;
  intensity?: number;
}

const LightTrail = ({ color, isRacing, intensity = 1 }: LightTrailProps) => {
  if (!isRacing) return null;

  const hue = color === "cyan" ? "185, 80%, 55%" : "0, 70%, 55%";
  const trailCount = 6;

  return (
    <div className="absolute -left-2 top-1/2 -translate-y-1/2 pointer-events-none">
      {Array.from({ length: trailCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            top: `${(i - trailCount / 2) * 2}px`,
            background: `hsl(${hue})`,
            boxShadow: `0 0 ${6 + i * 2}px hsl(${hue} / 0.6)`,
          }}
          animate={{
            x: [0, -20 - i * 8, -40 - i * 12],
            opacity: [0.9 * intensity, 0.4 * intensity, 0],
            scale: [1, 0.8, 0.3],
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.04,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Main glow trail */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          width: 40,
          height: 6,
          left: -45,
          background: `linear-gradient(to left, hsl(${hue} / 0.4), transparent)`,
          borderRadius: 4,
          filter: `blur(3px)`,
        }}
        animate={{
          opacity: [0.6 * intensity, 0.3 * intensity, 0.6 * intensity],
          scaleX: [1, 1.3, 1],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export default LightTrail;
