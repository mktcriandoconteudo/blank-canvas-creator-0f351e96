import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import ShaderBackground from "@/components/ui/shader-background";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Zap, Trophy, Gauge, Shield, Coins, Fuel, Users, Star,
  ChevronRight, ArrowRight, Sparkles, Car, Wrench, Flag,
  Twitter, MessageCircle, Globe, Github, Menu, X, ShoppingCart
} from "lucide-react";
import landingHero from "@/assets/landing-hero-v2.jpg";
import nftCard from "@/assets/nft-card-preview.jpg";
import featureGarage from "@/assets/feature-garage.jpg";
import featureRace from "@/assets/feature-race.jpg";

import carPhantom from "@/assets/marketplace/car-phantom.jpg";
import carInferno from "@/assets/marketplace/car-inferno.jpg";
import carSolar from "@/assets/marketplace/car-solar.jpg";
import carBlaze from "@/assets/marketplace/car-blaze.jpg";
import carFrost from "@/assets/marketplace/car-frost.jpg";
import carVenom from "@/assets/marketplace/car-venom.jpg";

const FEATURED_CARS = [
  { name: "Phantom X9", model: "Hypercar", image: carPhantom, rarity: "Lendário" as const, price: 2500, speed: 95, accel: 88, level: 15 },
  { name: "Inferno GT", model: "Muscle", image: carInferno, rarity: "Épico" as const, price: 1200, speed: 78, accel: 92, level: 10 },
  { name: "Solar Flare", model: "Racer", image: carSolar, rarity: "Lendário" as const, price: 3200, speed: 98, accel: 85, level: 18 },
  { name: "Blaze Runner", model: "Turbo", image: carBlaze, rarity: "Lendário" as const, price: 2800, speed: 92, accel: 95, level: 16 },
  { name: "Frost Byte", model: "GT Sport", image: carFrost, rarity: "Épico" as const, price: 1450, speed: 85, accel: 80, level: 12 },
  { name: "Venom Strike", model: "Street", image: carVenom, rarity: "Épico" as const, price: 980, speed: 82, accel: 78, level: 8 },
];

const RARITY_STYLES: Record<string, { border: string; badge: string; text: string }> = {
  Lendário: { border: "border-neon-orange/40", badge: "bg-neon-orange/20 text-neon-orange", text: "text-neon-orange" },
  Épico: { border: "border-accent/40", badge: "bg-accent/20 text-accent", text: "text-accent" },
  Raro: { border: "border-primary/40", badge: "bg-primary/20 text-primary", text: "text-primary" },
  Comum: { border: "border-muted-foreground/30", badge: "bg-muted-foreground/20 text-muted-foreground", text: "text-muted-foreground" },
};

/* ─── Animated counter ─── */
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => (
  <motion.span
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="font-display text-3xl font-black text-foreground sm:text-5xl"
  >
    {value.toLocaleString()}{suffix}
  </motion.span>
);

