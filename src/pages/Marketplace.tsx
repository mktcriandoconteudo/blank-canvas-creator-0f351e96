import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getWalletClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { formatNP } from "@/lib/utils";
import {
  Gauge, Zap, Shield, Star, Search,
  ShoppingCart, Heart, Loader2, Key, Clock, Fuel,
  Gift, Lock, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MainNav from "@/components/MainNav";

import mysteryBoxImg from "@/assets/mystery-box.png";

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
  "car-phantom": carPhantom, "car-inferno": carInferno, "car-solar": carSolar,
  "car-venom": carVenom, "car-eclipse": carEclipse, "car-frost": carFrost,
  "car-thunder": carThunder, "car-blaze": carBlaze,
};

type Rarity = "common" | "rare" | "epic" | "legendary";
type TabId = "comprar" | "alugar";

interface MarketplaceCar {
  id: string; name: string; model: string; rarity: Rarity; price: number;
  speed_base: number; acceleration_base: number; handling_base: number;
  durability: number; image_key: string; sale_active: boolean; stock: number;
}

interface RentalCar {
  id: string; name: string; model: string; rarity: string; rental_price: number;
  races_limit: number; speed_base: number; acceleration_base: number;
  handling_base: number; durability: number; image_key: string; available: boolean;
}

interface MysteryBoxResult {
  car_name: string;
  rarity: string;
  model: string;
  image_key: string;
  speed: number;
  acceleration: number;
  handling: number;
  price_paid: number;
  remaining_balance: number;
  burned: number;
}

const RARITY_LABELS: Record<string, string> = {
  common: "Comum", uncommon: "Incomum", rare: "Raro", epic: "Épico", legendary: "Lendário",
};

