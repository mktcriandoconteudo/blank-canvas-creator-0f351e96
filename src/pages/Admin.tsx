import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield, Users, Settings, RefreshCw, AlertTriangle, Save,
  Coins, Trophy, Flame, Eye, X, TrendingDown, TrendingUp,
  Wallet, BarChart3, Activity, Zap, Fuel, Clock, ShieldCheck,
  AlertCircle, ChevronDown, ChevronUp, ShoppingCart, Image
} from "lucide-react";
import MainNav from "@/components/MainNav";
import { useAdmin, type PlayerDetail } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import {
  BURN_RATE_PERCENT, REWARD_POOL_RATE_PERCENT, TREASURY_RATE_PERCENT,
  MAX_SUPPLY, DEFAULT_DAILY_EMISSION_LIMIT, DEFAULT_DECAY_RATE_PERCENT, MIN_DAILY_EMISSION,
} from "@/lib/economy/constants";
import { useSiteAssets, uploadSiteAsset } from "@/hooks/useSiteAssets";
// Car images for marketplace admin
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

interface MarketplaceCarAdmin {
  id: string;
  name: string;
  model: string;
  rarity: string;
  price: number;
  speed_base: number;
  acceleration_base: number;
  handling_base: number;
  durability: number;
  image_key: string;
  sale_active: boolean;
  stock: number;
}

