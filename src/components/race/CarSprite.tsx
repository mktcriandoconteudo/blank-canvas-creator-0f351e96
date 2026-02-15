import { motion } from "framer-motion";
import LightTrail from "./LightTrail";

interface CarSpriteProps {
  src: string;
  alt: string;
  color: "cyan" | "red";
  isRacing: boolean;
  style?: React.CSSProperties;
}

const CarSprite = ({ src, alt, color, isRacing, style }: CarSpriteProps) => {
  const glowHsl = color === "cyan" ? "185 80% 55%" : "0 70% 55%";

  return (
    <motion.div
      className="relative"
      animate={isRacing ? { rotate: [0, -0.3, 0.3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.25, repeat: isRacing ? Infinity : 0 }}
      style={style}
    >
      {/* Headlight glow (front of car) */}
      {isRacing && (
        <motion.div
          className="absolute -right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 20,
            height: 30,
            background: `radial-gradient(ellipse at left center, hsl(${glowHsl} / 0.4), transparent 70%)`,
            filter: "blur(4px)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Car image */}
      <img
        src={src}
        alt={alt}
        className="h-20 w-20 -rotate-90 object-contain"
        style={{
          filter: `drop-shadow(0 0 16px hsl(${glowHsl} / 0.6))`,
          imageRendering: "auto",
        }}
      />

      {/* Under-glow */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none rounded-full"
        style={{
          width: 50,
          height: 10,
          background: `radial-gradient(ellipse, hsl(${glowHsl} / 0.25), transparent 70%)`,
          filter: "blur(6px)",
        }}
        animate={isRacing ? { opacity: [0.5, 0.8, 0.5], scaleX: [0.9, 1.1, 0.9] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />

      {/* Light trail from rear */}
      <LightTrail color={color} isRacing={isRacing} />
    </motion.div>
  );
};

export default CarSprite;
