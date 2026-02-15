import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SparkParticle {
  id: number;
  x: number;
  y: number;
}

interface OvertakeParticlesProps {
  trigger: boolean;
  x: number;
  y: number;
}

const OvertakeParticles = ({ trigger, x, y }: OvertakeParticlesProps) => {
  const [particles, setParticles] = useState<SparkParticle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: x + Math.random() * 40 - 20,
        y: y + Math.random() * 30 - 15,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger, x, y]);

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
          animate={{
            x: p.x + (Math.random() - 0.5) * 80,
            y: p.y + (Math.random() - 0.5) * 60,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute h-2 w-2 rounded-full bg-neon-orange"
          style={{ boxShadow: "0 0 8px hsl(30 90% 55% / 0.8)" }}
        />
      ))}
    </>
  );
};

export default OvertakeParticles;