type TabId = "dashboard" | "players" | "economy" | "collision" | "marketplace" | "branding";

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, sub, color = "text-primary" }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) => (
  <div className="rounded-xl border border-border/20 bg-card/30 p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-2">
      <div className={`${color}`}>{icon}</div>
      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <p className={`font-display text-2xl font-black ${color}`}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
    {sub && <p className="mt-0.5 font-body text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

/* ── Progress Bar ── */
const ProgressBar = ({ value, max, color = "from-primary to-primary/60", label }: {
  value: number; max: number; color?: string; label?: string;
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="font-display text-[10px] text-foreground">{pct.toFixed(1)}%</span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ── Player Detail Modal ── */
const PlayerDetailModal = ({ player, onClose }: { player: PlayerDetail; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/30 bg-card/95 p-6 backdrop-blur-xl"
    >
      <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 hover:bg-muted/30">
        <X className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-display text-xl font-black text-foreground">{player.username || "Sem nome"}</h2>
          {(() => {
            const online = player.lastSeenAt ? new Date(player.lastSeenAt).getTime() > Date.now() - 15 * 60 * 1000 : false;
            return (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-display text-[10px] font-bold ${online ? "bg-neon-green/20 text-neon-green" : "bg-muted/20 text-muted-foreground"}`}>
                <span className={`h-2 w-2 rounded-full ${online ? "bg-neon-green animate-pulse" : "bg-muted-foreground/40"}`} />
                {online ? "Online" : "Offline"}
              </span>
            );
          })()}
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-1">Wallet: {player.walletAddress}</p>
        {player.authId && <p className="font-mono text-[10px] text-muted-foreground">Auth ID: {player.authId}</p>}
        <p className="font-body text-xs text-muted-foreground mt-1">
          Cadastro: {new Date(player.createdAt).toLocaleString("pt-BR")} · Último acesso: {new Date(player.updatedAt).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatCard icon={<Coins className="h-4 w-4" />} label="NP" value={player.nitroPoints} color="text-neon-orange" />
        <StatCard icon={<Fuel className="h-4 w-4" />} label="Fuel" value={`${player.fuelTanks}/5`} color="text-primary" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Vitórias" value={player.totalWins} color="text-neon-green" />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Corridas" value={player.totalRaces} color="text-destructive" />
      </div>

      {/* Cars */}
      <div className="mb-6">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          🏎️ Veículos ({player.cars.length})
        </h3>
        <div className="space-y-3">
          {player.cars.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/20 bg-muted/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-display text-sm font-bold text-foreground">{c.name}</span>
                  <span className="ml-2 font-display text-[10px] uppercase tracking-wider text-muted-foreground capitalize">{c.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs text-primary font-bold">Lv.{c.level}</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{c.tokenId}</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-[10px] font-body text-muted-foreground mb-2">
                <div className="rounded-lg bg-primary/5 p-1.5 text-center">
                  <div className="text-[8px] uppercase tracking-wider">Speed</div>
                  <div className="text-foreground font-bold text-sm">{c.speed}</div>
                </div>
                <div className="rounded-lg bg-neon-orange/5 p-1.5 text-center">
                  <div className="text-[8px] uppercase tracking-wider">Accel</div>
                  <div className="text-foreground font-bold text-sm">{c.acceleration}</div>
                </div>
                <div className="rounded-lg bg-accent/5 p-1.5 text-center">
                  <div className="text-[8px] uppercase tracking-wider">Handle</div>
                  <div className="text-foreground font-bold text-sm">{c.handling}</div>
                </div>
                <div className="rounded-lg bg-neon-green/5 p-1.5 text-center">
                  <div className="text-[8px] uppercase tracking-wider">Durab.</div>
                  <div className="text-foreground font-bold text-sm">{c.durability}</div>
                </div>
              </div>

              {/* Health & KM */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Motor</span>
                    <span className={`font-display text-xs font-bold ${c.engineHealth < 30 ? "text-destructive" : c.engineHealth < 60 ? "text-neon-orange" : "text-neon-green"}`}>{c.engineHealth}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div className={`h-full rounded-full ${c.engineHealth < 30 ? "bg-destructive" : c.engineHealth < 60 ? "bg-neon-orange" : "bg-neon-green"}`} style={{ width: `${c.engineHealth}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">XP</span>
                    <span className="font-display text-xs font-bold text-primary">{c.xp}/{c.xpToNext}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/30 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.xp / c.xpToNext) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Details row */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-body text-muted-foreground">
                <div>🛣️ KM: <span className="text-foreground font-bold">{c.totalKm.toLocaleString()}</span></div>
                <div>🏆 {c.wins}W / {c.racesCount}R</div>
                <div>🔧 Rev: {c.racesSinceRevision} corridas</div>
                <div>🛢️ Óleo: {c.lastOilChangeKm.toLocaleString()} km</div>
                <div>⭐ Pts: {c.attributePoints}</div>
                <div>⛽ Fuel: {c.fuelTanks}/5</div>
              </div>
            </div>
          ))}
          {player.cars.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum veículo</p>
          )}
        </div>
      </div>

      {/* Insurance */}
      {player.insurances.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            🛡️ Seguros ({player.insurances.length})
          </h3>
          <div className="space-y-2">
            {player.insurances.map((ins) => (
              <div key={ins.id} className={`rounded-xl border p-3 ${ins.isActive ? "border-neon-green/30 bg-neon-green/5" : "border-border/20 bg-muted/5 opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-foreground capitalize">{ins.planType}</span>
                  <span className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold ${ins.isActive ? "bg-neon-green/20 text-neon-green" : "bg-muted/30 text-muted-foreground"}`}>
                    {ins.isActive ? "Ativo" : "Expirado"}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-[10px] font-body text-muted-foreground">
                  <span>Cobertura: {ins.coveragePercent}%</span>
                  <span>Sinistros: {ins.claimsUsed}/{ins.maxClaims}</span>
                  <span>Corridas: {ins.racesRemaining}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Collisions */}
      {player.recentCollisions.length > 0 && (
        <div>
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            💥 Colisões Recentes ({player.recentCollisions.length})
          </h3>
          <div className="space-y-1">
            {player.recentCollisions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2 text-xs">
                <span className="font-body text-muted-foreground">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                <span className="font-display text-destructive">Motor -{c.damageEngine}% · Dur -{c.damageDurability}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  </motion.div>
);


const Admin = () => {
  const navigate = useNavigate();
  const {
    isAdmin, loading, players, collisionConfig, saveCollisionConfig, saving,
    refreshPlayers, economyReport, refreshEconomy, selectedPlayer,
    loadPlayerDetail, clearSelectedPlayer, onlineCount,
  } = useAdmin();

  const [localConfig, setLocalConfig] = useState(collisionConfig);
  const [configDirty, setConfigDirty] = useState(false);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [economyRulesOpen, setEconomyRulesOpen] = useState(false);

  // Marketplace admin state
  const [marketplaceCars, setMarketplaceCars] = useState<MarketplaceCarAdmin[]>([]);
  const [togglingCar, setTogglingCar] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [savingCar, setSavingCar] = useState(false);

  // Branding state
  const siteAssets = useSiteAssets();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleAssetUpload = async (file: File, type: "logo" | "favicon") => {
    const setUploading = type === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    const url = await uploadSiteAsset(file, type);
    if (url) {
      toast({ title: `${type === "logo" ? "Logo" : "Favicon"} atualizado com sucesso!` });
      siteAssets.refresh();
    } else {
      toast({ title: "Erro ao fazer upload", variant: "destructive" });
    }
    setUploading(false);
  };

  const loadMarketplaceCars = useCallback(async () => {
    const { data } = await supabase.from("marketplace_cars").select("*").order("created_at", { ascending: true });
    setMarketplaceCars((data as MarketplaceCarAdmin[]) ?? []);
  }, []);

  useEffect(() => {
    if (isAdmin && tab === "marketplace") {
      loadMarketplaceCars();
    }
  }, [isAdmin, tab, loadMarketplaceCars]);

  const toggleCarSale = async (car: MarketplaceCarAdmin) => {
    setTogglingCar(car.id);
    const { error } = await supabase
      .from("marketplace_cars")
      .update({ sale_active: !car.sale_active })
      .eq("id", car.id);
    if (!error) {
      setMarketplaceCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, sale_active: !c.sale_active } : c))
      );
      toast({ title: `${car.name} ${!car.sale_active ? "ativado" : "desativado"} no Marketplace` });
    }
    setTogglingCar(null);
  };

  const startEditCar = (car: MarketplaceCarAdmin) => {
    setEditingCar(car.id);
    setEditStock(car.stock);
    setEditPrice(car.price);
  };

  const saveCarEdit = async (car: MarketplaceCarAdmin) => {
    setSavingCar(true);
    const { error } = await supabase
      .from("marketplace_cars")
      .update({ stock: editStock, price: editPrice })
      .eq("id", car.id);
    if (!error) {
      setMarketplaceCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, stock: editStock, price: editPrice } : c))
      );
      toast({ title: `${car.name} atualizado: ${editStock} unidades · ${editPrice} NP` });
    }
    setSavingCar(false);
    setEditingCar(null);
  };

  // Sync local config when loaded
  const [synced, setSynced] = useState(false);
  if (!synced && collisionConfig.collisionChancePercent !== localConfig.collisionChancePercent) {
    setLocalConfig(collisionConfig);
    setSynced(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h1 className="font-display text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <button onClick={() => navigate("/garage")} className="mt-4 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90">
          Voltar à Garagem
        </button>
      </div>
    );
  }

  const handleSaveConfig = async () => {
    const ok = await saveCollisionConfig(localConfig);
    if (ok) setConfigDirty(false);
  };

  const updateConfig = (key: keyof typeof localConfig, value: number) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
    setConfigDirty(true);
  };

  const filteredPlayers = searchQuery
    ? players.filter((p) =>
        (p.username ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : players;

  const totalNP = players.reduce((s, p) => s + p.nitroPoints, 0);
  const totalRaces = players.reduce((s, p) => s + p.totalRaces, 0);
  const totalWins = players.reduce((s, p) => s + p.totalWins, 0);
  const avgWinRate = totalRaces > 0 ? ((totalWins / totalRaces) * 100).toFixed(1) : "0";

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "players", label: "Pilotos", icon: <Users className="h-4 w-4" /> },
    { id: "economy", label: "Economia", icon: <Coins className="h-4 w-4" /> },
    { id: "collision", label: "Colisão", icon: <Settings className="h-4 w-4" /> },
    { id: "marketplace", label: "Marketplace", icon: <ShoppingCart className="h-4 w-4" /> },
    { id: "branding", label: "Branding", icon: <Image className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <MainNav />

      {/* Admin Title + Tabs */}
      <div className="border-b border-border/20 bg-card/20 px-4 sm:px-8 overflow-x-auto">
        <div className="flex items-center gap-3 pt-3 pb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-display text-lg font-black uppercase tracking-widest text-primary">Admin Panel</h1>
          <span className="rounded-full bg-primary/20 px-3 py-1 font-display text-[10px] font-bold text-primary">🔒 Administrador</span>
        </div>
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 font-display text-xs uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-6 sm:px-8 max-w-7xl mx-auto">

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard icon={<Activity className="h-4 w-4" />} label="Pilotos Online" value={onlineCount} sub="Últimos 15 min" color="text-neon-green" />
              <StatCard icon={<Users className="h-4 w-4" />} label="Pilotos Cadastrados" value={players.length} color="text-primary" />
              <StatCard icon={<Flame className="h-4 w-4" />} label="Total Corridas" value={totalRaces} color="text-neon-orange" />
              <StatCard icon={<Trophy className="h-4 w-4" />} label="Win Rate Médio" value={`${avgWinRate}%`} color="text-neon-green" />
              <StatCard icon={<Coins className="h-4 w-4" />} label="NP em Circulação" value={economyReport?.circulatingSupply ?? totalNP} sub={`de ${MAX_SUPPLY.toLocaleString()} max`} color="text-neon-orange" />
            </div>

            {/* Economy Quick Stats */}
            {economyReport && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Total Queimado" value={economyReport.totalBurned} sub={`${economyReport.burnRatePercent}% burn rate`} color="text-destructive" />
                <StatCard icon={<Zap className="h-4 w-4" />} label="Total Emitido" value={economyReport.totalMinted} sub={`Hoje: ${economyReport.dailyEmittedToday.toLocaleString()}`} color="text-primary" />
                <StatCard icon={<Wallet className="h-4 w-4" />} label="Treasury" value={economyReport.treasuryBalance} color="text-accent" />
                <StatCard icon={<Activity className="h-4 w-4" />} label="Reward Pool" value={economyReport.rewardPoolBalance} color="text-neon-green" />
              </div>
            )}

            {/* Supply Progress */}
            {economyReport && (
              <div className="rounded-xl border border-border/20 bg-card/30 p-4 backdrop-blur-sm">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Supply Overview</h3>
                <div className="space-y-3">
                  <ProgressBar value={economyReport.totalMinted} max={MAX_SUPPLY} label="Minted / Hard Cap" color="from-primary to-accent" />
                  <ProgressBar value={economyReport.totalBurned} max={economyReport.totalMinted || 1} label="Burned / Minted" color="from-destructive to-neon-orange" />
                  <ProgressBar value={economyReport.dailyEmittedToday} max={economyReport.dailyEmissionLimit || DEFAULT_DAILY_EMISSION_LIMIT} label="Emissão Diária Consumida" color="from-neon-green to-emerald-400" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-[10px] font-bold ${
                    economyReport.sustainabilityScore === "HIGH_DEFLATION" ? "bg-neon-green/20 text-neon-green" :
                    economyReport.sustainabilityScore === "MODERATE_DEFLATION" ? "bg-neon-orange/20 text-neon-orange" :
                    economyReport.sustainabilityScore === "LOW_DEFLATION" ? "bg-amber-400/20 text-amber-400" :
                    "bg-muted/20 text-muted-foreground"
                  }`}>
                    {economyReport.sustainabilityScore === "HIGH_DEFLATION" ? "🟢 Alta Deflação" :
                     economyReport.sustainabilityScore === "MODERATE_DEFLATION" ? "🟡 Deflação Moderada" :
                     economyReport.sustainabilityScore === "LOW_DEFLATION" ? "🟠 Baixa Deflação" :
                     "⚪ Sem Dados"}
                  </span>
                  {economyReport.projectedDaysToDepletion > 0 && (
                    <span className="font-body text-[10px] text-muted-foreground">
                      Projeção de esgotamento: ~{economyReport.projectedDaysToDepletion} dias
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top Players */}
            <div className="rounded-xl border border-border/20 bg-card/30 p-4 backdrop-blur-sm">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">🏆 Top 5 Pilotos (NP)</h3>
              <div className="space-y-2">
                {[...players].sort((a, b) => b.nitroPoints - a.nitroPoints).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/10 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className={`font-display text-sm font-black ${i === 0 ? "text-neon-orange" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-amber-600" : "text-muted-foreground/50"}`}>
                        #{i + 1}
                      </span>
                      <span className="font-display text-sm text-foreground">{p.username || "Sem nome"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-display text-neon-orange font-bold">{p.nitroPoints.toLocaleString()} NP</span>
                      <span className="text-muted-foreground">{p.totalWins}W/{p.totalRaces}R</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ PLAYERS ═══ */}
        {tab === "players" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Pilotos Cadastrados ({players.length})
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por nome ou wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-border/30 bg-card/30 px-3 py-2 font-body text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 w-48 sm:w-64"
                />
                <button onClick={refreshPlayers} className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs text-primary hover:bg-primary/20 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                 <tr className="border-b border-border/20">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Piloto</th>
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Wallet</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">NP</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">Carros</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">W/L</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">Corridas</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">Fuel</th>
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Desde</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((p) => {
                    const isOnline = p.lastSeenAt ? new Date(p.lastSeenAt).getTime() > Date.now() - 15 * 60 * 1000 : false;
                    return (
                    <tr key={p.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-neon-green animate-pulse" : "bg-muted-foreground/30"}`} />
                          <span className={`font-display text-[10px] uppercase tracking-wider ${isOnline ? "text-neon-green" : "text-muted-foreground"}`}>
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-display text-sm text-foreground">{p.username || "Sem nome"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.walletAddress.slice(0, 8)}...{p.walletAddress.slice(-4)}</td>
                      <td className="px-4 py-3 text-center font-display text-sm text-neon-orange font-bold">{p.nitroPoints.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-display text-sm text-foreground">{p.carsCount}</td>
                      <td className="px-4 py-3 text-center font-display text-xs">
                        <span className="text-neon-green">{p.totalWins}W</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-destructive">{p.totalLosses}L</span>
                      </td>
                      <td className="px-4 py-3 text-center font-display text-sm text-foreground">{p.totalRaces}</td>
                      <td className="px-4 py-3 text-center font-display text-xs text-primary">{p.fuelTanks}/5</td>
                      <td className="px-4 py-3 font-body text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => loadPlayerDetail(p)}
                          className="rounded-lg border border-primary/30 bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  {filteredPlayers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        {searchQuery ? "Nenhum piloto encontrado." : "Nenhum piloto cadastrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══ ECONOMY ═══ */}
        {tab === "economy" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Sistema Econômico Deflacionário</h2>
              <button onClick={refreshEconomy} className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs text-primary hover:bg-primary/20">
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            </div>

            {economyReport ? (
              <>
                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatCard icon={<Coins className="h-4 w-4" />} label="Hard Cap" value={MAX_SUPPLY.toLocaleString()} sub="Supply máximo" color="text-foreground" />
                  <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Emitido (Minted)" value={economyReport.totalMinted} sub={`${((economyReport.totalMinted / MAX_SUPPLY) * 100).toFixed(2)}% do cap`} color="text-primary" />
                  <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Total Queimado (Burned)" value={economyReport.totalBurned} sub={`Burn rate: ${economyReport.burnRatePercent}%`} color="text-destructive" />
                  <StatCard icon={<Activity className="h-4 w-4" />} label="Supply Circulante" value={economyReport.circulatingSupply} color="text-neon-orange" />
                  <StatCard icon={<Wallet className="h-4 w-4" />} label="Treasury" value={economyReport.treasuryBalance} sub="Reserva estratégica (70%)" color="text-accent" />
                  <StatCard icon={<Zap className="h-4 w-4" />} label="Reward Pool" value={economyReport.rewardPoolBalance} sub="Distribuição jogadores (20%)" color="text-neon-green" />
                </div>

                {/* Emission Stats */}
                <div className="rounded-xl border border-border/20 bg-card/30 p-4 backdrop-blur-sm">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Emissão Diária</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-4">
                    <div>
                      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Limite Diário</span>
                      <p className="font-display text-lg font-bold text-primary">{economyReport.dailyEmissionLimit.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Emitido Hoje</span>
                      <p className="font-display text-lg font-bold text-neon-orange">{economyReport.dailyEmittedToday.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Burn Médio/Dia</span>
                      <p className="font-display text-lg font-bold text-destructive">{economyReport.avgDailyBurn.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Dias Ativos</span>
                      <p className="font-display text-lg font-bold text-foreground">{economyReport.daysActive}</p>
                    </div>
                  </div>
                  <ProgressBar value={economyReport.dailyEmittedToday} max={economyReport.dailyEmissionLimit} label="Progresso Emissão Diária" color="from-neon-green to-primary" />
                </div>

                {/* Sustainability */}
                <div className="rounded-xl border border-border/20 bg-card/30 p-4 backdrop-blur-sm">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sustentabilidade</h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                    <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold ${
                      economyReport.sustainabilityScore === "HIGH_DEFLATION" ? "bg-neon-green/20 text-neon-green" :
                      economyReport.sustainabilityScore === "MODERATE_DEFLATION" ? "bg-neon-orange/20 text-neon-orange" :
                      economyReport.sustainabilityScore === "LOW_DEFLATION" ? "bg-amber-400/20 text-amber-400" :
                      "bg-muted/20 text-muted-foreground"
                    }`}>
                      <ShieldCheck className="h-5 w-5" />
                      {economyReport.sustainabilityScore === "HIGH_DEFLATION" ? "Alta Deflação" :
                       economyReport.sustainabilityScore === "MODERATE_DEFLATION" ? "Deflação Moderada" :
                       economyReport.sustainabilityScore === "LOW_DEFLATION" ? "Baixa Deflação" : "Sem Dados"}
                    </span>
                    {economyReport.projectedDaysToDepletion > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-body text-sm text-muted-foreground">
                          Projeção de esgotamento: <span className="font-bold text-foreground">~{economyReport.projectedDaysToDepletion} dias</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Carregando dados econômicos...
              </div>
            )}

            {/* Economy Rules */}
            <div className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden">
              <button
                onClick={() => setEconomyRulesOpen(!economyRulesOpen)}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors"
              >
                <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">📜 Regras do Sistema Deflacionário</span>
                {economyRulesOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {economyRulesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 font-body text-xs text-muted-foreground leading-relaxed">
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground mb-1">Hard Cap</h4>
                        <p>O supply máximo de Nitro Points é fixo em <span className="text-primary font-bold">{MAX_SUPPLY.toLocaleString()} NP</span>. Nenhum token pode ser criado além desse limite.</p>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground mb-1">Divisão de Transações</h4>
                        <p>Toda transação econômica (reparos, seguros, troca de óleo) é automaticamente dividida:</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-destructive/10 p-2 text-center">
                            <span className="font-display text-lg font-black text-destructive">{BURN_RATE_PERCENT}%</span>
                            <p className="text-[10px] text-destructive/70">Queima (Burn)</p>
                          </div>
                          <div className="rounded-lg bg-neon-green/10 p-2 text-center">
                            <span className="font-display text-lg font-black text-neon-green">{REWARD_POOL_RATE_PERCENT}%</span>
                            <p className="text-[10px] text-neon-green/70">Reward Pool</p>
                          </div>
                          <div className="rounded-lg bg-accent/10 p-2 text-center">
                            <span className="font-display text-lg font-black text-accent">{TREASURY_RATE_PERCENT}%</span>
                            <p className="text-[10px] text-accent/70">Treasury</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground mb-1">Controle de Emissão</h4>
                        <p>Novos tokens são emitidos como recompensa de corrida, sujeitos a:</p>
                        <ul className="mt-1 list-disc list-inside space-y-0.5">
                          <li>Limite diário base: <span className="text-foreground font-bold">{DEFAULT_DAILY_EMISSION_LIMIT.toLocaleString()} NP/dia</span></li>
                          <li>Decay semanal: <span className="text-foreground font-bold">{DEFAULT_DECAY_RATE_PERCENT}%</span> por semana (o limite diminui ao longo do tempo)</li>
                          <li>Piso mínimo: <span className="text-foreground font-bold">{MIN_DAILY_EMISSION.toLocaleString()} NP/dia</span></li>
                          <li>Bônus por jogadores ativos (últimas 24h)</li>
                          <li>Respeita o Hard Cap global</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground mb-1">Fluxo Deflacionário</h4>
                        <p>
                          À medida que jogadores gastam NP (reparos, seguros, combustível), parte é permanentemente removida do supply.
                          Combinado com o decay de emissão, o sistema naturalmente reduz o supply circulante ao longo do tempo,
                          valorizando os tokens existentes.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ═══ COLLISION ═══ */}
        {tab === "collision" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground mb-4">Configuração de Colisão</h2>
            <p className="font-body text-xs text-muted-foreground mb-6">
              Ajuste a chance e intensidade das colisões durante as corridas. Essas configurações afetam todos os jogadores em tempo real.
            </p>

            <div className="space-y-6 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-6">
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Chance de Colisão</span>
                  <span className="font-display text-lg font-bold text-primary">{localConfig.collisionChancePercent}%</span>
                </label>
                <input type="range" min={0} max={100} value={localConfig.collisionChancePercent} onChange={(e) => updateConfig("collisionChancePercent", Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>100%</span></div>
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Dano Mínimo (Motor)</span>
                  <span className="font-display text-lg font-bold text-neon-orange">{localConfig.collisionMinDamage}%</span>
                </label>
                <input type="range" min={1} max={50} value={localConfig.collisionMinDamage} onChange={(e) => updateConfig("collisionMinDamage", Number(e.target.value))} className="w-full accent-neon-orange" />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Dano Máximo (Motor)</span>
                  <span className="font-display text-lg font-bold text-destructive">{localConfig.collisionMaxDamage}%</span>
                </label>
                <input type="range" min={1} max={80} value={localConfig.collisionMaxDamage} onChange={(e) => updateConfig("collisionMaxDamage", Number(e.target.value))} className="w-full accent-destructive" />
              </div>
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Perda de Durabilidade</span>
                  <span className="font-display text-lg font-bold text-amber-400">{localConfig.collisionDurabilityLoss}</span>
                </label>
                <input type="range" min={0} max={20} value={localConfig.collisionDurabilityLoss} onChange={(e) => updateConfig("collisionDurabilityLoss", Number(e.target.value))} className="w-full accent-amber-400" />
              </div>
              <button onClick={handleSaveConfig} disabled={!configDirty || saving} className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border/20 bg-card/20 p-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Simulação</h3>
              <p className="font-body text-xs text-muted-foreground">
                Com {localConfig.collisionChancePercent}% de chance, em 10 corridas um piloto sofrerá em média{" "}
                <span className="text-foreground font-bold">{(localConfig.collisionChancePercent / 10).toFixed(1)} colisões</span>,
                com dano de motor entre <span className="text-neon-orange font-bold">{localConfig.collisionMinDamage}%</span> e{" "}
                <span className="text-destructive font-bold">{localConfig.collisionMaxDamage}%</span> e perda de{" "}
                <span className="text-amber-400 font-bold">{localConfig.collisionDurabilityLoss}</span> de durabilidade por colisão.
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══ MARKETPLACE ═══ */}
        {tab === "marketplace" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Controle do Marketplace
              </h2>
              <button onClick={loadMarketplaceCars} className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs text-primary hover:bg-primary/20">
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            </div>
            <p className="font-body text-xs text-muted-foreground">
              Controle estoque, preço e disponibilidade de cada carro. Carros com estoque 0 aparecem como "Esgotado" para os jogadores.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketplaceCars.map((car) => {
                const isEditing = editingCar === car.id;
                return (
                  <div
                    key={car.id}
                    className={`relative overflow-hidden rounded-2xl border transition-all ${
                      car.sale_active && car.stock > 0 ? "border-neon-green/40 bg-neon-green/5" : car.sale_active ? "border-neon-orange/40 bg-neon-orange/5" : "border-border/20 bg-card/30 opacity-60"
                    }`}
                  >
                    {/* Car image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={CAR_IMAGES[car.image_key] || carThunder}
                        alt={car.name}
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <div className={`absolute top-3 right-3 rounded-full px-2.5 py-1 font-display text-[10px] font-bold ${
                        car.sale_active && car.stock > 0 ? "bg-neon-green/20 text-neon-green" : car.sale_active ? "bg-neon-orange/20 text-neon-orange" : "bg-destructive/20 text-destructive"
                      }`}>
                        {!car.sale_active ? "DESATIVADO" : car.stock <= 0 ? "ESGOTADO" : "À VENDA"}
                      </div>
                      {/* Stock badge */}
                      <div className="absolute top-3 left-3 rounded-full bg-card/80 px-2.5 py-1 backdrop-blur-sm font-display text-[10px] font-bold text-foreground">
                        📦 {car.stock} un.
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display text-sm font-bold text-foreground">{car.name}</h3>
                        <span className="font-display text-xs text-neon-orange font-bold">{car.price} NP</span>
                      </div>
                      <div className="flex gap-3 text-[10px] font-body text-muted-foreground mb-3">
                        <span>SPD: {car.speed_base}</span>
                        <span>ACC: {car.acceleration_base}</span>
                        <span>HDL: {car.handling_base}</span>
                        <span>DUR: {car.durability}</span>
                      </div>

                      {/* Edit stock & price */}
                      {isEditing ? (
                        <div className="space-y-3 rounded-xl border border-primary/20 bg-card/50 p-3 mb-3">
                          <div>
                            <label className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Estoque</label>
                            <input
                              type="number"
                              min={0}
                              value={editStock}
                              onChange={(e) => setEditStock(Math.max(0, Number(e.target.value)))}
                              className="mt-1 w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 font-display text-sm text-foreground focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Preço (NP)</label>
                            <input
                              type="number"
                              min={1}
                              value={editPrice}
                              onChange={(e) => setEditPrice(Math.max(1, Number(e.target.value)))}
                              className="mt-1 w-full rounded-lg border border-border/30 bg-background/50 px-3 py-2 font-display text-sm text-foreground focus:border-primary/50 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveCarEdit(car)}
                              disabled={savingCar}
                              className="flex-1 rounded-lg bg-primary py-2 font-display text-[10px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {savingCar ? "Salvando..." : "Salvar"}
                            </button>
                            <button
                              onClick={() => setEditingCar(null)}
                              className="rounded-lg border border-border/30 px-3 py-2 font-display text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/20"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditCar(car)}
                          className="mb-3 w-full rounded-lg border border-primary/20 bg-primary/5 py-2 font-display text-[10px] uppercase tracking-wider text-primary hover:bg-primary/10"
                        >
                          ✏️ Editar Estoque & Valor
                        </button>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground capitalize">
                          {car.rarity} · {car.model}
                        </span>
                        <button
                          onClick={() => toggleCarSale(car)}
                          disabled={togglingCar === car.id}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            car.sale_active ? "bg-neon-green/30" : "bg-muted/30"
                          }`}
                        >
                          <div className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                            car.sale_active ? "left-8 bg-neon-green" : "left-1 bg-muted-foreground"
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {marketplaceCars.length === 0 && (
              <div className="py-12 text-center text-muted-foreground font-body text-sm">
                Nenhum carro cadastrado no marketplace.
              </div>
            )}
          </motion.div>
        )}

        {/* ── BRANDING TAB ── */}
        {tab === "branding" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-foreground">🎨 Branding do Site</h2>
            <p className="font-body text-sm text-muted-foreground">
              Faça upload da logo e do favicon do site. As imagens serão aplicadas dinamicamente em toda a plataforma.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo Upload */}
              <div className="rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Logo</h3>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  PNG transparente recomendado · Aparece na landing page e navbar
                </p>
                {siteAssets.logoUrl && (
                  <div className="mb-4 rounded-xl border border-border/20 bg-background/50 p-4 flex items-center justify-center">
                    <img src={siteAssets.logoUrl} alt="Logo atual" className="h-20 w-auto max-w-full mix-blend-screen" />
                  </div>
                )}
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-6 transition-all hover:border-primary/60 hover:bg-primary/10 ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                  <Image className="h-5 w-5 text-primary" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                    {uploadingLogo ? "Enviando..." : "Selecionar Logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload(file, "logo");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Favicon Upload */}
              <div className="rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-neon-orange" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Favicon</h3>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  ICO, PNG ou SVG · 32x32 ou 64x64px recomendado · Ícone da aba do navegador
                </p>
                {siteAssets.faviconUrl && (
                  <div className="mb-4 rounded-xl border border-border/20 bg-background/50 p-4 flex items-center justify-center gap-4">
                    <img src={siteAssets.faviconUrl} alt="Favicon atual" className="h-8 w-8" />
                    <img src={siteAssets.faviconUrl} alt="Favicon atual" className="h-16 w-16" />
                  </div>
                )}
                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neon-orange/30 bg-neon-orange/5 px-4 py-6 transition-all hover:border-neon-orange/60 hover:bg-neon-orange/10 ${uploadingFavicon ? "opacity-50 pointer-events-none" : ""}`}>
                  <Image className="h-5 w-5 text-neon-orange" />
                  <span className="font-display text-xs font-bold uppercase tracking-wider text-neon-orange">
                    {uploadingFavicon ? "Enviando..." : "Selecionar Favicon"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAssetUpload(file, "favicon");
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Player Detail Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetailModal player={selectedPlayer} onClose={clearSelectedPlayer} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
