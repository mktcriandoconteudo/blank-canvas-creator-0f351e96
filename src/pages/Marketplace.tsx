import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Gauge, Zap, Shield, Star, ArrowLeft, Search, SlidersHorizontal,
  ShoppingCart, Heart, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Car images
import carPhantom from "@/assets/marketplace/car-phantom.jpg";
import carInferno from "@/assets/marketplace/car-inferno.jpg";
import carSolar from "@/assets/marketplace/car-solar.jpg";
import carVenom from "@/assets/marketplace/car-venom.jpg";
import carEclipse from "@/assets/marketplace/car-eclipse.jpg";
import carFrost from "@/assets/marketplace/car-frost.jpg";
import carThunder from "@/assets/marketplace/car-thunder.jpg";
import carBlaze from "@/assets/marketplace/car-blaze.jpg";

type Rarity = "Comum" | "Raro" | "Épico" | "Lendário";

interface CarNFT {
  id: string;
  name: string;
  model: string;
  image: string;
  rarity: Rarity;
  price: number;
  speed: number;
  acceleration: number;
  handling: number;
  durability: number;
  level: number;
  owner?: string;
  listed: boolean;
}

const RARITY_CONFIG: Record<Rarity, { border: string; badge: string; glow: string; text: string }> = {
  Comum: {
    border: "border-muted-foreground/30",
    badge: "bg-muted-foreground/20 text-muted-foreground",
    glow: "",
    text: "text-muted-foreground",
  },
  Raro: {
    border: "border-primary/40",
    badge: "bg-primary/20 text-primary",
    glow: "shadow-[0_0_20px_hsl(185_80%_55%/0.15)]",
    text: "text-primary",
  },
  Épico: {
    border: "border-accent/40",
    badge: "bg-accent/20 text-accent",
    glow: "shadow-[0_0_25px_hsl(270_60%_60%/0.2)]",
    text: "text-accent",
  },
  Lendário: {
    border: "border-neon-orange/40",
    badge: "bg-neon-orange/20 text-neon-orange",
    glow: "shadow-[0_0_30px_hsl(30_100%_55%/0.25)]",
    text: "text-neon-orange",
  },
};

const MARKETPLACE_CARS: CarNFT[] = [
  {
    id: "1", name: "Phantom X9", model: "Hypercar", image: carPhantom,
    rarity: "Lendário", price: 2500, speed: 95, acceleration: 88, handling: 82, durability: 90, level: 15, listed: true,
  },
  {
    id: "2", name: "Inferno GT", model: "Muscle", image: carInferno,
    rarity: "Épico", price: 1200, speed: 78, acceleration: 92, handling: 65, durability: 85, level: 10, listed: true,
  },
  {
    id: "3", name: "Solar Flare", model: "Racer", image: carSolar,
    rarity: "Lendário", price: 3200, speed: 98, acceleration: 85, handling: 90, durability: 75, level: 18, listed: true,
  },
  {
    id: "4", name: "Venom Strike", model: "Street", image: carVenom,
    rarity: "Épico", price: 980, speed: 82, acceleration: 78, handling: 88, durability: 80, level: 8, listed: true,
  },
  {
    id: "5", name: "Eclipse Nova", model: "Concept", image: carEclipse,
    rarity: "Raro", price: 650, speed: 72, acceleration: 70, handling: 75, durability: 78, level: 5, listed: true,
  },
  {
    id: "6", name: "Frost Byte", model: "GT Sport", image: carFrost,
    rarity: "Épico", price: 1450, speed: 85, acceleration: 80, handling: 92, durability: 82, level: 12, listed: true,
  },
  {
    id: "7", name: "Thunder Bolt", model: "Classic", image: carThunder,
    rarity: "Raro", price: 520, speed: 68, acceleration: 65, handling: 72, durability: 88, level: 4, listed: true,
  },
  {
    id: "8", name: "Blaze Runner", model: "Turbo", image: carBlaze,
    rarity: "Lendário", price: 2800, speed: 92, acceleration: 95, handling: 78, durability: 85, level: 16, listed: true,
  },
];

