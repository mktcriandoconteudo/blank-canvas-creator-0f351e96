import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Coins, Sparkles, Zap, Crown, Star, Loader2,
  Check, Copy, X, QrCode, ShieldCheck
} from "lucide-react";
import MainNav from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { supabase, getWalletClient } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { formatNP } from "@/lib/utils";

interface NpPackage {
  id: string;
  name: string;
  np_amount: number;
  price_brl: number;
  bonus_percent: number;
  sort_order: number;
}

const PACKAGE_STYLES: Record<string, { gradient: string; icon: React.ReactNode; glow: string }> = {
  Starter: {
    gradient: "from-muted/40 to-muted/20",
    icon: <Coins className="h-6 w-6" />,
    glow: "",
  },
  Popular: {
    gradient: "from-primary/30 to-primary/10",
    icon: <Zap className="h-6 w-6" />,
    glow: "shadow-[0_0_30px_hsl(185_80%_55%/0.15)]",
  },
  Pro: {
    gradient: "from-accent/30 to-accent/10",
    icon: <Star className="h-6 w-6" />,
    glow: "shadow-[0_0_30px_hsl(280_80%_60%/0.15)]",
  },
  Elite: {
    gradient: "from-neon-orange/30 to-neon-orange/10",
    icon: <Crown className="h-6 w-6" />,
    glow: "shadow-[0_0_40px_hsl(25_95%_55%/0.2)]",
  },
  Whale: {
    gradient: "from-neon-green/30 to-neon-green/10",
    icon: <Sparkles className="h-6 w-6" />,
    glow: "shadow-[0_0_50px_hsl(145_80%_45%/0.2)]",
  },
};

// Fake PIX code generator
const generatePixCode = (amount: number) => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "00020126580014br.gov.bcb.pix0136";
  for (let i = 0; i < 36; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += `5204000053039865404${amount.toFixed(2)}5802BR`;
  return code;
};

