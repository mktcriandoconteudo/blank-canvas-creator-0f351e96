import { motion } from "framer-motion";
import { Zap, Gauge, Wind, Shield, Wrench, Flag } from "lucide-react";
import garageScene from "@/assets/garage-scene.jpg";
import StatBar from "@/components/garage/StatBar";
import GlowButton from "@/components/garage/GlowButton";

const carStats = [
  { label: "Velocidade", value: 87, icon: <Gauge className="h-4 w-4" />, gradient: "bg-gradient-to-r from-cyan-500 to-blue-500" },
  { label: "Aceleração", value: 72, icon: <Zap className="h-4 w-4" />, gradient: "bg-gradient-to-r from-violet-500 to-purple-500" },
  { label: "Drift", value: 65, icon: <Wind className="h-4 w-4" />, gradient: "bg-gradient-to-r from-emerald-500 to-teal-500" },
  { label: "Durabilidade", value: 91, icon: <Shield className="h-4 w-4" />, gradient: "bg-gradient-to-r from-amber-500 to-orange-500" },
];

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Full scene background — car already in garage */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${garageScene})` }}
      />
      {/* Darken right side for readability of stats panel */}
      <div className="absolute inset-0 bg-gradient-to-l from-background/70 via-transparent to-transparent" />
      {/* Subtle top/bottom vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/50" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-8 py-6"
        >
          <h1 className="font-display text-2xl font-black uppercase tracking-widest text-primary text-glow-cyan">
            TurboNitro
          </h1>
          <div className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Garagem
          </div>
        </motion.header>

        {/* Main */}
        <main className="flex flex-1 items-end justify-between gap-10 px-8 pb-10 lg:items-center lg:px-16">
          {/* Left: Car info overlaid on scene */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-md"
          >
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
              Classe Lendária
            </p>
            <h2 className="font-display text-5xl font-black uppercase tracking-tight text-foreground lg:text-6xl">
              Phantom <span className="text-primary text-glow-cyan">X9</span>
            </h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              Token #4829 · Proprietário: 0x7f3a...e1b2
            </p>
          </motion.div>

          {/* Right: Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full max-w-xs"
          >
            <div className="glass-strong rounded-2xl p-6 shadow-2xl">
              <h3 className="mb-4 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Atributos do Veículo
              </h3>

              <div className="space-y-3">
                {carStats.map((stat, i) => (
                  <StatBar
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    gradient={stat.gradient}
                    delay={0.5 + i * 0.15}
                    icon={stat.icon}
                  />
                ))}
              </div>

              <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

              <div className="flex flex-col gap-4 sm:flex-row">
                <GlowButton variant="purple" icon={<Wrench className="h-4 w-4" />} className="flex-1">
                  Equipar Peças
                </GlowButton>
                <GlowButton variant="cyan" icon={<Flag className="h-4 w-4" />} className="flex-1">
                  Iniciar Corrida
                </GlowButton>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;
