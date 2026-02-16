import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase, getWalletClient } from "@/lib/supabase";
import { formatNP } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Trophy, Clock, Coins, Star, Lock, ArrowDownToLine,
  Loader2, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MainNav from "@/components/MainNav";
import { format } from "date-fns";

interface RaceReward {
  id: string;
  victory: boolean;
  np_earned: number;
  xp_earned: number;
  tokens_earned: number;
  position: number;
  collisions: number;
  car_name: string;
  created_at: string;
}

interface WithdrawalConfig {
  token_name: string;
  withdrawals_enabled: boolean;
  unlock_date: string | null;
  min_withdrawal: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  token_name: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const Rewards = () => {
  const { user, session } = useAuth();
  const [rewards, setRewards] = useState<RaceReward[]>([]);
  const [config, setConfig] = useState<WithdrawalConfig | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.walletAddress) return;
    const wc = getWalletClient(user.walletAddress);

    const [rewardsRes, configRes, withdrawalsRes, userRes] = await Promise.all([
      wc.from("race_rewards").select("*").eq("wallet_address", user.walletAddress).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawal_config").select("*").eq("id", "default").maybeSingle(),
      wc.from("withdrawal_requests").select("*").eq("wallet_address", user.walletAddress).order("created_at", { ascending: false }).limit(20),
      supabase.from("users").select("nitro_points, token_balance").eq("wallet_address", user.walletAddress).maybeSingle(),
    ]);

