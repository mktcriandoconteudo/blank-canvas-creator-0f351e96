import { motion } from "framer-motion";
import turboCar from "@/assets/turbo-car.png";

const CarShowcase = () => {
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Ambient glow behind car */}
      <div className="absolute h-64 w-96 rounded-full bg-primary/15 blur-[120px]" />

      {/* Floating car with blend */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={turboCar}
            alt="TurboNitro Racing Car"
            className="relative z-10 w-full max-w-2xl"
            style={{
              mixBlendMode: "lighten",
              filter: "drop-shadow(0 0 40px hsl(185 80% 55% / 0.25))",
            }}
          />
        </motion.div>

        {/* Neon platform / ground line */}
        <div className="relative -mt-4 flex flex-col items-center">
          {/* Main glow line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            className="h-[2px] w-[80%] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{ boxShadow: "0 0 20px hsl(185 80% 55% / 0.6), 0 0 60px hsl(185 80% 55% / 0.2)" }}
          />
          {/* Reflection pool */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-1 h-16 w-[70%] rounded-full bg-primary/8 blur-2xl"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default CarShowcase;
