import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Target,
  TrendingUp,
  Dumbbell,
  ChevronRight,
  Zap,
  Trophy,
} from "lucide-react";
import {
  goalLabels,
  userProfile,
  weekPlan,
  volumeData,
} from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Forja Training" },
      {
        name: "description",
        content:
          "Tu centro de entrenamiento personal: rutina semanal, progreso y rachas.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const today = new Date().getDay(); // 0 = Dom
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayPlan = weekPlan[todayIndex];

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-hero border border-border p-5 sm:p-6 lg:p-10 mb-5 sm:mb-6 shadow-elevated">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
              {new Date().toLocaleDateString("es", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-6xl mb-3 leading-none">
              Hola, {userProfile.name.split(" ")[0]}.
              <br />
              <span className="text-gradient">Es hora de entrenar.</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-5 sm:mb-6">
              Hoy te toca <strong className="text-foreground">{todayPlan.focus}</strong> ·{" "}
              {todayPlan.durationMin} min · {todayPlan.exercises.length} ejercicios.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/rutina">
                  <Zap className="h-4 w-4" />
                  Iniciar entrenamiento
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/progreso">Ver progreso</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <StatTile
              icon={Flame}
              label="Racha"
              value={`${userProfile.streak}`}
              hint="días seguidos"
              accent
            />
            <StatTile
              icon={Target}
              label="Objetivo"
              value={goalLabels[userProfile.goal].split(" ")[1]}
              hint={goalLabels[userProfile.goal]}
            />
            <StatTile
              icon={Trophy}
              label="PRs este mes"
              value="4"
              hint="récords personales"
            />
            <StatTile
              icon={TrendingUp}
              label="Volumen"
              value="+18%"
              hint="vs mes pasado"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's workout */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Sesión de hoy
              </p>
              <h2 className="font-display text-3xl">{todayPlan.focus}</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/rutina/$dayId" params={{ dayId: todayPlan.id }}>
                Abrir <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {todayPlan.rest ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">🌿</div>
              <p className="font-display text-2xl">Día de descanso</p>
              <p className="text-sm text-muted-foreground mt-1">
                Recuperación activa: caminata 30 min o movilidad.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayPlan.exercises.slice(0, 4).map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-background/40 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center font-display text-lg">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.muscle} · {ex.sets} × {ex.reps}
                    </p>
                  </div>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weekly progress */}
        <Card className="bg-gradient-card border-border p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Esta semana
          </p>
          <h2 className="font-display text-3xl mb-4">Plan</h2>
          <div className="space-y-3">
            {weekPlan.map((d, i) => {
              const isToday = i === todayIndex;
              return (
                <Link
                  key={d.id}
                  to="/rutina/$dayId"
                  params={{ dayId: d.id }}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center font-display text-sm transition-all ${
                      isToday
                        ? "bg-gradient-primary shadow-glow text-primary-foreground"
                        : d.rest
                        ? "bg-muted text-muted-foreground"
                        : "bg-secondary text-foreground group-hover:bg-primary/30"
                    }`}
                  >
                    {d.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.day}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.focus}</p>
                  </div>
                  {!d.rest && (
                    <span className="text-[10px] text-muted-foreground">
                      {d.durationMin}′
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Volume chart */}
        <Card className="lg:col-span-3 bg-gradient-card border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Volumen de entrenamiento
              </p>
              <h2 className="font-display text-3xl">Últimas 12 semanas</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/progreso">Ver todo</Link>
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.19 285)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="oklch(0.62 0.22 275)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.05 280)" vertical={false} />
                <XAxis dataKey="week" stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.03 270)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.05 280)",
                    border: "1px solid oklch(0.27 0.05 280)",
                    borderRadius: 12,
                    color: "white",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.74 0.19 285)"
                  strokeWidth={2}
                  fill="url(#volumeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Goal progress */}
        <Card className="lg:col-span-3 bg-gradient-card border-border p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
            <GoalRow label="Asistencia mensual" value={84} hint="21 / 25 sesiones" />
            <GoalRow label="Progreso a meta" value={62} hint="Ganar masa muscular" />
            <GoalRow label="Cumplimiento PAR-Q" value={100} hint="Vigente hasta mar 2026" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
        accent
          ? "bg-gradient-primary border-primary-glow/40 shadow-glow"
          : "bg-background/30 border-border backdrop-blur-md"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-70" />
        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-70 truncate">
          {label}
        </p>
      </div>
      <p className="font-display text-2xl sm:text-4xl leading-none">{value}</p>
      <p className="text-[10px] sm:text-xs opacity-70 mt-1 capitalize truncate">{hint}</p>
    </div>
  );
}

function GoalRow({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="font-display text-2xl text-gradient">{value}%</p>
      </div>
      <Progress value={value} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}
