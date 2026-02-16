import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Settings, RefreshCw, ArrowLeft, AlertTriangle, Save, Car, Coins, Trophy, Flame } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading, players, collisionConfig, saveCollisionConfig, saving, refreshPlayers } = useAdmin();

  const [localConfig, setLocalConfig] = useState(collisionConfig);
  const [configDirty, setConfigDirty] = useState(false);
  const [tab, setTab] = useState<"players" | "collision">("players");

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
        <button
          onClick={() => navigate("/garage")}
          className="mt-4 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/30 backdrop-blur-xl px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/garage")} className="rounded-lg p-2 hover:bg-muted/30 transition-colors">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-black uppercase tracking-widest text-primary">
                Admin Panel
              </h1>
            </div>
          </div>
          <span className="rounded-full bg-primary/20 px-3 py-1 font-display text-xs font-bold text-primary">
            🔒 Administrador
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/20 bg-card/20 px-4 sm:px-8">
        <div className="flex gap-1">
          {[
            { id: "players" as const, label: "Pilotos", icon: <Users className="h-4 w-4" /> },
            { id: "collision" as const, label: "Colisão", icon: <Settings className="h-4 w-4" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 font-display text-xs uppercase tracking-wider transition-colors border-b-2 ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-6 sm:px-8">
        {tab === "players" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Pilotos Cadastrados ({players.length})
              </h2>
              <button
                onClick={refreshPlayers}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 font-display text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Piloto</th>
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Wallet</th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">
                      <Coins className="h-3.5 w-3.5 inline mr-1" />NP
                    </th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">
                      <Car className="h-3.5 w-3.5 inline mr-1" />Carros
                    </th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">
                      <Trophy className="h-3.5 w-3.5 inline mr-1" />W/L
                    </th>
                    <th className="px-4 py-3 text-center font-display text-xs uppercase tracking-wider text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 inline mr-1" />Corridas
                    </th>
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-muted-foreground">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-display text-sm text-foreground">
                        {p.username || "Sem nome"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.walletAddress.slice(0, 8)}...{p.walletAddress.slice(-4)}
                      </td>
                      <td className="px-4 py-3 text-center font-display text-sm text-neon-orange font-bold">
                        {p.nitroPoints.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center font-display text-sm text-foreground">
                        {p.carsCount}
                      </td>
                      <td className="px-4 py-3 text-center font-display text-xs">
                        <span className="text-neon-green">{p.totalWins}W</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-destructive">{p.totalLosses}L</span>
                      </td>
                      <td className="px-4 py-3 text-center font-display text-sm text-foreground">
                        {p.totalRaces}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum piloto cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "collision" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground mb-4">
              Configuração de Colisão
            </h2>
            <p className="font-body text-xs text-muted-foreground mb-6">
              Ajuste a chance e intensidade das colisões durante as corridas. Essas configurações afetam todos os jogadores em tempo real.
            </p>

            <div className="space-y-6 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-6">
              {/* Chance % */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Chance de Colisão</span>
                  <span className="font-display text-lg font-bold text-primary">{localConfig.collisionChancePercent}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={localConfig.collisionChancePercent}
                  onChange={(e) => updateConfig("collisionChancePercent", Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0% (sem colisão)</span>
                  <span>100% (sempre)</span>
                </div>
              </div>

              {/* Min damage */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Dano Mínimo (Motor)</span>
                  <span className="font-display text-lg font-bold text-neon-orange">{localConfig.collisionMinDamage}%</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={localConfig.collisionMinDamage}
                  onChange={(e) => updateConfig("collisionMinDamage", Number(e.target.value))}
                  className="w-full accent-neon-orange"
                />
              </div>

              {/* Max damage */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Dano Máximo (Motor)</span>
                  <span className="font-display text-lg font-bold text-destructive">{localConfig.collisionMaxDamage}%</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={localConfig.collisionMaxDamage}
                  onChange={(e) => updateConfig("collisionMaxDamage", Number(e.target.value))}
                  className="w-full accent-destructive"
                />
              </div>

              {/* Durability loss */}
              <div>
                <label className="flex items-center justify-between mb-2">
                  <span className="font-display text-xs uppercase tracking-wider text-foreground">Perda de Durabilidade</span>
                  <span className="font-display text-lg font-bold text-amber-400">{localConfig.collisionDurabilityLoss}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={localConfig.collisionDurabilityLoss}
                  onChange={(e) => updateConfig("collisionDurabilityLoss", Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSaveConfig}
                disabled={!configDirty || saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>

            {/* Preview */}
            <div className="mt-6 rounded-xl border border-border/20 bg-card/20 p-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Simulação
              </h3>
              <p className="font-body text-xs text-muted-foreground">
                Com {localConfig.collisionChancePercent}% de chance, em 10 corridas um piloto sofrerá em média{" "}
                <span className="text-foreground font-bold">
                  {(localConfig.collisionChancePercent / 10).toFixed(1)} colisões
                </span>
                , com dano de motor entre{" "}
                <span className="text-neon-orange font-bold">{localConfig.collisionMinDamage}%</span> e{" "}
                <span className="text-destructive font-bold">{localConfig.collisionMaxDamage}%</span>
                {" "}e perda de <span className="text-amber-400 font-bold">{localConfig.collisionDurabilityLoss}</span> de durabilidade por colisão.
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Admin;
