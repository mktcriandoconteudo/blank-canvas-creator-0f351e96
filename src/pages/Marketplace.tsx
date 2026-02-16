import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  Gauge, Zap, Shield, Star, ArrowLeft, Search,
  ShoppingCart, Heart, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Car images map
import carPhantom from "@/assets/marketplace/car-phantom.jpg";
import carInferno from "@/assets/marketplace/car-inferno.jpg";
import carSolar from "@/assets/marketplace/car-solar.jpg";
import carVenom from "@/assets/marketplace/car-venom.jpg";
import carEclipse from "@/assets/marketplace/car-eclipse.jpg";
import carFrost from "@/assets/marketplace/car-frost.jpg";
import carThunder from "@/assets/marketplace/car-thunder.jpg";
import carBlaze from "@/assets/marketplace/car-blaze.jpg";

const CAR_IMAGES: Record<string, string> = {
  "car-phantom": carPhantom,
  "car-inferno": carInferno,
  "car-solar": carSolar,
  "car-venom": carVenom,
  "car-eclipse": carEclipse,
  "car-frost": carFrost,
  "car-thunder": carThunder,
  "car-blaze": carBlaze,
};

type Rarity = "common" | "rare" | "epic" | "legendary";

interface MarketplaceCar {
  id: string;
  name: string;
  model: string;
  rarity: Rarity;
  price: number;
  speed_base: number;
  acceleration_base: number;
  handling_base: number;
  durability: number;
  image_key: string;
  sale_active: boolean;
}

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const RARITY_CONFIG: Record<Rarity, { border: string; badge: string; glow: string; text: string }> = {
  common: {
    border: "border-muted-foreground/30",
    badge: "bg-muted-foreground/20 text-muted-foreground",
    glow: "",
    text: "text-muted-foreground",
  },
  rare: {
    border: "border-primary/40",
    badge: "bg-primary/20 text-primary",
    glow: "shadow-[0_0_20px_hsl(185_80%_55%/0.15)]",
    text: "text-primary",
  },
  epic: {
    border: "border-accent/40",
    badge: "bg-accent/20 text-accent",
    glow: "shadow-[0_0_25px_hsl(270_60%_60%/0.2)]",
    text: "text-accent",
  },
  legendary: {
    border: "border-neon-orange/40",
    badge: "bg-neon-orange/20 text-neon-orange",
    glow: "shadow-[0_0_30px_hsl(30_100%_55%/0.25)]",
    text: "text-neon-orange",
  },
};

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
const CarNFTCard = ({ car, index, onBuy, buying, userBalance }: {
  car: MarketplaceCar; index: number; onBuy: (car: MarketplaceCar) => void; buying: string | null; userBalance: number;
}) => {
  const config = RARITY_CONFIG[car.rarity];
  const [liked, setLiked] = useState(false);
  const canAfford = userBalance >= car.price;
  const isBuying = buying === car.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-card/50 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${config.glow}`}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={CAR_IMAGES[car.image_key] || carThunder}
          alt={car.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        <div className="absolute left-3 top-3 rounded-md bg-card/80 px-2 py-0.5 backdrop-blur-xl">
          <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">0 KM</span>
        </div>

        <div className={`absolute right-3 top-3 rounded-md px-2.5 py-1 backdrop-blur-xl ${config.badge}`}>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider">{RARITY_LABELS[car.rarity]}</span>
          </div>
        </div>

        <button
          onClick={() => setLiked(!liked)}
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl transition-all hover:bg-card/90"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        <div className="absolute bottom-3 left-3 rounded-md bg-neon-green/20 px-2 py-0.5 backdrop-blur-xl">
          <span className="font-display text-[10px] font-bold text-neon-green">NOVO</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground">{car.name}</h3>
          <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{car.model}</span>
        </div>

        <div className="mt-3 space-y-2">
          <StatMini icon={<Gauge className="h-3 w-3" />} label="Speed" value={car.speed_base} color="text-primary" />
          <StatMini icon={<Zap className="h-3 w-3" />} label="Accel" value={car.acceleration_base} color="text-neon-orange" />
          <StatMini icon={<Shield className="h-3 w-3" />} label="Handle" value={car.handling_base} color="text-accent" />
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] font-body text-muted-foreground">
          <span>🛣️ 0 km</span>
          <span className="text-neon-green">🔧 Motor: 100%</span>
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
          <Button
            size="sm"
            disabled={!canAfford || isBuying}
            onClick={() => onBuy(car)}
            className="h-9 rounded-lg bg-primary px-4 font-display text-[10px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isBuying ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <ShoppingCart className="mr-1 h-3 w-3" />
            )}
            {isBuying ? "Comprando..." : !canAfford ? "Saldo Insuf." : "Comprar"}
          </Button>
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
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [cars, setCars] = useState<MarketplaceCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  const loadCars = useCallback(async () => {
    const { data } = await supabase
      .from("marketplace_cars")
      .select("*")
      .eq("sale_active", true)
      .order("created_at", { ascending: false });
    setCars((data as MarketplaceCar[]) ?? []);
    setLoading(false);
  }, []);

  const loadBalance = useCallback(async () => {
    if (!user?.walletAddress) return;
    const { data } = await supabase
      .from("users")
      .select("nitro_points")
      .eq("wallet_address", user.walletAddress)
      .maybeSingle();
    if (data) setUserBalance(data.nitro_points);
  }, [user?.walletAddress]);

  useEffect(() => {
    loadCars();
    loadBalance();
  }, [loadCars, loadBalance]);

  const handleBuy = async (car: MarketplaceCar) => {
    if (!user?.walletAddress || !session) {
      toast({ title: "Faça login para comprar", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setBuying(car.id);
    try {
      const { data, error } = await supabase.rpc("buy_marketplace_car", {
        _car_id: car.id,
        _wallet: user.walletAddress,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        toast({
          title: "🎉 Carro Comprado!",
          description: `${result.car_name} adicionado à sua garagem! Saldo: ${result.remaining_balance} NP`,
        });
        setUserBalance(result.remaining_balance);
      } else {
        const errorMsg = result?.error === "insufficient_funds" ? "Saldo insuficiente!" :
          result?.error === "car_not_available" ? "Carro indisponível!" : "Erro na compra.";
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na compra", description: err.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const filteredCars = cars.filter((car) =>
    car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-8">
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-8 w-8 rounded-lg p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
                Marketplace
              </h1>
              <p className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                {filteredCars.length} carros disponíveis
              </p>
            </div>
          </div>

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
            {session && user && (
              <span className="font-display text-xs text-neon-orange font-bold">
                {userBalance.toLocaleString()} NP
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search */}
      <div className="px-3 pt-3 sm:hidden">
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
        {session && user && (
          <div className="mt-2 text-right">
            <span className="font-display text-xs text-neon-orange font-bold">{userBalance.toLocaleString()} NP</span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {filteredCars.map((car, i) => (
              <CarNFTCard key={car.id} car={car} index={i} onBuy={handleBuy} buying={buying} userBalance={userBalance} />
            ))}
          </div>
        )}

        {!loading && filteredCars.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-sm text-muted-foreground">Nenhum carro disponível no momento.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace;
