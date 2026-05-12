import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { volumeData, strengthData } from "@/lib/mock-data";
import { Flame, Trophy, TrendingUp, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/progreso")({
  head: () => ({
    meta: [
      { title: "Progreso — PYROSFIT" },
      { name: "description", content: "Gráficas de volumen, fuerza y rachas." },
    ],
  }),
  component: Progreso,
});

function Progreso() {
  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Seguimiento
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Tu progreso</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl">
          Estadísticas de volumen, fuerza y consistencia para llevar el seguimiento contigo y tu
          entrenador.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
        {/* <Kpi icon={Flame} label="Racha actual" value={`${userProfile.streak}`} unit="días" accent /> */}
        <Kpi icon={Trophy} label="PRs totales" value="14" unit="récords" />
        <Kpi icon={TrendingUp} label="Volumen 12s" value="+22%" unit="vs anterior" />
        <Kpi icon={Activity} label="Adherencia" value="91%" unit="cumplimiento" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Volume */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Volumen total semanal (kg × reps)
            </p>
            <h2 className="font-display text-3xl">Evolución</h2>
          </div>
          <div className="h-72">
            {/* <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.17 65)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 50)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.26 0.015 60)"
                  vertical={false}
                />
                <XAxis dataKey="week" stroke="oklch(0.7 0.02 70)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 70)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.008 60)",
                    border: "1px solid oklch(0.26 0.015 60)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.82 0.17 65)"
                  strokeWidth={2}
                  fill="url(#vg)"
                />
              </AreaChart>
            </ResponsiveContainer> */}
          </div>
        </Card>

        {/* Streak */}
        <Card className="bg-gradient-primary border-primary-glow/40 p-6 shadow-glow text-primary-foreground relative overflow-hidden">
          <Flame className="absolute -right-6 -bottom-6 h-40 w-40 opacity-10" />
          <p className="text-xs uppercase tracking-widest opacity-80">Racha de resistencia</p>
          {/* <p className="font-display text-8xl leading-none my-2">{userProfile.streak}</p> */}
          <p className="text-sm opacity-90">días consecutivos</p>
          <div className="mt-6 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded ${i < 24 ? "bg-white/80" : "bg-white/20"}`}
              />
            ))}
          </div>
          <p className="text-xs opacity-80 mt-3">Últimas 4 semanas · 24 sesiones completadas</p>
        </Card>

        {/* Strength comparison */}
        <Card className="lg:col-span-3 bg-gradient-card border-border p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Fuerza por ejercicio
              </p>
              <h2 className="font-display text-3xl">Récords actuales vs anteriores</h2>
            </div>
            <div className="flex gap-3 text-xs">
              <Badge variant="secondary">Anterior</Badge>
              <Badge className="bg-gradient-primary border-0">Actual</Badge>
            </div>
          </div>
          <div className="h-80">
            {/* <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strengthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.26 0.015 60)"
                  vertical={false}
                />
                <XAxis dataKey="exercise" stroke="oklch(0.7 0.02 70)" fontSize={11} />
                <YAxis stroke="oklch(0.7 0.02 70)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.008 60)",
                    border: "1px solid oklch(0.26 0.015 60)",
                    borderRadius: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="previous"
                  name="Anterior"
                  fill="oklch(0.32 0.12 50)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="current"
                  name="Actual"
                  fill="oklch(0.82 0.17 65)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer> */}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`p-3.5 sm:p-5 border ${
        accent
          ? "bg-gradient-primary border-primary-glow/40 shadow-glow text-primary-foreground"
          : "bg-gradient-card border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2 opacity-80">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest truncate">{label}</p>
      </div>
      <p className="font-display text-2xl sm:text-4xl leading-none">{value}</p>
      <p className="text-[10px] sm:text-xs opacity-70 mt-1 truncate">{unit}</p>
    </Card>
  );
}
