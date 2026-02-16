import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  Search, Loader2,
  ShoppingCart, Tag, Clock, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MainNav from "@/components/MainNav";
import { useGameState } from "@/hooks/useGameState";

import carPhantom from "@/assets/marketplace/car-phantom.jpg";
import carInferno from "@/assets/marketplace/car-inferno.jpg";
import carSolar from "@/assets/marketplace/car-solar.jpg";
import carVenom from "@/assets/marketplace/car-venom.jpg";
import carEclipse from "@/assets/marketplace/car-eclipse.jpg";
import carFrost from "@/assets/marketplace/car-frost.jpg";
import carThunder from "@/assets/marketplace/car-thunder.jpg";
import carBlaze from "@/assets/marketplace/car-blaze.jpg";

const CAR_IMAGES: Record<string, string> = {
  phantom: carPhantom, inferno: carInferno, solar: carSolar,
  venom: carVenom, eclipse: carEclipse, frost: carFrost,
  thunder: carThunder, blaze: carBlaze,
};

const getCarImg = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, img] of Object.entries(CAR_IMAGES)) {
    if (lower.includes(key)) return img;
  }
  return carThunder;
};

interface UsedListing {
  id: string;
  car_id: string;
  seller_wallet: string;
  price: number;
  status: string;
  created_at: string;
  car: {
    name: string;
    model: string;
    level: number;
    speed_base: number;
    acceleration_base: number;
    handling_base: number;
    durability: number;
    engine_health: number;
    total_km: number;
    wins: number;
    races_count: number;
    license_plate: string;
  };
}

const StatMini = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted/30">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-display text-xs font-bold text-foreground w-6 text-right">{value}</span>
    </div>
  </div>
);