/* ─── Stat mini bar ─── */
const StatMini = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2">
    <span className={`${color}`}>{icon}</span>
    <div className="flex-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-display text-xs font-bold text-foreground">{value}</span>
      </div>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-muted/30">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            value >= 90 ? "bg-neon-orange" : value >= 75 ? "bg-primary" : value >= 60 ? "bg-accent" : "bg-muted-foreground"
          }`}
        />
      </div>
    </div>
  </div>
);

/* ─── NFT Car Card ─── */
const CarNFTCard = ({ car, index }: { car: CarNFT; index: number }) => {
  const config = RARITY_CONFIG[car.rarity];
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-card/50 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${config.glow} hover:${config.glow}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={car.image}
          alt={car.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* NFT badge top-left */}
        <div className="absolute left-3 top-3 rounded-md bg-card/80 px-2 py-0.5 backdrop-blur-xl">
          <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">NFT</span>
        </div>

        {/* Rarity badge top-right */}
        <div className={`absolute right-3 top-3 rounded-md px-2.5 py-1 backdrop-blur-xl ${config.badge}`}>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider">{car.rarity}</span>
          </div>
        </div>

        {/* Like button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl transition-all hover:bg-card/90"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        {/* Level badge */}
        <div className="absolute bottom-3 left-3 rounded-md bg-primary/20 px-2 py-0.5 backdrop-blur-xl">
          <span className="font-display text-[10px] font-bold text-primary">Lv.{car.level}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground">{car.name}</h3>
          <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{car.model}</span>
        </div>

        {/* Stats grid */}
        <div className="mt-3 space-y-2">
          <StatMini icon={<Gauge className="h-3 w-3" />} label="Speed" value={car.speed} color="text-primary" />
          <StatMini icon={<Zap className="h-3 w-3" />} label="Accel" value={car.acceleration} color="text-neon-orange" />
          <StatMini icon={<Shield className="h-3 w-3" />} label="Handle" value={car.handling} color="text-accent" />
        </div>

        {/* Price & Action */}
        <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-3">
          <div>
            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Preço</span>
            <div className="flex items-baseline gap-1">
              <span className={`font-display text-lg font-black ${config.text}`}>{car.price.toLocaleString()}</span>
              <span className="font-display text-[10px] text-muted-foreground">NP</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 rounded-lg border-border/30 p-0"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-primary px-3 font-display text-[10px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="mr-1 h-3 w-3" />
              Comprar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*               MARKETPLACE PAGE              */
/* ═══════════════════════════════════════════ */
const Marketplace = () => {
  const navigate = useNavigate();
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "Todos">("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCars = MARKETPLACE_CARS.filter((car) => {
    const matchesRarity = selectedRarity === "Todos" || car.rarity === selectedRarity;
    const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-8 w-8 rounded-lg p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                Marketplace
              </h1>
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                {MARKETPLACE_CARS.length} carros disponíveis
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="hidden items-center gap-3 sm:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar carros..."
                className="h-9 rounded-xl border border-border/20 bg-card/30 pl-9 pr-4 font-body text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/20">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              <span className="text-xs">Filtros</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-border/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-8">
          {(["Todos", "Comum", "Raro", "Épico", "Lendário"] as const).map((rarity) => (
            <button
              key={rarity}
              onClick={() => setSelectedRarity(rarity)}
              className={`shrink-0 rounded-xl px-4 py-1.5 font-display text-[10px] uppercase tracking-[0.2em] transition-all ${
                selectedRarity === rarity
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/30 text-muted-foreground hover:bg-card/60"
              }`}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pt-4 sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar carros..."
            className="h-10 w-full rounded-xl border border-border/20 bg-card/30 pl-9 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCars.map((car, i) => (
            <CarNFTCard key={car.id} car={car} index={i} />
          ))}
        </div>

        {filteredCars.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-sm text-muted-foreground">Nenhum carro encontrado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;
