import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import garageScene from "@/assets/garage-scene.jpg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate("/garage");
        }
      } else {
        if (!username.trim()) {
          setError("Digite um nome de piloto");
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, username.trim());
        if (error) {
          setError(error.message);
        } else {
          setSignupSuccess(true);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{ backgroundImage: `url(${garageScene})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-black uppercase tracking-widest text-primary text-glow-cyan">
              TurboNitro
            </h1>
            <p className="mt-1 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {isLogin ? "Entrar na Garagem" : "Criar Conta"}
            </p>
          </div>

          {signupSuccess ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-strong rounded-2xl p-6 text-center"
            >
              <UserPlus className="mx-auto mb-3 h-8 w-8 text-neon-green" />
              <h2 className="font-display text-lg font-bold text-foreground">Conta criada!</h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Verifique seu email para confirmar a conta, depois faça login.
              </p>
              <button
                onClick={() => { setIsLogin(true); setSignupSuccess(false); }}
                className="mt-4 w-full rounded-xl bg-primary/20 px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/30"
              >
                Ir para Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 space-y-4">
              {!isLogin && (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
                    <User className="h-3.5 w-3.5" /> Nome de Piloto
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: NitroKing"
                    maxLength={30}
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 font-body text-xs text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 glow-cyan"
              >
                {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {submitting ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  className="font-body text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Fazer login"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
