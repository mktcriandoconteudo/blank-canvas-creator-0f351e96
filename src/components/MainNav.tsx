import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Coins, User, LogOut, ShoppingCart, Home,
  Car, Shield, UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useSiteAssets } from "@/hooks/useSiteAssets";
import turboNitroLogo from "@/assets/turbonitro-logo.png";

interface MainNavProps {
  /** Optional: show NP balance */
  nitroPoints?: number;
  /** Optional: transparent/glass background (for pages with bg images like garage) */
  transparent?: boolean;
}

const NAV_LINKS = [
  { path: "/", label: "Home", icon: <Home className="h-4 w-4" /> },
  { path: "/garage", label: "Garagem", icon: <Car className="h-4 w-4" />, protected: true },
  { path: "/marketplace", label: "Marketplace", icon: <ShoppingCart className="h-4 w-4" /> },
  { path: "/perfil", label: "Perfil", icon: <UserCircle className="h-4 w-4" />, protected: true },
];

const MainNav = ({ nitroPoints, transparent = false }: MainNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { logoUrl } = useSiteAssets();

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.rpc("check_is_admin").then(({ data }) => setIsAdmin(data === true));
  }, [session]);

  const effectiveLogo = logoUrl || turboNitroLogo;

  const bgClass = transparent
    ? "bg-background/40 backdrop-blur-2xl"
    : "bg-background/80 backdrop-blur-2xl";

  const visibleLinks = NAV_LINKS.filter((l) => !l.protected || session);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 border-b border-border/10 ${bgClass}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-8">
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
          <img
            src={effectiveLogo}
            alt="TurboNitro"
            className="h-7 w-auto sm:h-9 mix-blend-screen"
          />
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/30"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-display text-xs uppercase tracking-wider transition-colors ${
                location.pathname === "/admin"
                  ? "bg-neon-orange/10 text-neon-orange"
                  : "text-neon-orange/70 hover:text-neon-orange hover:bg-neon-orange/5"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {nitroPoints !== undefined && (
            <div className="flex items-center gap-1.5 rounded-lg bg-card/30 px-2.5 py-1.5 backdrop-blur-sm border border-border/10">
              <Coins className="h-4 w-4 text-neon-orange" />
              <span className="font-display text-[10px] font-bold text-foreground sm:text-xs">
                {nitroPoints.toLocaleString()} NP
              </span>
            </div>
          )}

          {session && user && (
            <>
              <button
                onClick={() => navigate("/perfil")}
                className="hidden items-center gap-1.5 rounded-lg bg-card/30 px-2.5 py-1.5 backdrop-blur-sm transition-colors hover:bg-card/50 border border-border/10 sm:flex"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="font-display text-[10px] text-foreground sm:text-xs">
                  {user.username ?? "Piloto"}
                </span>
              </button>
              <button
                onClick={signOut}
                className="hidden items-center gap-1 rounded-lg bg-card/30 px-2 py-1.5 backdrop-blur-sm transition-colors hover:bg-destructive/20 border border-border/10 sm:flex"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </>
          )}

          {!session && (
            <button
              onClick={() => navigate("/auth")}
              className="rounded-xl bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110"
            >
              Jogar
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-card/30 backdrop-blur-sm border border-border/10 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/10 bg-background/95 backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {session && user && (
                <div className="mb-2 flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-display text-xs uppercase tracking-wider text-primary">
                    {user.username ?? "Piloto"}
                  </span>
                  {nitroPoints !== undefined && (
                    <span className="ml-auto font-display text-xs font-bold text-neon-orange">
                      {nitroPoints.toLocaleString()} NP
                    </span>
                  )}
                </div>
              )}

              {visibleLinks.map((link) => {
                const active = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => { navigate(link.path); setMenuOpen(false); }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider transition-colors ${
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-neon-orange hover:bg-neon-orange/5"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </button>
              )}

              {session ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="mt-1 flex items-center gap-2 rounded-lg border-t border-border/10 px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-destructive hover:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              ) : (
                <button
                  onClick={() => { navigate("/auth"); setMenuOpen(false); }}
                  className="mt-1 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-left font-display text-sm uppercase tracking-wider text-primary"
                >
                  <User className="h-4 w-4" />
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default MainNav;