const RARITY_CONFIG: Record<string, { border: string; badge: string; glow: string; text: string }> = {
  common: { border: "border-muted-foreground/30", badge: "bg-muted-foreground/20 text-muted-foreground", glow: "", text: "text-muted-foreground" },
  uncommon: { border: "border-neon-green/40", badge: "bg-neon-green/20 text-neon-green", glow: "shadow-[0_0_20px_hsl(150_70%_50%/0.15)]", text: "text-neon-green" },
  rare: { border: "border-primary/40", badge: "bg-primary/20 text-primary", glow: "shadow-[0_0_20px_hsl(185_80%_55%/0.15)]", text: "text-primary" },
  epic: { border: "border-accent/40", badge: "bg-accent/20 text-accent", glow: "shadow-[0_0_25px_hsl(270_60%_60%/0.2)]", text: "text-accent" },
  legendary: { border: "border-neon-orange/40", badge: "bg-neon-orange/20 text-neon-orange", glow: "shadow-[0_0_30px_hsl(30_100%_55%/0.25)]", text: "text-neon-orange" },
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

/* ─── NFT Car Card (Buy) ─── */
const CarNFTCard = ({ car, index, onBuy, buying, userBalance }: {
  car: MarketplaceCar; index: number; onBuy: (car: MarketplaceCar) => void; buying: string | null; userBalance: number;
}) => {
  const config = RARITY_CONFIG[car.rarity] ?? RARITY_CONFIG.common;
  const [liked, setLiked] = useState(false);
  const canAfford = userBalance >= car.price;
  const isBuying = buying === car.id;
  const inStock = car.stock > 0;
  const available = car.sale_active && inStock;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-2xl border ${available ? config.border : "border-border/20"} bg-card/50 backdrop-blur-xl transition-all duration-500 ${available ? `hover:scale-[1.02] ${config.glow}` : "opacity-60"}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={CAR_IMAGES[car.image_key] || carThunder} alt={car.name}
          className={`h-full w-full object-cover transition-transform duration-700 ${available ? "group-hover:scale-110" : "grayscale"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-md bg-card/80 px-2 py-0.5 backdrop-blur-xl font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">0 KM</span>
          <span className={`rounded-md px-2 py-0.5 backdrop-blur-xl font-display text-[9px] font-bold uppercase tracking-wider ${
            !car.sale_active ? "bg-muted/30 text-muted-foreground" : inStock ? "bg-neon-green/20 text-neon-green" : "bg-destructive/20 text-destructive"
          }`}>
            {!car.sale_active ? "INDISPONÍVEL" : inStock ? `📦 ${car.stock}` : "ESGOTADO"}
          </span>
        </div>
        <div className={`absolute right-3 top-3 rounded-md px-2.5 py-1 backdrop-blur-xl ${config.badge}`}>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span className="font-display text-[10px] font-bold uppercase tracking-wider">{RARITY_LABELS[car.rarity] ?? car.rarity}</span>
          </div>
        </div>
        <button onClick={() => setLiked(!liked)} className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/60 backdrop-blur-xl transition-all hover:bg-card/90">
          <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>
        {available && (
          <div className="absolute bottom-3 left-3 rounded-md bg-neon-green/20 px-2 py-0.5 backdrop-blur-xl">
            <span className="font-display text-[10px] font-bold text-neon-green">NOVO</span>
          </div>
        )}
      </div>
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
        <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-3">
          <div>
            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Preço</span>
            <div className="flex items-baseline gap-1">
              <span className={`font-display text-lg font-black ${config.text}`}>{formatNP(car.price)}</span>
              <span className="font-display text-[10px] text-muted-foreground">NP</span>
            </div>
          </div>
          <Button size="sm" disabled={!available || !canAfford || isBuying} onClick={() => onBuy(car)}
            className="h-9 rounded-lg bg-primary px-4 font-display text-[10px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isBuying ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShoppingCart className="mr-1 h-3 w-3" />}
            {isBuying ? "Comprando..." : !car.sale_active ? "Indisponível" : !inStock ? "Esgotado" : !canAfford ? "Saldo Insuf." : "Comprar"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Rental Car Card ─── */
const RentalCarCard = ({ car, index, onRent, renting, userBalance }: {
  car: RentalCar; index: number; onRent: (car: RentalCar) => void; renting: string | null; userBalance: number;
}) => {
  const canAfford = userBalance >= car.rental_price;
  const isRenting = renting === car.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-2xl border ${car.available ? "border-neon-orange/40" : "border-border/20 opacity-60"} bg-card/50 backdrop-blur-xl transition-all duration-500 ${car.available ? "hover:scale-[1.02] shadow-[0_0_20px_hsl(30_100%_55%/0.1)]" : ""}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={CAR_IMAGES[car.image_key] || carThunder} alt={car.name}
          className={`h-full w-full object-cover transition-transform duration-700 ${car.available ? "group-hover:scale-110" : "grayscale"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-md bg-neon-orange/20 px-2 py-0.5 backdrop-blur-xl font-display text-[9px] font-bold uppercase tracking-wider text-neon-orange">
            🔑 ALUGUEL
          </span>
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-card/80 px-2.5 py-1 backdrop-blur-xl">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Fuel className="h-3 w-3" />
            <span className="font-display text-[10px] font-bold">{car.races_limit} corridas</span>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 rounded-md bg-muted/30 px-2 py-0.5 backdrop-blur-xl">
          <span className="font-display text-[10px] font-bold text-muted-foreground">USADO</span>
        </div>
      </div>
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
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 24h de uso</span>
          <span className="text-neon-orange">🔧 Motor: 85%</span>
        </div>
        <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-1.5">
          <p className="font-display text-[9px] uppercase tracking-wider text-destructive/70">
            🔥 15% burn · 25% pool · 60% treasury
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-3">
          <div>
            <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Aluguel</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-black text-neon-orange">{formatNP(car.rental_price)}</span>
              <span className="font-display text-[10px] text-muted-foreground">NP</span>
            </div>
          </div>
          <Button size="sm" disabled={!car.available || !canAfford || isRenting} onClick={() => onRent(car)}
            className="h-9 rounded-lg bg-neon-orange px-4 font-display text-[10px] uppercase tracking-wider text-background hover:bg-neon-orange/90 disabled:opacity-50">
            {isRenting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Key className="mr-1 h-3 w-3" />}
            {isRenting ? "Alugando..." : !car.available ? "Indisponível" : !canAfford ? "Saldo Insuf." : "Alugar"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Mystery Box Reveal Modal ─── */
const MysteryBoxReveal = ({ result, onClose }: { result: MysteryBoxResult; onClose: () => void }) => {
  const config = RARITY_CONFIG[result.rarity] ?? RARITY_CONFIG.common;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
      onClick={(e) => { if (revealed && e.target === e.currentTarget) onClose(); }}
    >
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="box"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 3, -3, 0] }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative flex h-48 w-48 items-center justify-center"
          >
            {/* Glow behind box */}
            <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-primary/30 via-accent/20 to-neon-orange/30 blur-2xl" />
            <img src={mysteryBoxImg} alt="Mystery Box" className="relative h-40 w-40 object-contain drop-shadow-[0_0_25px_hsl(270_60%_60%/0.5)] animate-bounce" />
            <motion.div
              className="absolute -inset-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <Sparkles
                  key={deg}
                  className="absolute h-4 w-4 text-neon-orange/60"
                  style={{
                    top: `${50 + 45 * Math.sin((deg * Math.PI) / 180)}%`,
                    left: `${50 + 45 * Math.cos((deg * Math.PI) / 180)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className={`relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl border-2 ${config.border} bg-card/90 backdrop-blur-2xl shadow-2xl ${config.glow}`}
          >
            {/* Rarity flash */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none absolute inset-0 z-10 bg-white/30"
            />

            {/* Car image */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={CAR_IMAGES[result.image_key] || carThunder}
                alt={result.car_name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <div className={`absolute right-3 top-3 rounded-lg px-3 py-1.5 backdrop-blur-xl ${config.badge}`}>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider">
                    {RARITY_LABELS[result.rarity] ?? result.rarity}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
              >
                🎁 Caixa Surpresa
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`mt-1 font-display text-2xl font-black uppercase tracking-wider ${config.text}`}
              >
                {result.car_name}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-0.5 font-display text-xs text-muted-foreground"
              >
                {result.model}
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex justify-center gap-4"
              >
                {[
                  { label: "SPD", value: result.speed, color: "text-primary" },
                  { label: "ACC", value: result.acceleration, color: "text-neon-orange" },
                  { label: "HDL", value: result.handling, color: "text-accent" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5">
                    <span className={`font-display text-lg font-black ${s.color}`}>{s.value}</span>
                    <span className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </motion.div>

              {/* Economy info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2 text-[10px] font-display uppercase tracking-wider text-destructive/70"
              >
                🔥 {result.burned} NP queimados · Saldo: {formatNP(result.remaining_balance)} NP
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-5"
              >
                <Button onClick={onClose} className="w-full rounded-xl bg-primary font-display text-xs uppercase tracking-wider text-primary-foreground">
                  🏁 Ir para Garagem
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════ */
/*               MARKETPLACE PAGE              */
/* ═══════════════════════════════════════════ */
const Marketplace = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [tab, setTab] = useState<TabId>("comprar");
  const [searchQuery, setSearchQuery] = useState("");
  const [cars, setCars] = useState<MarketplaceCar[]>([]);
  const [rentalCars, setRentalCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [renting, setRenting] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  // Mystery box state
  const [buyingBox, setBuyingBox] = useState(false);
  const [boxResult, setBoxResult] = useState<MysteryBoxResult | null>(null);
  const [boxCooldownDays, setBoxCooldownDays] = useState<number | null>(null);

  const loadCars = useCallback(async () => {
    const { data } = await supabase.from("marketplace_cars").select("*").order("price", { ascending: true });
    setCars((data as MarketplaceCar[]) ?? []);
    setLoading(false);
  }, []);

  const loadRentalCars = useCallback(async () => {
    const { data } = await supabase.from("rental_cars").select("*").order("rental_price", { ascending: true });
    setRentalCars((data as RentalCar[]) ?? []);
  }, []);

  const loadBalance = useCallback(async () => {
    if (!user?.walletAddress) return;
    const { data } = await supabase.from("users").select("nitro_points").eq("wallet_address", user.walletAddress).maybeSingle();
    if (data) setUserBalance(data.nitro_points);
  }, [user?.walletAddress]);

  const loadBoxCooldown = useCallback(async () => {
    if (!user?.walletAddress) return;
    const wc = getWalletClient(user.walletAddress);
    const { data } = await wc
      .from("mystery_box_purchases")
      .select("created_at")
      .eq("wallet_address", user.walletAddress)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      const lastPurchase = new Date(data.created_at);
      const unlockDate = new Date(lastPurchase.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (unlockDate > now) {
        setBoxCooldownDays(Math.ceil((unlockDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      } else {
        setBoxCooldownDays(null);
      }
    } else {
      setBoxCooldownDays(null);
    }
  }, [user?.walletAddress]);

  useEffect(() => {
    loadCars();
    loadRentalCars();
    loadBalance();
    loadBoxCooldown();
  }, [loadCars, loadRentalCars, loadBalance, loadBoxCooldown]);

  const handleBuy = async (car: MarketplaceCar) => {
    if (!user?.walletAddress || !session) {
      toast({ title: "Faça login para comprar", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setBuying(car.id);
    try {
      const { data, error } = await supabase.rpc("buy_marketplace_car", { _car_id: car.id, _wallet: user.walletAddress });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({ title: "🎉 Carro Comprado!", description: `${result.car_name} adicionado à garagem! 🔥 ${result.burned} NP queimados · Saldo: ${formatNP(result.remaining_balance)} NP` });
        setUserBalance(result.remaining_balance);
        setCars((prev) => prev.map((c) => c.id === car.id ? { ...c, stock: result.stock_remaining ?? c.stock - 1 } : c));
      } else {
        const errorMsg = result?.error === "insufficient_funds" ? "Saldo insuficiente!" :
          result?.error === "out_of_stock" ? "Estoque esgotado!" :
          result?.error === "car_not_available" ? "Carro indisponível!" :
          result?.error === "garage_full" ? "🚗 Garagem cheia! Máximo de 2 carros. Venda um antes." : "Erro na compra.";
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na compra", description: err.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const handleRent = async (car: RentalCar) => {
    if (!user?.walletAddress || !session) {
      toast({ title: "Faça login para alugar", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setRenting(car.id);
    try {
      const { data, error } = await supabase.rpc("rent_car", { _rental_car_id: car.id, _wallet: user.walletAddress });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({
          title: "🔑 Carro Alugado!",
          description: `${result.car_name} disponível por ${result.races_limit} corridas! 🔥 ${result.burned} NP queimados · Saldo: ${formatNP(result.remaining_balance)} NP`,
        });
        setUserBalance(result.remaining_balance);
      } else {
        const errorMsg = result?.error === "insufficient_funds" ? "Saldo insuficiente!" :
          result?.error === "already_renting" ? "Você já tem um aluguel ativo!" :
          result?.error === "rental_not_available" ? "Carro indisponível!" : "Erro no aluguel.";
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro no aluguel", description: err.message, variant: "destructive" });
    } finally {
      setRenting(null);
    }
  };

  const handleBuyBox = async () => {
    if (!user?.walletAddress || !session) {
      toast({ title: "Faça login para comprar", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setBuyingBox(true);
    try {
      const { data, error } = await supabase.rpc("buy_mystery_box", { _wallet: user.walletAddress });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        setBoxResult(result as MysteryBoxResult);
        setUserBalance(result.remaining_balance);
        setBoxCooldownDays(30);
      } else {
        const errorMsg =
          result?.error === "garage_full" ? "🚗 Garagem cheia! Máximo de 2 carros." :
          result?.error === "cooldown_active" ? `⏳ Aguarde ${result.days_remaining} dias para abrir outra caixa.` :
          result?.error === "insufficient_funds" ? "Saldo insuficiente! Precisa de 800 NP." :
          result?.error === "no_cars_available" ? "Sem carros disponíveis no momento." : "Erro ao abrir caixa.";
        toast({ title: errorMsg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setBuyingBox(false);
    }
  };

  const filteredCars = cars.filter((car) =>
    car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRentals = rentalCars.filter((car) =>
    car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canBuyBox = session && userBalance >= 800 && boxCooldownDays === null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <MainNav nitroPoints={session ? userBalance : undefined} />

      {/* Tab switcher + search */}
      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-8 sm:pt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
              Marketplace
            </h1>
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {tab === "comprar" ? `${filteredCars.length} carros` : `${filteredRentals.length} aluguéis`}
            </p>
          </div>
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carros..."
              className="h-9 rounded-xl border border-border/20 bg-card/30 pl-9 pr-4 font-body text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-card/30 p-1 backdrop-blur-sm border border-border/10 w-fit">
          {([
            { id: "comprar" as TabId, label: "🏪 Carros Novos", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
            { id: "alugar" as TabId, label: "🔑 Aluguel", icon: <Key className="h-3.5 w-3.5" /> },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t.id
                  ? t.id === "comprar" ? "bg-primary text-primary-foreground" : "bg-neon-orange text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.id === "comprar" ? "Comprar" : "Alugar"}</span>
            </button>
          ))}
        </div>

        {/* Mobile search */}
        <div className="mt-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar carros..."
              className="h-10 w-full rounded-xl border border-border/20 bg-card/30 pl-9 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
          </div>
          {session && user && (
            <div className="mt-2 text-right">
              <span className="font-display text-xs text-neon-orange font-bold">{formatNP(userBalance)} NP</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tab === "comprar" ? (
          <>
            {/* ─── Mystery Box Banner ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 via-primary/5 to-neon-orange/10 p-5 backdrop-blur-xl relative"
            >
              {/* Subtle sparkle bg */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-accent/30"
                    style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  />
                ))}
              </div>

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center">
                  <img src={mysteryBoxImg} alt="Mystery Box" className="h-[110px] w-[110px] object-contain drop-shadow-[0_0_15px_hsl(270_60%_60%/0.4)]" />
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                    Caixa Surpresa
                    <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[9px] text-accent">NOVO</span>
                  </h3>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    Compre uma caixa e ganhe um carro aleatório! Chance de conseguir modelos raros e lendários.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-display uppercase tracking-wider">
                    <span className="text-muted-foreground">⚪ 60% Comum</span>
                    <span className="text-neon-green">🟢 25% Incomum</span>
                    <span className="text-primary">🔵 10% Raro</span>
                    <span className="text-neon-orange">🟡 5% Lendário</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] font-display uppercase tracking-wider">
                    <span className="text-destructive">🔥 15% burn</span>
                    <span className="text-primary">🏆 20% pool</span>
                    <span className="text-muted-foreground">🏦 65% tesouro</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Preço</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl font-black text-accent">{formatNP(800)}</span>
                      <span className="font-display text-xs text-muted-foreground">NP</span>
                    </div>
                  </div>

                  {boxCooldownDays !== null ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-neon-orange/20 px-3 py-1.5">
                      <Lock className="h-3 w-3 text-neon-orange" />
                      <span className="font-display text-[10px] font-bold text-neon-orange">
                        {boxCooldownDays}d restantes
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canBuyBox || buyingBox}
                      onClick={handleBuyBox}
                      className="h-10 rounded-xl bg-accent px-5 font-display text-[10px] uppercase tracking-wider text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                    >
                      {buyingBox ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Gift className="mr-1.5 h-4 w-4" />
                      )}
                      {buyingBox ? "Abrindo..." : !session ? "Login" : userBalance < 800 ? "Saldo Insuf." : "Abrir Caixa"}
                    </Button>
                  )}
                  <span className="font-body text-[9px] text-muted-foreground/70">Limite: 1x a cada 30 dias</span>
                </div>
              </div>
            </motion.div>

            <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {filteredCars.map((car, i) => (
                <CarNFTCard key={car.id} car={car} index={i} onBuy={handleBuy} buying={buying} userBalance={userBalance} />
              ))}
            </div>
            {filteredCars.length === 0 && (
              <div className="py-20 text-center">
                <p className="font-display text-sm text-muted-foreground">Nenhum carro disponível.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Rental info banner */}
            <div className="mb-6 rounded-2xl border border-neon-orange/20 bg-neon-orange/5 p-4">
              <h3 className="font-display text-sm font-bold text-neon-orange mb-1">🔑 Sistema de Aluguel</h3>
              <p className="font-body text-xs text-muted-foreground">
                Sem NP para comprar? Alugue um carro usado por um preço acessível! O carro alugado tem stats reduzidos
                e dura por um número limitado de corridas. Ganhe NP nas corridas para comprar seu próprio carro!
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-display uppercase tracking-wider">
                <span className="text-destructive">🔥 15% queima</span>
                <span className="text-primary">🏆 25% reward pool</span>
                <span className="text-muted-foreground">🏦 60% tesouro</span>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
              {filteredRentals.map((car, i) => (
                <RentalCarCard key={car.id} car={car} index={i} onRent={handleRent} renting={renting} userBalance={userBalance} />
              ))}
            </div>
            {filteredRentals.length === 0 && (
              <div className="py-20 text-center">
                <p className="font-display text-sm text-muted-foreground">Nenhum carro disponível para aluguel.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mystery Box Reveal Modal */}
      <AnimatePresence>
        {boxResult && (
          <MysteryBoxReveal
            result={boxResult}
            onClose={() => {
              setBoxResult(null);
              navigate("/garage");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;
