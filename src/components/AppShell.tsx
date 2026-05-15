import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  User,
  HeartPulse,
  Dumbbell,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
// import { user } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { ProfileMenu } from "@/components/ProfileMenu";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rutina", label: "Rutina", icon: Calendar },
  // { to: "/progreso", label: "Progreso", icon: TrendingUp },
  {
    to: "/perfil/$userId",
    label: "Perfil",
    icon: User,
  },
  // { to: "/par-q", label: "PAR-Q", icon: HeartPulse },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {});

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-300",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className={cn("p-4 flex items-center gap-2", collapsed && "justify-center px-2")}>
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none tracking-wider">PYROSFIT</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                training co.
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                params={{ userId: user?.id?.toString() ?? "" }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm transition-all",
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg p-2.5 text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center",
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="p-4 m-3 rounded-xl bg-gradient-card border border-sidebar-border">
            <div className="flex items-center gap-3">
              <ProfileMenu initial={user!.firstName!.charAt(0)} align="left" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user!.firstName}</p>
                <p className="text-xs text-muted-foreground">Cliente • Pro</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="p-3 flex justify-center">
            <ProfileMenu initial={user!.firstName!.charAt(0)} align="left" />
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-sidebar border-r border-sidebar-border flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display text-2xl leading-none tracking-wider">PYROSFIT</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    training co.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    params={{ userId: user?.id?.toString() ?? "" }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all",
                      active
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 m-3 rounded-xl bg-gradient-card border border-sidebar-border">
              <div className="flex items-center gap-3">
                <ProfileMenu initial={user!.firstName!.charAt(0)} align="left" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user!.firstName}</p>
                  <p className="text-xs text-muted-foreground">Cliente • Pro</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8 h-16">
            <div className="flex items-center gap-2 lg:hidden min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                <Dumbbell className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="font-display text-xl sm:text-2xl tracking-wider truncate">PYROSFIT</p>
            </div>

            <div className="hidden md:flex items-center gap-2 max-w-md flex-1 lg:ml-0">
              <div className="relative w-full">
                {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> */}
                <input
                  placeholder="Buscar ejercicio, rutina…"
                  className="w-full h-10 rounded-lg bg-input/60 border border-border pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" aria-label="Notificaciones">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="lg:hidden">
                <ProfileMenu initial={user!.firstName!.charAt(0)} size="sm" align="right" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-4 lg:px-8 py-5 sm:py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-sidebar/90 border-t border-sidebar-border safe-bottom">
        <div className={`grid grid-cols-${nav.length}`}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                params={{ userId: user?.id?.toString() ?? "" }}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium uppercase tracking-wider",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_currentColor]")} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