    setRewards((rewardsRes.data as RaceReward[]) ?? []);
    setConfig((configRes.data as WithdrawalConfig) ?? null);
    setWithdrawals((withdrawalsRes.data as WithdrawalRequest[]) ?? []);
    setTokenBalance(Number(userRes.data?.token_balance ?? 0));
    setUserBalance(userRes.data?.nitro_points ?? 0);
    setLoading(false);
  }, [user?.walletAddress]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalNP = rewards.reduce((sum, r) => sum + r.np_earned, 0);
  const totalXP = rewards.reduce((sum, r) => sum + r.xp_earned, 0);
  const totalTokens = rewards.reduce((sum, r) => sum + Number(r.tokens_earned), 0);
  const wins = rewards.filter(r => r.victory).length;
  const winRate = rewards.length > 0 ? Math.round((wins / rewards.length) * 100) : 0;

  const canWithdraw = config?.withdrawals_enabled && (!config.unlock_date || new Date(config.unlock_date) <= new Date());

  const handleWithdraw = async () => {
    if (!user?.walletAddress || !withdrawAmount) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    if (config && amount < config.min_withdrawal) {
      toast({ title: `Mínimo: ${config.min_withdrawal} ${config.token_name}`, variant: "destructive" });
      return;
    }
    if (amount > tokenBalance) {
      toast({ title: "Saldo insuficiente", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const wc = getWalletClient(user.walletAddress);
      const { error } = await wc.from("withdrawal_requests").insert({
        wallet_address: user.walletAddress,
        amount,
        token_name: config?.token_name ?? "KLEIN",
      });
      if (error) throw error;
      toast({ title: "✅ Solicitação de saque enviada!", description: "Aguarde aprovação do administrador." });
      setWithdrawAmount("");
      setShowWithdraw(false);
      loadData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MainNav />
        <div className="flex items-center justify-center py-32">
          <p className="font-display text-sm text-muted-foreground">Faça login para ver suas recompensas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainNav nitroPoints={userBalance} />

      <div className="mx-auto max-w-5xl px-3 pt-3 sm:px-8 sm:pt-6">
        <h1 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-foreground">
          🏆 Recompensas
        </h1>
        <p className="font-display text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          Histórico de corridas e tokens acumulados
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total NP", value: formatNP(totalNP), icon: <Coins className="h-4 w-4" />, color: "text-neon-orange" },
                { label: "Total XP", value: totalXP.toLocaleString(), icon: <Star className="h-4 w-4" />, color: "text-neon-green" },
                { label: `${config?.token_name ?? "KLEIN"} Acumulado`, value: totalTokens.toLocaleString(), icon: <Trophy className="h-4 w-4" />, color: "text-primary" },
                { label: "Taxa de Vitória", value: `${winRate}%`, icon: <Trophy className="h-4 w-4" />, color: "text-accent" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-border/20 bg-card/30 p-3 backdrop-blur-sm">
                  <div className={`flex items-center gap-1.5 ${card.color}`}>
                    {card.icon}
                    <span className="font-display text-[10px] uppercase tracking-wider">{card.label}</span>
                  </div>
                  <p className="mt-1 font-display text-lg font-black text-foreground">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Token Balance + Withdrawal */}
            <div className="mt-4 rounded-2xl border border-primary/20 bg-card/40 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <span className="font-display text-sm font-bold text-foreground">
                      Saldo {config?.token_name ?? "KLEIN"}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-2xl font-black text-primary">
                    {tokenBalance.toLocaleString()} <span className="text-sm text-muted-foreground">{config?.token_name ?? "KLEIN"}</span>
                  </p>
                </div>
                <div className="text-right">
                  {!canWithdraw ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 rounded-full bg-neon-orange/20 px-3 py-1">
                        <Lock className="h-3 w-3 text-neon-orange" />
                        <span className="font-display text-[10px] font-bold uppercase text-neon-orange">Travado</span>
                      </div>
                      {config?.unlock_date ? (
                        <span className="font-body text-[10px] text-muted-foreground">
                          Liberação: {format(new Date(config.unlock_date), "dd/MM/yyyy")}
                        </span>
                      ) : (
                        <span className="font-body text-[10px] text-muted-foreground">
                          Data a definir pelo admin
                        </span>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowWithdraw(!showWithdraw)}
                      className="rounded-lg bg-neon-green px-4 font-display text-[10px] uppercase tracking-wider text-background hover:bg-neon-green/90"
                    >
                      <ArrowDownToLine className="mr-1 h-3 w-3" />
                      Sacar
                    </Button>
                  )}
                </div>
              </div>

              {/* Withdraw Form */}
              <AnimatePresence>
                {showWithdraw && canWithdraw && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-border/20 pt-4 space-y-3">
                      <div>
                        <label className="font-display text-xs text-muted-foreground uppercase tracking-wider">
                          Quantidade ({config?.token_name})
                        </label>
                        <input
                          type="number"
                          min={config?.min_withdrawal ?? 100}
                          max={tokenBalance}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder={`Mín: ${config?.min_withdrawal ?? 100}`}
                          className="mt-1 h-10 w-full rounded-xl border border-border/20 bg-card/30 px-4 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button
                          disabled={submitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                          onClick={handleWithdraw}
                          className="flex-1 bg-neon-green text-background hover:bg-neon-green/90"
                        >
                          {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ArrowDownToLine className="mr-1 h-4 w-4" />}
                          Confirmar Saque
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Withdrawal History */}
              {withdrawals.length > 0 && (
                <div className="mt-4 border-t border-border/20 pt-3">
                  <h4 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Histórico de Saques
                  </h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {withdrawals.map(w => (
                      <div key={w.id} className="flex items-center justify-between text-[11px] font-body">
                        <div className="flex items-center gap-2">
                          {w.status === "completed" ? <CheckCircle className="h-3 w-3 text-neon-green" /> :
                           w.status === "rejected" ? <XCircle className="h-3 w-3 text-destructive" /> :
                           <Clock className="h-3 w-3 text-neon-orange" />}
                          <span className="text-foreground">{Number(w.amount).toLocaleString()} {w.token_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className={`font-display text-[10px] uppercase ${
                            w.status === "completed" ? "text-neon-green" :
                            w.status === "rejected" ? "text-destructive" :
                            "text-neon-orange"
                          }`}>{w.status === "pending" ? "Pendente" : w.status === "approved" ? "Aprovado" : w.status === "completed" ? "Concluído" : "Rejeitado"}</span>
                          <span>{format(new Date(w.created_at), "dd/MM")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Race History Table */}
            <div className="mt-4 mb-8">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                📊 Histórico de Corridas ({rewards.length})
              </h3>

              {rewards.length === 0 ? (
                <div className="rounded-xl border border-border/20 bg-card/20 p-8 text-center">
                  <p className="text-4xl mb-2">🏎️</p>
                  <p className="font-display text-sm text-muted-foreground">Nenhuma corrida registrada ainda.</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">Corra para acumular tokens!</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/20">
                        {["Resultado", "Carro", "NP", "XP", "Tokens", "Posição", "Colisões", "Data"].map(h => (
                          <th key={h} className="px-3 py-2.5 font-display text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((r) => (
                        <tr key={r.id} className="border-b border-border/10 hover:bg-card/30 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase ${
                              r.victory ? "bg-neon-green/20 text-neon-green" : "bg-destructive/20 text-destructive"
                            }`}>
                              {r.victory ? "🏆 Vitória" : "💀 Derrota"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs text-foreground whitespace-nowrap">
                            {r.car_name}
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs font-bold text-neon-orange">
                            +{formatNP(r.np_earned)}
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs font-bold text-neon-green">
                            +{r.xp_earned}
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs font-bold text-primary">
                            +{Number(r.tokens_earned).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs text-foreground text-center">
                            {r.position}º
                          </td>
                          <td className="px-3 py-2.5 font-display text-xs text-center">
                            {r.collisions > 0 ? (
                              <span className="text-destructive">💥 {r.collisions}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-body text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(r.created_at), "dd/MM HH:mm")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Rewards;