const Store = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { state } = useGameState();
  const [packages, setPackages] = useState<NpPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<NpPackage | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load packages
  useEffect(() => {
    supabase
      .from("np_packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setPackages(data);
        setLoadingPackages(false);
      });
  }, []);

  // Countdown timer for PIX simulation
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSelectPackage = useCallback(
    async (pkg: NpPackage) => {
      if (!user || !session) {
        navigate("/auth");
        return;
      }
      setSelectedPkg(pkg);
      setConfirmed(false);
      setPixCode(generatePixCode(pkg.price_brl));
      setCountdown(300); // 5 min simulated

      // Create purchase record (use authenticated client — RLS checks auth.uid())
      const { data, error } = await supabase
        .from("np_purchases")
        .insert({
          wallet_address: user.walletAddress,
          package_id: pkg.id,
          np_amount: pkg.np_amount + Math.floor(pkg.np_amount * pkg.bonus_percent / 100),
          price_brl: pkg.price_brl,
          pix_code: generatePixCode(pkg.price_brl),
          status: "pending",
        })
        .select("id")
        .single();

      if (data) setPurchaseId(data.id);
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        setSelectedPkg(null);
      }
    },
    [user, session, navigate]
  );

  const handleConfirmPayment = useCallback(async () => {
    if (!purchaseId || !user) return;
    setConfirming(true);
    try {
      // Mark purchase as "awaiting_approval" (use authenticated client — RLS checks auth.uid())
      const { error } = await supabase
        .from("np_purchases")
        .update({ status: "awaiting_approval" })
        .eq("id", purchaseId);

      if (error) throw error;

      setConfirmed(true);
      toast({
        title: "📩 Comprovante enviado!",
        description: "Aguarde a aprovação do administrador para receber seus NP.",
      });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  }, [purchaseId, user]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast({ title: "📋 Código PIX copiado!" });
  };

  const totalNp = (pkg: NpPackage) =>
    pkg.np_amount + Math.floor(pkg.np_amount * pkg.bonus_percent / 100);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainNav nitroPoints={session && state ? state.nitroPoints : undefined} />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-display text-[10px] uppercase tracking-widest text-primary">
              Loja de Nitro Points
            </span>
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
            Comprar <span className="text-primary">NP</span>
          </h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Adquira Nitro Points via PIX e turbine sua garagem
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-neon-orange/10 border border-neon-orange/20 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-neon-orange" />
            <span className="font-display text-[9px] uppercase tracking-wider text-neon-orange">
              Modo simulação — sem cobrança real
            </span>
          </div>
        </motion.div>

        {/* Packages Grid */}
        {loadingPackages ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => {
              const style = PACKAGE_STYLES[pkg.name] || PACKAGE_STYLES.Starter;
              const total = totalNp(pkg);
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`group relative rounded-2xl border border-border/30 bg-gradient-to-br ${style.gradient} backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40 ${style.glow}`}
                >
                  {pkg.bonus_percent > 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-neon-green/20 border border-neon-green/30 px-2 py-0.5">
                      <span className="font-display text-[9px] font-bold uppercase text-neon-green">
                        +{pkg.bonus_percent}% bônus
                      </span>
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {/* Icon & Name */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/40 text-primary backdrop-blur-sm border border-border/10">
                        {style.icon}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground">{pkg.name}</h3>
                        <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                          Pacote de NP
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="rounded-xl bg-card/30 border border-border/10 p-4 text-center backdrop-blur-sm">
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="h-5 w-5 text-neon-orange" />
                        <span className="font-display text-2xl font-black text-foreground">
                          {formatNP(total)}
                        </span>
                        <span className="font-display text-sm text-muted-foreground">NP</span>
                      </div>
                      {pkg.bonus_percent > 0 && (
                        <p className="mt-1 font-body text-[10px] text-neon-green">
                          {formatNP(pkg.np_amount)} + {formatNP(total - pkg.np_amount)} bônus
                        </p>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="space-y-2">
                      <div className="text-center">
                        <span className="font-display text-2xl font-black text-primary">
                          R$ {pkg.price_brl.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleSelectPackage(pkg)}
                        className="w-full h-11 bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider hover:brightness-110"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Pagar com PIX
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 rounded-2xl border border-border/20 bg-card/20 backdrop-blur-xl p-6"
        >
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Como funciona?
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { step: "1", title: "Escolha o pacote", desc: "Selecione a quantidade de NP que deseja" },
              { step: "2", title: "Pague via PIX", desc: "Copie o código PIX e faça a transferência" },
              { step: "3", title: "Aguarde aprovação", desc: "O admin confirma e seus NP são creditados" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <span className="font-display text-xs font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="font-display text-xs font-bold text-foreground">{item.title}</p>
                  <p className="font-body text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* ─── PIX Payment Modal ─── */}
      <AnimatePresence>
        {selectedPkg && !confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border/30 bg-card/90 backdrop-blur-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                    Pagamento PIX
                  </h3>
                </div>
                <button
                  onClick={() => { setSelectedPkg(null); setPurchaseId(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Package summary */}
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Pacote {selectedPkg.name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="h-5 w-5 text-neon-orange" />
                    <span className="font-display text-xl font-black text-foreground">
                      {formatNP(totalNp(selectedPkg))} NP
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-primary">
                    R$ {selectedPkg.price_brl.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Fake QR Code */}
                <div className="flex justify-center">
                  <div className="relative h-44 w-44 rounded-xl border-2 border-primary/20 bg-card/60 p-3">
                    {/* Simulated QR pattern */}
                    <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0.5 rounded-lg overflow-hidden">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-[1px] ${Math.random() > 0.4 ? "bg-foreground" : "bg-transparent"}`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-lg bg-background p-1.5">
                        <Coins className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer */}
                <div className="text-center">
                  <p className="font-body text-[10px] text-muted-foreground">Expira em</p>
                  <p className="font-display text-lg font-bold text-foreground">
                    {formatTime(countdown)}
                  </p>
                </div>

                {/* PIX Code (Copia e Cola) */}
                <div className="space-y-1.5">
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                    PIX Copia e Cola
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-card/60 border border-border/10 px-3 py-2 overflow-hidden">
                      <p className="font-mono text-[10px] text-muted-foreground truncate">
                        {pixCode}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPix}
                      className="shrink-0 h-9 px-3 font-display text-[10px] uppercase"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copiar
                    </Button>
                  </div>
                </div>

                {/* Send receipt button */}
                <Button
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="w-full h-12 bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 font-display text-xs uppercase tracking-wider"
                >
                  {confirming ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Já paguei — Enviar comprovante
                </Button>

                <p className="text-center font-body text-[9px] text-muted-foreground/60">
                  ⚠️ Ambiente de simulação — nenhuma cobrança real é efetuada
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Success Modal ─── */}
      <AnimatePresence>
        {confirmed && selectedPkg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-neon-green/30 bg-card/90 backdrop-blur-xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-green/20 border border-neon-green/30"
              >
                <Check className="h-8 w-8 text-neon-green" />
              </motion.div>
              <h3 className="font-display text-xl font-black text-foreground mb-2">
                Comprovante Enviado!
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Aguarde a aprovação do administrador. Seus {formatNP(totalNp(selectedPkg))} NP serão creditados após a confirmação.
              </p>
              <Button
                onClick={() => { setSelectedPkg(null); setConfirmed(false); }}
                className="bg-primary text-primary-foreground font-display text-xs uppercase tracking-wider"
              >
                Fechar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Store;
