import { motion } from "framer-motion";
import turboCar from "@/assets/turbo-car.png";

const CarShowcase = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow behind car */}
      <div className="absolute h-64 w-96 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute h-40 w-64 translate-y-10 rounded-full bg-accent/10 blur-[80px]" />

      {/* Floating car */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <motion.img
          src={turboCar}
          alt="TurboNitro Racing Car"
          className="relative z-10 w-full max-w-2xl drop-shadow-[0_20px_60px_hsl(185_80%_55%/0.3)]"
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floor reflection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute -bottom-8 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl"
        />
      </motion.div>
    </div>
  );
};

export default CarShowcase;