const UsedMarketplace = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { state } = useGameState();
  const [listings, setListings] = useState<UsedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userBalance, setUserBalance] = useState(0);

  // Sell modal state
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellCarId, setSellCarId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [selling, setSelling] = useState(false);

  const loadListings = useCallback(async () => {
    const { data } = await supabase
      .from("used_car_listings")
      .select("*, car:cars(name, model, level, speed_base, acceleration_base, handling_base, durability, engine_health, total_km, wins, races_count, license_plate)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setListings((data as any[]) ?? []);
    setLoading(false);
  }, []);

  const loadBalance = useCallback(async () => {
    if (!user?.walletAddress) return;
    const { data } = await supabase.from("users").select("nitro_points").eq("wallet_address", user.walletAddress).maybeSingle();
    if (data) setUserBalance(data.nitro_points);
  }, [user?.walletAddress]);

  useEffect(() => {
    loadListings();
    loadBalance();
  }, [loadListings, loadBalance]);

  const ownedCarsCount = state.cars.filter(c => !c.isRented).length;
  const canBuy = ownedCarsCount < 2;

  const handleBuy = async (listing: UsedListing) => {
    if (!user?.walletAddress || !session) {
      toast({ title: "Faça login para comprar", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setBuying(listing.id);
    try {
      const { data, error } = await supabase.rpc("buy_used_car", {
        _listing_id: listing.id,
        _wallet: user.walletAddress,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({
          title: "🎉 Carro Usado Comprado!",
          description: `Vendedor recebeu ${result.seller_received} NP · 🔥 ${result.burned} NP queimados · Saldo: ${result.remaining_balance} NP`,
        });
        setUserBalance(result.remaining_balance);
        setListings(prev => prev.filter(l => l.id !== listing.id));
      } else {
        const msg = result?.error === "garage_full" ? "🚗 Garagem cheia! Máximo de 2 carros."
          : result?.error === "insufficient_funds" ? "Saldo insuficiente!"
          : result?.error === "cannot_buy_own" ? "Você não pode comprar seu próprio carro!"
          : "Erro na compra.";
        toast({ title: msg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const handleSell = async () => {
    if (!sellCarId || !sellPrice || !user?.walletAddress) return;
    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Preço inválido", variant: "destructive" });
      return;
    }
    setSelling(true);
    try {
      const { data, error } = await supabase.rpc("list_car_for_sale", {
        _car_id: sellCarId,
        _wallet: user.walletAddress,
        _price: price,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({ title: "✅ Carro listado para venda!", description: `${result.car_name} por ${result.price} NP` });
        setShowSellModal(false);
        setSellPrice("");
        setSellCarId(null);
        loadListings();
      } else {
        const msg = result?.error === "cooldown_active"
          ? `⏳ Carência de 7 dias! Faltam ${result.days_remaining} dia(s).`
          : result?.error === "already_listed" ? "Este carro já está listado!"
          : result?.error === "must_keep_one_car" ? "Você precisa manter pelo menos 1 carro!"
          : result?.error === "is_rental" ? "Carros alugados não podem ser vendidos!"
          : "Erro ao listar.";
        toast({ title: msg, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSelling(false);
    }
  };

  // Sellable cars: owned (not rented), not already listed
  const sellableCars = state.cars.filter(c => !c.isRented);

  const filteredListings = listings.filter(l =>
    l.car?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainNav nitroPoints={session ? userBalance : undefined} />

      <div className="mx-auto max-w-7xl px-3 pt-3 sm:px-8 sm:pt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
              🏪 Marketplace de Usados
            </h1>
            <p className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {filteredListings.length} carros à venda · Taxa: 10% burn + 10% pool
            </p>
          </div>
          <div className="flex gap-2">
            {session && sellableCars.length > 0 && (
              <Button
                size="sm"
                onClick={() => setShowSellModal(true)}
                className="h-9 rounded-lg bg-neon-orange px-4 font-display text-[10px] uppercase tracking-wider text-background hover:bg-neon-orange/90"
              >
                <Tag className="mr-1 h-3 w-3" />
                Vender Carro
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/marketplace")}
              className="h-9 rounded-lg font-display text-[10px] uppercase tracking-wider"
            >
              Carros Novos
            </Button>
          </div>
        </div>

        {!canBuy && session && (
          <div className="mb-4 rounded-xl border border-neon-orange/30 bg-neon-orange/10 p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-neon-orange shrink-0" />
            <p className="font-body text-xs text-neon-orange">
              Garagem cheia (2/2 carros). Venda um carro para poder comprar outro.
            </p>
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar carros usados..."
            className="h-10 w-full rounded-xl border border-border/20 bg-card/30 pl-9 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-8 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">🏎️</p>
            <p className="font-display text-sm text-muted-foreground">Nenhum carro à venda no momento.</p>
            <p className="font-body text-xs text-muted-foreground">Venda seu carro ou volte mais tarde!</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {filteredListings.map((listing, i) => {
              const car = listing.car;
              if (!car) return null;
              const isMine = listing.seller_wallet === user?.walletAddress;
              const canAfford = userBalance >= listing.price;

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group relative overflow-hidden rounded-2xl border border-neon-orange/30 bg-card/50 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img src={getCarImg(car.name)} alt={car.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span className="rounded-md bg-neon-orange/20 px-2 py-0.5 backdrop-blur-xl font-display text-[9px] font-bold uppercase tracking-wider text-neon-orange">
                        USADO
                      </span>
                      <span className="rounded-md bg-card/80 px-2 py-0.5 backdrop-blur-xl font-display text-[9px] font-bold text-primary">
                        Lv.{car.level}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3 rounded-md bg-card/80 px-2 py-0.5 backdrop-blur-xl">
                      <span className="font-display text-[10px] font-bold text-muted-foreground">
                        🏷️ {car.license_plate}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-foreground">{car.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-body text-muted-foreground">
                      <span>🛣️ {Number(car.total_km).toLocaleString()} km</span>
                      <span>🏆 {car.wins}W / {car.races_count}R</span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <StatMini label="Speed" value={car.speed_base} color="bg-primary" />
                      <StatMini label="Accel" value={car.acceleration_base} color="bg-neon-orange" />
                      <StatMini label="Handle" value={car.handling_base} color="bg-accent" />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-body text-muted-foreground">
                      <span>🔧 Motor: <span className={car.engine_health < 50 ? "text-destructive" : "text-neon-green"}>{car.engine_health}%</span></span>
                      <span>🛡️ Dur: {car.durability}%</span>
                    </div>

                    <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-1.5">
                      <p className="font-display text-[9px] uppercase tracking-wider text-destructive/70">
                        🔥 10% burn · 10% pool · 80% vendedor
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-3">
                      <div>
                        <span className="font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Preço</span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-lg font-black text-neon-orange">{listing.price.toLocaleString()}</span>
                          <span className="font-display text-[10px] text-muted-foreground">NP</span>
                        </div>
                      </div>
                      {isMine ? (
                        <span className="font-display text-[10px] text-muted-foreground uppercase">Seu anúncio</span>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!canBuy || !canAfford || buying === listing.id}
                          onClick={() => handleBuy(listing)}
                          className="h-9 rounded-lg bg-primary px-4 font-display text-[10px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {buying === listing.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ShoppingCart className="mr-1 h-3 w-3" />}
                          {buying === listing.id ? "..." : !canBuy ? "Garagem Cheia" : !canAfford ? "Sem Saldo" : "Comprar"}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Sell Modal */}
      <AnimatePresence>
        {showSellModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setShowSellModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border/30 bg-card p-6 shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold text-foreground mb-1">🏷️ Vender Carro</h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Carência de 7 dias após compra. Taxa: 10% burn + 10% reward pool.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="font-display text-xs text-muted-foreground uppercase tracking-wider">Selecionar Carro</label>
                  <div className="mt-1 space-y-2">
                    {sellableCars.map(car => {
                      const daysSincePurchase = Math.floor((Date.now() - new Date(car.purchasedAt).getTime()) / 86400000);
                      const canSell = daysSincePurchase >= 7;
                      return (
                        <button
                          key={car.id}
                          onClick={() => setSellCarId(car.id)}
                          className={`w-full rounded-xl border p-3 text-left transition-all ${
                            sellCarId === car.id ? "border-primary bg-primary/10" : "border-border/20 bg-card/50 hover:bg-card/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-display text-sm font-bold text-foreground">{car.name}</span>
                              <span className="ml-2 font-display text-[10px] text-primary">🏷️ {car.licensePlate}</span>
                            </div>
                            <span className="font-display text-xs text-muted-foreground">Lv.{car.level}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>🛣️ {car.totalKm.toLocaleString()} km</span>
                            <span>🏆 {car.wins}W</span>
                            {!canSell && (
                              <span className="flex items-center gap-1 text-neon-orange">
                                <Clock className="h-3 w-3" />
                                {7 - daysSincePurchase}d restantes
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {sellCarId && (
                  <div>
                    <label className="font-display text-xs text-muted-foreground uppercase tracking-wider">Preço (NP)</label>
                    <input
                      type="number"
                      min="1"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="Ex: 2000"
                      className="mt-1 h-10 w-full rounded-xl border border-border/20 bg-card/30 px-4 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                    {sellPrice && parseInt(sellPrice) > 0 && (
                      <div className="mt-2 rounded-lg bg-muted/10 p-2 text-[10px] font-body text-muted-foreground space-y-0.5">
                        <div className="flex justify-between">
                          <span>Preço de venda</span>
                          <span className="text-foreground font-bold">{parseInt(sellPrice).toLocaleString()} NP</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span>🔥 Burn (10%)</span>
                          <span>-{Math.ceil(parseInt(sellPrice) * 0.1).toLocaleString()} NP</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>🏆 Pool (10%)</span>
                          <span>-{Math.ceil(parseInt(sellPrice) * 0.1).toLocaleString()} NP</span>
                        </div>
                        <div className="flex justify-between text-neon-green font-bold border-t border-border/20 pt-1 mt-1">
                          <span>Você recebe</span>
                          <span>{Math.floor(parseInt(sellPrice) * 0.8).toLocaleString()} NP</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSellModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!sellCarId || !sellPrice || parseInt(sellPrice) <= 0 || selling}
                  onClick={handleSell}
                  className="flex-1 bg-neon-orange text-background hover:bg-neon-orange/90"
                >
                  {selling ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Tag className="mr-1 h-4 w-4" />}
                  {selling ? "Listando..." : "Colocar à Venda"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsedMarketplace;
