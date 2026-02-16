import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  User, Coins, Camera, Pencil, Lock, Wrench,
  Gauge, Zap, Shield, Wind, Droplets, AlertTriangle, CheckCircle,
  Loader2, Settings, ChevronDown, ChevronUp, Star
} from "lucide-react";
import MainNav from "@/components/MainNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { supabase, getWalletClient } from "@/lib/supabase";
import { needsOilChange, kmSinceOilChange } from "@/lib/gameState";
import { toast } from "@/hooks/use-toast";

// ─── Avatar Component ───
const PilotAvatar = ({
  avatarUrl,
  username,
  onUpload,
  uploading,
}: {
  avatarUrl: string | null;
  username: string;
  onUpload: (file: File) => void;
  uploading: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative group">
      <div className="h-28 w-28 rounded-full border-2 border-primary/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_hsl(185_80%_55%/0.2)]">
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <User className="h-12 w-12 text-primary/60" />
          </div>
        )}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </div>
  );
};

// ─── Workshop Car Card ───
const WorkshopCar = ({
  car,
  onRepair,
  onOilChange,
  repairing,
  changingOil,
  balance,
}: {
  car: any;
  onRepair: () => void;
  onOilChange: () => void;
  repairing: boolean;
  changingOil: boolean;
  balance: number;
}) => {
  const oilNeeded = needsOilChange(car);
  const kmSinceOil = kmSinceOilChange(car);
  const repairCost = 50 + car.level * 10;
  const oilCost = 30 + car.level * 5;
  const engineCritical = car.engineHealth < 30;
  const engineWarn = car.engineHealth < 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">{car.name}</h3>
          <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
            Token {car.tokenId} · Nível {car.level}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-neon-orange" />
          <span className="font-display text-xs font-bold text-foreground">Lv.{car.level}</span>
        </div>
      </div>

      {/* Engine Health */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Motor</span>
          <span className={`font-display text-xs font-bold ${engineCritical ? "text-destructive animate-pulse" : engineWarn ? "text-neon-orange" : "text-neon-green"}`}>
            {car.engineHealth}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${car.engineHealth}%` }}
            className={`h-full rounded-full ${engineCritical ? "bg-destructive" : engineWarn ? "bg-neon-orange" : "bg-neon-green"}`}
          />
        </div>
      </div>

      {/* Durability */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Durabilidade</span>
          <span className={`font-display text-xs font-bold ${car.durability < 30 ? "text-destructive" : car.durability < 50 ? "text-neon-orange" : "text-foreground"}`}>
            {car.durability}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${car.durability}%` }}
            className={`h-full rounded-full ${car.durability < 30 ? "bg-destructive" : car.durability < 50 ? "bg-neon-orange" : "bg-primary"}`}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="h-3 w-3 text-primary" /> Vel: {car.speed}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-3 w-3 text-accent" /> Acel: {car.acceleration}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Wind className="h-3 w-3 text-neon-green" /> Hand: {car.handling}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          🛣️ {Math.round(car.totalKm)} km
        </div>
      </div>

      {/* Oil Status */}
      <div className={`rounded-lg px-3 py-2 ${oilNeeded ? "bg-destructive/10 border border-destructive/20" : "bg-neon-green/5 border border-neon-green/10"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className={`h-3.5 w-3.5 ${oilNeeded ? "text-destructive animate-pulse" : "text-neon-green"}`} />
            <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
              Óleo: {kmSinceOil}/100 km
            </span>
          </div>
          {oilNeeded && (
            <span className="font-display text-[9px] font-bold uppercase text-destructive animate-pulse">⚠️ TROCAR</span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {engineCritical && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-display text-[10px] uppercase tracking-wider text-destructive">
            Motor crítico! Risco de fundir se continuar correndo.
          </span>
        </div>
      )}

      {/* NPC Mechanic Message */}
      {(engineCritical || oilNeeded || car.durability < 50) && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-lg shrink-0">
              🔧
            </div>
            <div>
              <p className="font-display text-xs font-bold text-primary">Mecânico Raul diz:</p>
              <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                {engineCritical
                  ? '"Esse motor tá pra fundir, parceiro! Traga pra revisão urgente antes que vire sucata!"'
                  : oilNeeded
                  ? '"Óleo tá vencido. Se continuar assim, o desgaste vai triplicar. Troca logo!"'
                  : '"A lataria tá sofrendo. Uma revisão agora evita dor de cabeça depois."'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          disabled={car.engineHealth >= 100 && car.durability >= 100 || balance < repairCost || repairing}
          onClick={onRepair}
          className="h-10 bg-neon-green/20 text-neon-green border border-neon-green/20 hover:bg-neon-green/30 font-display text-[10px] uppercase tracking-wider disabled:opacity-40"
        >
          {repairing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wrench className="mr-1 h-3 w-3" />}
          Revisão ({repairCost} NP)
        </Button>
        <Button
          size="sm"
          disabled={!oilNeeded || balance < oilCost || changingOil}
          onClick={onOilChange}
          className="h-10 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 font-display text-[10px] uppercase tracking-wider disabled:opacity-40"
        >
          {changingOil ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Droplets className="mr-1 h-3 w-3" />}
          Trocar Óleo ({oilCost} NP)
        </Button>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════
//              PROFILE PAGE
// ═══════════════════════════════════════════
const Profile = () => {
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const { state, selectedCar, repair, oilChange, loading } = useGameState();

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [workshopOpen, setWorkshopOpen] = useState(true);
  const [repairingCar, setRepairingCar] = useState<string | null>(null);
  const [oilChangingCar, setOilChangingCar] = useState<string | null>(null);

  // Load avatar
  useEffect(() => {
    if (!user) return;
    setAvatarUrl(user.walletAddress ? null : null);
    // Fetch avatar_url from users table
    supabase
      .from("users")
      .select("avatar_url")
      .eq("wallet_address", user.walletAddress)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const handleUploadAvatar = useCallback(
    async (file: File) => {
      if (!user || !session) return;
      setUploadingAvatar(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filePath = `${user.walletAddress}/avatar.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true, contentType: file.type });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl + "?t=" + Date.now();

        // Save URL to user profile
        const wc = getWalletClient(user.walletAddress);
        await wc
          .from("users")
          .update({ avatar_url: publicUrl })
          .eq("wallet_address", user.walletAddress);

        setAvatarUrl(publicUrl);
        toast({ title: "✅ Avatar atualizado!" });
      } catch (err: any) {
        toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      } finally {
        setUploadingAvatar(false);
      }
    },
    [user, session]
  );

  const handleSaveName = useCallback(async () => {
    if (!user || !newName.trim()) return;
    setSavingName(true);
    try {
      const wc = getWalletClient(user.walletAddress);
      const { error } = await wc
        .from("users")
        .update({ username: newName.trim() })
        .eq("wallet_address", user.walletAddress);
      if (error) throw error;
      toast({ title: "✅ Nome atualizado para " + newName.trim() });
      setEditingName(false);
      // Force reload to update header
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }, [user, newName]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "✅ Senha alterada com sucesso!" });
      setEditingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  const handleRepair = useCallback(
    (carId: string) => {
      setRepairingCar(carId);
      const car = state.cars.find((c) => c.id === carId);
      if (!car) return;
      const cost = 50 + car.level * 10;
      const success = repair(cost);
      setTimeout(() => {
        setRepairingCar(null);
        if (success) toast({ title: "🔧 Revisão completa!", description: "Motor e durabilidade restaurados." });
        else toast({ title: "Saldo insuficiente", variant: "destructive" });
      }, 800);
    },
    [state, repair]
  );

  const handleOilChange = useCallback(
    (carId: string) => {
      setOilChangingCar(carId);
      const car = state.cars.find((c) => c.id === carId);
      if (!car) return;
      const cost = 30 + car.level * 5;
      const success = oilChange(cost);
      setTimeout(() => {
        setOilChangingCar(null);
        if (success) toast({ title: "🛢️ Óleo trocado!", description: "Ciclo de manutenção resetado." });
        else toast({ title: "Saldo insuficiente", variant: "destructive" });
      }, 800);
    },
    [state, oilChange]
  );

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <MainNav nitroPoints={state.nitroPoints} />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-8 space-y-6">
        {/* ─── Profile Card ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl p-6"
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <PilotAvatar
              avatarUrl={avatarUrl}
              username={user.username}
              onUpload={handleUploadAvatar}
              uploading={uploadingAvatar}
            />
            <div className="flex-1 text-center sm:text-left space-y-3">
              {/* Username */}
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Novo nome de piloto"
                      className="h-9 max-w-[200px] bg-card/60 border-border/30 font-display text-sm"
                      maxLength={20}
                    />
                    <Button size="sm" onClick={handleSaveName} disabled={savingName || !newName.trim()} className="h-9 bg-primary text-primary-foreground font-display text-[10px] uppercase">
                      {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingName(false)} className="h-9 font-display text-[10px]">
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <h2 className="font-display text-xl font-black text-foreground">{user.username}</h2>
                    <button
                      onClick={() => { setNewName(user.username); setEditingName(true); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/30 transition-colors hover:bg-muted/50"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email & Wallet */}
              <div className="space-y-1">
                <p className="font-body text-xs text-muted-foreground">📧 {user.email}</p>
                <p className="font-body text-xs text-muted-foreground font-mono">🔑 {user.walletAddress}</p>
              </div>

              {/* Stats Summary */}
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <div className="rounded-lg bg-neon-orange/10 border border-neon-orange/20 px-3 py-1.5">
                  <span className="font-display text-[10px] uppercase tracking-wider text-neon-orange">
                    💰 {state.nitroPoints.toLocaleString()} NP
                  </span>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5">
                  <span className="font-display text-[10px] uppercase tracking-wider text-primary">
                    🏎️ {state.cars.length} {state.cars.length === 1 ? "carro" : "carros"}
                  </span>
                </div>
                <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5">
                  <span className="font-display text-[10px] uppercase tracking-wider text-accent">
                    ⛽ {state.fuelTanks} corridas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="mt-6 border-t border-border/20 pt-4">
            {editingPassword ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Alterar Senha</h3>
                <div className="flex flex-col gap-2 max-w-sm">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mín. 6 caracteres)"
                    className="h-9 bg-card/60 border-border/30 font-body text-sm"
                  />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar nova senha"
                    className="h-9 bg-card/60 border-border/30 font-body text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleChangePassword} disabled={savingPassword} className="h-9 bg-primary text-primary-foreground font-display text-[10px] uppercase">
                      {savingPassword ? <Loader2 className="h-3 w-3 animate-spin" /> : "Alterar Senha"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingPassword(false); setNewPassword(""); setConfirmPassword(""); }} className="h-9 font-display text-[10px]">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setEditingPassword(true)}
                className="flex items-center gap-2 rounded-lg bg-muted/20 px-4 py-2.5 transition-colors hover:bg-muted/30"
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Alterar Senha</span>
              </button>
            )}
          </div>
        </motion.section>

        {/* ─── Workshop / Oficina ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={() => setWorkshopOpen(!workshopOpen)}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-neon-orange/20 bg-card/30 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-card/50"
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-neon-orange" />
              <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                Oficina Mecânica
              </span>
              <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                ({state.cars.length} {state.cars.length === 1 ? "veículo" : "veículos"})
              </span>
            </div>
            {workshopOpen ? <ChevronUp className="h-4 w-4 text-neon-orange" /> : <ChevronDown className="h-4 w-4 text-neon-orange" />}
          </button>

          <AnimatePresence>
            {workshopOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* NPC Mechanic Banner */}
                <div className="rounded-2xl border border-neon-orange/20 bg-gradient-to-r from-neon-orange/5 to-transparent p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-orange/20 text-2xl shrink-0">
                      🧑‍🔧
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-neon-orange">Mecânico Raul</h3>
                      <p className="font-body text-xs text-muted-foreground mt-1">
                        "E aí, piloto! Traga seus carros pra oficina. Revisão completa restaura motor e durabilidade. 
                        Não esquece da troca de óleo a cada 100 km — senão o motor sofre 1.5x mais desgaste por corrida!"
                      </p>
                    </div>
                  </div>
                </div>

                {state.cars.length === 0 ? (
                  <div className="rounded-xl border border-border/20 bg-card/20 p-8 text-center">
                    <p className="font-display text-sm text-muted-foreground">Nenhum carro na garagem</p>
                    <Button size="sm" onClick={() => navigate("/marketplace")} className="mt-3 bg-primary text-primary-foreground font-display text-[10px] uppercase">
                      Ir ao Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {state.cars.map((car) => (
                      <WorkshopCar
                        key={car.id}
                        car={car}
                        onRepair={() => handleRepair(car.id)}
                        onOilChange={() => handleOilChange(car.id)}
                        repairing={repairingCar === car.id}
                        changingOil={oilChangingCar === car.id}
                        balance={state.nitroPoints}
                      />
                    ))}
                  </div>
                )}

                {/* Maintenance Tips */}
                <div className="rounded-xl border border-border/20 bg-card/20 p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    💡 Dicas de Manutenção
                  </h4>
                  <ul className="space-y-1.5 text-[11px] font-body text-muted-foreground">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 text-neon-green mt-0.5 shrink-0" />
                      Troque o óleo a cada 100 km para evitar 1.5x de desgaste no motor.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 text-neon-green mt-0.5 shrink-0" />
                      Alta durabilidade reduz o desgaste do motor em até 60%.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-neon-orange mt-0.5 shrink-0" />
                      Motor abaixo de 50% causa perda drástica de performance na corrida.
                    </li>
                    <li className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      Motor abaixo de 30% = risco de fundir! Faça revisão urgente.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>
    </div>
  );
};

export default Profile;