/* ─── Feature card ─── */
const FeatureCard = ({
  icon, title, description, image, delay = 0
}: {
  icon: React.ReactNode; title: string; description: string; image?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="group relative overflow-hidden rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_40px_hsl(185_80%_55%/0.1)]"
  >
    {image && (
      <div className="relative h-44 overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
      </div>
    )}
    <div className="p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="font-body text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

/* ─── NFT Rarity card ─── */
const RarityCard = ({
  rarity, color, chance, boost, delay = 0
}: {
  rarity: string; color: string; chance: string; boost: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className={`relative overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-5 backdrop-blur-xl transition-all hover:scale-105 ${color}`}
  >
    <div className="mb-2 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Raridade</div>
    <div className="font-display text-xl font-black text-foreground">{rarity}</div>
    <div className="mt-3 space-y-1 font-body text-xs text-muted-foreground">
      <div className="flex justify-between"><span>Drop Rate</span><span className="text-foreground">{chance}</span></div>
      <div className="flex justify-between"><span>Stat Boost</span><span className="text-foreground">{boost}</span></div>
    </div>
  </motion.div>
);

/* ─── Roadmap step ─── */
const RoadmapStep = ({
  phase, title, items, active, delay = 0
}: {
  phase: string; title: string; items: string[]; active?: boolean; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all ${
      active
        ? "border-primary/50 bg-primary/5 shadow-[0_0_30px_hsl(185_80%_55%/0.1)]"
        : "border-border/20 bg-card/30"
    }`}
  >
    <div className={`mb-1 font-display text-[10px] uppercase tracking-[0.3em] ${active ? "text-primary" : "text-muted-foreground"}`}>
      {phase}
    </div>
    <h4 className="mb-3 font-display text-base font-bold text-foreground">{title}</h4>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 font-body text-xs text-muted-foreground">
          <ChevronRight className={`mt-0.5 h-3 w-3 shrink-0 ${active ? "text-primary" : "text-muted-foreground/50"}`} />
          {item}
        </li>
      ))}
    </ul>
  </motion.div>
);

/* ═══════════════════════════════════════════ */
/*                 LANDING PAGE                */
/* ═══════════════════════════════════════════ */
const Landing = () => {
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="relative z-10">
      {/* ─── NAV ─── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 z-50 w-full border-b border-border/10 bg-background/60 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <h1 className="font-display text-lg font-black uppercase tracking-widest text-primary text-glow-cyan">
            TurboNitro
          </h1>
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">Features</a>
            <a href="#nft" className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">NFTs</a>
            <a href="#roadmap" className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">Roadmap</a>
            <button onClick={() => navigate("/marketplace")} className="font-display text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">Marketplace</button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <>
                <span className="hidden font-display text-xs uppercase tracking-wider text-primary sm:block">
                  {user?.username ?? "Piloto"}
                </span>
                <button
                  onClick={() => navigate("/garage")}
                  className="rounded-xl bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 glow-cyan"
                >
                  Garagem
                </button>
                <button
                  onClick={signOut}
                  className="hidden rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-destructive transition-all hover:bg-destructive/20 sm:block"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="hidden rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20 hover:shadow-[0_0_20px_hsl(185_80%_55%/0.2)] sm:block"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="rounded-xl bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 glow-cyan"
                >
                  Jogar
                </button>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/30 bg-card/30 text-foreground backdrop-blur-xl sm:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-border/10 bg-background/95 backdrop-blur-2xl sm:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {session && (
                  <div className="mb-2 rounded-lg bg-primary/5 px-3 py-2 text-center">
                    <span className="font-display text-xs uppercase tracking-wider text-primary">{user?.username ?? "Piloto"}</span>
                  </div>
                )}
                {[
                  { label: "Features", action: () => { document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); } },
                  { label: "NFTs", action: () => { document.getElementById("nft")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); } },
                  { label: "Roadmap", action: () => { document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); } },
                  { label: "Marketplace", action: () => { navigate("/marketplace"); setMobileMenuOpen(false); } },
                  ...(session
                    ? [
                        { label: "Garagem", action: () => { navigate("/garage"); setMobileMenuOpen(false); } },
                        { label: "Sair", action: () => { signOut(); setMobileMenuOpen(false); } },
                      ]
                    : [{ label: "Login", action: () => { navigate("/auth"); setMobileMenuOpen(false); } }]
                  ),
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="rounded-lg px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:bg-card/50 hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative flex min-h-screen items-end overflow-hidden pb-24 pt-16 sm:items-center sm:pb-0">
        {/* Shader plasma lines - bottom layer */}
        <div className="absolute inset-x-0 top-0 h-[60%] z-0 opacity-100">
          <ShaderBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {/* Car image on top of shader */}
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0 z-[1]">
          <img src={landingHero} alt="TurboNitro Racing" className="h-full w-full object-cover object-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-xl">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-primary">Play to Earn · Live</span>
              </div>
              <h1 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                O Futuro das{" "}
                <span className="text-primary text-glow-cyan">Corridas</span>{" "}
                é <span className="text-foreground">NFT</span>
              </h1>
              <p className="mt-6 max-w-lg font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
                Colecione carros lendários, evolua atributos, dispute corridas PvP e acumule Nitro Points. Cada corrida é uma batalha pela supremacia.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <button
                onClick={() => navigate("/auth")}
                className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 glow-cyan-strong"
              >
                <Zap className="h-5 w-5" />
                Começar Agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-2 rounded-2xl border border-border/30 bg-card/30 px-8 py-4 font-display text-sm font-bold uppercase tracking-widest text-foreground backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-card/50"
              >
                Saiba Mais
              </button>
            </motion.div>

            {/* Floating stats badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              {[
                { icon: <Users className="h-4 w-4" />, label: "2.5K+ Pilotos" },
                { icon: <Car className="h-4 w-4" />, label: "10K+ NFTs" },
                { icon: <Trophy className="h-4 w-4" />, label: "50K+ Corridas" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full border border-border/20 bg-card/30 px-4 py-2 backdrop-blur-xl">
                  <span className="text-primary">{badge.icon}</span>
                  <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-display text-[8px] uppercase tracking-[0.3em] text-muted-foreground/50">Scroll</span>
            <div className="h-8 w-[1px] bg-gradient-to-b from-primary/50 to-transparent" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-display text-xs uppercase tracking-[0.5em] text-primary/70">Gameplay</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              Um Universo de <span className="text-primary text-glow-cyan">Possibilidades</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-sm text-muted-foreground">
              Cada sistema foi projetado para recompensar estratégia, habilidade e dedicação.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Wrench className="h-5 w-5" />}
              title="Garagem High-Tech"
              description="Customize seu carro com peças NFT, melhore atributos de velocidade, aceleração, handling e durabilidade. Seu carro, suas regras."
              image={featureGarage}
              delay={0}
            />
            <FeatureCard
              icon={<Flag className="h-5 w-5" />}
              title="Corridas PvP"
              description="Enfrente outros pilotos em corridas em tempo real. Cada corrida consome fuel e premia o vencedor com Nitro Points e XP."
              image={featureRace}
              delay={0.15}
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="NFTs Colecionáveis"
              description="Carros e peças com diferentes raridades. Quanto mais raro, maiores os bônus de stats. Troque no marketplace."
              image={nftCard}
              delay={0.3}
            />
            <FeatureCard
              icon={<Star className="h-5 w-5" />}
              title="Sistema de Níveis"
              description="Ganhe XP a cada corrida. Suba de nível e distribua pontos de atributo para tornar seu carro imbatível."
              delay={0.1}
            />
            <FeatureCard
              icon={<Coins className="h-5 w-5" />}
              title="Play to Earn"
              description="Acumule Nitro Points (NP) vencendo corridas. Use NP para reparos, peças, upgrades e muito mais."
              delay={0.2}
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Motor & Revisão"
              description="Seu carro se desgasta a cada corrida. Faça revisões periódicas para manter o desempenho máximo e evitar penalidades."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── NFT SECTION ─── */}
      <section id="nft" className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: NFT showcase */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-neon-orange/10 blur-2xl" />
                <img
                  src={nftCard}
                  alt="NFT Car"
                  className="relative rounded-2xl border border-border/30 shadow-2xl"
                />
                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute -right-4 -top-4 rounded-xl border border-neon-orange/30 bg-card/80 px-3 py-2 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-neon-orange" />
                    <span className="font-display text-xs font-bold text-neon-orange">Lendário</span>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="absolute -bottom-3 -left-3 rounded-xl border border-primary/30 bg-card/80 px-3 py-2 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-primary" />
                    <span className="font-display text-xs font-bold text-primary">Speed 95</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Rarity cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="mb-2 font-display text-xs uppercase tracking-[0.5em] text-primary/70">Colecionáveis</p>
              <h2 className="mb-4 font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
                Raridades <span className="text-primary text-glow-cyan">Únicas</span>
              </h2>
              <p className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
                Cada carro NFT possui raridade, atributos base e potencial de evolução diferentes. 
                Construa a coleção definitiva.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <RarityCard rarity="Comum" color="hover:border-muted-foreground/30" chance="60%" boost="+0" delay={0} />
                <RarityCard rarity="Raro" color="hover:border-primary/40" chance="25%" boost="+5" delay={0.1} />
                <RarityCard rarity="Épico" color="hover:border-accent/40" chance="12%" boost="+12" delay={0.2} />
                <RarityCard rarity="Lendário" color="hover:border-neon-orange/40" chance="3%" boost="+25" delay={0.3} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-accent/[0.03]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-display text-xs uppercase tracking-[0.5em] text-primary/70">Números</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              O Jogo em <span className="text-primary text-glow-cyan">Números</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: 2500, suffix: "+", label: "Pilotos Ativos", icon: <Users className="h-5 w-5" /> },
              { value: 10000, suffix: "+", label: "NFTs Criados", icon: <Car className="h-5 w-5" /> },
              { value: 50000, suffix: "+", label: "Corridas Disputadas", icon: <Flag className="h-5 w-5" /> },
              { value: 1200000, suffix: "", label: "NP Distribuídos", icon: <Coins className="h-5 w-5" /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/20 bg-card/30 p-6 text-center backdrop-blur-xl"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {stat.icon}
                </div>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                <p className="mt-2 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED CARS ─── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 flex flex-col items-center text-center sm:mb-16"
          >
            <p className="mb-3 font-display text-xs uppercase tracking-[0.5em] text-primary/70">Marketplace</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              Carros em <span className="text-primary text-glow-cyan">Destaque</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-sm text-muted-foreground">
              Confira os NFTs mais cobiçados do marketplace. Adquira, evolua e domine as pistas.
            </p>
          </motion.div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 sm:gap-6 sm:overflow-visible sm:pb-0">
            {FEATURED_CARS.map((car, i) => {
              const style = RARITY_STYLES[car.rarity];
              return (
                <motion.div
                  key={car.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "100px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`group relative w-[240px] shrink-0 overflow-hidden rounded-2xl border ${style.border} bg-card/50 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] sm:w-auto`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={car.image} alt={car.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className={`absolute right-3 top-3 rounded-md px-2.5 py-1 backdrop-blur-xl ${style.badge}`}>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        <span className="font-display text-[10px] font-bold uppercase tracking-wider">{car.rarity}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 rounded-md bg-primary/20 px-2 py-0.5 backdrop-blur-xl">
                      <span className="font-display text-[10px] font-bold text-primary">Lv.{car.level}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold text-foreground">{car.name}</h3>
                      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{car.model}</span>
                    </div>
                    {/* Mini stats */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-1 text-primary">
                        <Gauge className="h-3 w-3" />
                        <span className="font-display text-xs font-bold">{car.speed}</span>
                      </div>
                      <div className="flex items-center gap-1 text-neon-orange">
                        <Zap className="h-3 w-3" />
                        <span className="font-display text-xs font-bold">{car.accel}</span>
                      </div>
                    </div>
                    {/* Price */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-display text-lg font-black ${style.text}`}>{car.price.toLocaleString()}</span>
                        <span className="font-display text-[10px] text-muted-foreground">NP</span>
                      </div>
                      <button
                        onClick={() => navigate("/marketplace")}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 font-display text-[10px] uppercase tracking-wider text-primary transition-all hover:bg-primary/20"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <button
              onClick={() => navigate("/marketplace")}
              className="group inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-8 py-3 font-display text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-primary/10 hover:shadow-[0_0_30px_hsl(185_80%_55%/0.15)]"
            >
              Ver todos no Marketplace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-display text-xs uppercase tracking-[0.5em] text-primary/70">Como Funciona</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              3 Passos para a <span className="text-primary text-glow-cyan">Vitória</span>
            </h2>
          </motion.div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Crie sua Conta",
                desc: "Registre-se e receba seu primeiro carro NFT gratuitamente. Sua jornada começa na garagem.",
                icon: <Users className="h-6 w-6" />,
              },
              {
                step: "02",
                title: "Evolua seu Carro",
                desc: "Corra, ganhe XP, suba de nível e distribua pontos nos atributos. Instale peças para bônus extras.",
                icon: <Wrench className="h-6 w-6" />,
              },
              {
                step: "03",
                title: "Domine as Pistas",
                desc: "Vença corridas PvP, acumule Nitro Points e construa a coleção definitiva de carros lendários.",
                icon: <Trophy className="h-6 w-6" />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative overflow-hidden rounded-2xl border border-border/20 bg-card/30 p-8 text-center backdrop-blur-xl"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 font-display text-xs font-bold text-primary-foreground">
                  {item.step}
                </div>
                <div className="mx-auto mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <h3 className="mb-2 font-display text-base font-bold text-foreground">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ─── */}
      <section id="roadmap" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-3 font-display text-xs uppercase tracking-[0.5em] text-accent/70">Roadmap</p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              O Futuro do <span className="text-accent">TurboNitro</span>
            </h2>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RoadmapStep
              phase="Fase 1 — Q1 2026"
              title="Lançamento"
              items={["Sistema de corridas PvP", "Garagem e evolução de carros", "Marketplace NFT básico", "Sistema de fuel e Nitro Points"]}
              active
              delay={0}
            />
            <RoadmapStep
              phase="Fase 2 — Q2 2026"
              title="Expansão"
              items={["Novas pistas e ambientes", "Sistema de clãs e ligas", "Torneios semanais com prêmios", "Peças NFT com raridades"]}
              delay={0.1}
            />
            <RoadmapStep
              phase="Fase 3 — Q3 2026"
              title="Integração Web3"
              items={["Mint de carros on-chain", "Marketplace descentralizado", "Staking de NFTs", "Governança da comunidade"]}
              delay={0.2}
            />
            <RoadmapStep
              phase="Fase 4 — Q4 2026"
              title="Metaverso"
              items={["Mundo aberto 3D", "Corridas multiplayer em tempo real", "Economia cross-chain", "Parcerias com marcas automotivas"]}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0">
          <img src={landingHero} alt="" className="h-full w-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="mx-auto mb-6 h-12 w-12 text-primary" />
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
              Pronto para <span className="text-primary text-glow-cyan">Acelerar</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-md font-body text-base text-muted-foreground">
              Crie sua conta agora, receba seu primeiro carro NFT e entre na pista. A corrida já começou.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:brightness-110 glow-cyan-strong"
            >
              <Zap className="h-5 w-5" />
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/10 bg-card/20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <h3 className="font-display text-lg font-black uppercase tracking-widest text-primary text-glow-cyan">
                TurboNitro
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground">
                O jogo de corrida NFT mais eletrizante da blockchain. Colecione, evolua e domine.
              </p>
              <div className="mt-4 flex gap-3">
                {[
                  { icon: <Twitter className="h-4 w-4" />, label: "Twitter" },
                  { icon: <MessageCircle className="h-4 w-4" />, label: "Discord" },
                  { icon: <Globe className="h-4 w-4" />, label: "Website" },
                ].map((social, i) => (
                  <button key={i} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/20 bg-card/30 text-muted-foreground transition-all hover:border-primary/30 hover:text-primary" aria-label={social.label}>
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Jogo</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="cursor-pointer transition-colors hover:text-primary">Garagem</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Corridas</li>
                <li className="cursor-pointer transition-colors hover:text-primary" onClick={() => navigate("/marketplace")}>Marketplace</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Ranking</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Recursos</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="cursor-pointer transition-colors hover:text-primary">Whitepaper</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Docs</li>
                <li className="cursor-pointer transition-colors hover:text-primary">FAQ</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Blog</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">Comunidade</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li className="cursor-pointer transition-colors hover:text-primary">Discord</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Twitter</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Telegram</li>
                <li className="cursor-pointer transition-colors hover:text-primary">Medium</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/10 pt-8 sm:flex-row">
            <p className="font-body text-xs text-muted-foreground">
              © 2026 TurboNitro. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 font-body text-xs text-muted-foreground">
              <span className="cursor-pointer transition-colors hover:text-primary">Termos de Uso</span>
              <span className="cursor-pointer transition-colors hover:text-primary">Privacidade</span>
              <span className="cursor-pointer transition-colors hover:text-primary">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Landing;
