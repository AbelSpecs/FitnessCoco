import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Flame,
  Search,
  Crown,
  Medal,
  Dumbbell,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe2,
  Users,
  Sparkles,
} from "lucide-react";
import {
  getCoachStreakLeaderboard,
  getGlobalStreakLeaderboard,
} from "@/services/streak.service";
import { StreakLeaderboardItemDto } from "@/dtos/streakDto";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking PyrosFit — Tabla de líderes" },
      {
        name: "description",
        content:
          "Ranking de alumnos PyrosFit: compite en tu equipo con tu coach o en la clasificación global por racha y puntos de consistencia.",
      },
    ],
  }),
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");
    if (!auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async () => {
    const auth = JSON.parse(localStorage.getItem("pyrosfit_user") || "{}");
    const currentStudentId = Number(auth.studentId) || 0;
    const coachId = Number(auth.myCoachId) || Number(auth.coachId) || 1;

    try {
      const [globalLeaderboard, coachLeaderboard] = await Promise.all([
        getGlobalStreakLeaderboard(50).catch((err) => {
          console.warn("Error al cargar ranking global:", err);
          return [] as StreakLeaderboardItemDto[];
        }),
        coachId
          ? getCoachStreakLeaderboard(coachId, 50).catch((err) => {
              console.warn("Error al cargar ranking de coach:", err);
              return [] as StreakLeaderboardItemDto[];
            })
          : Promise.resolve([] as StreakLeaderboardItemDto[]),
      ]);

      return {
        globalLeaderboard,
        coachLeaderboard,
        currentStudentId,
        coachId,
        role: auth.role || "student",
      };
    } catch (error) {
      console.error("Error en loader de ranking:", error);
      return {
        globalLeaderboard: [] as StreakLeaderboardItemDto[],
        coachLeaderboard: [] as StreakLeaderboardItemDto[],
        currentStudentId,
        coachId,
        role: auth.role || "student",
      };
    }
  },
  component: RankingPage,
});

type Athlete = {
  id: string;
  name: string;
  initials: string;
  coach: string;
  points: number;
  streak: number;
  longestStreak: number;
  volume: number;
  sessions: number;
  delta: number;
  title: string;
  me?: boolean;
};

const FIRE_TIERS = [
  { min: 30, title: "Fuego de los Titanes" },
  { min: 14, title: "Furia del Fénix" },
  { min: 7, title: "Forja de Hefesto" },
  { min: 3, title: "Llama Olímpica" },
  { min: 0, title: "Chispa de Esparta" },
];

function getTitleForStreak(streak: number): string {
  return FIRE_TIERS.find((t) => streak >= t.min)?.title || "Chispa de Esparta";
}

function mapLeaderboardToAthletes(
  items: StreakLeaderboardItemDto[] = [],
  currentStudentId: number,
  coachLabel: string = "PyrosFit",
): Athlete[] {
  return items.map((item) => {
    const studentName = item.studentName || `Alumno #${item.studentId}`;
    const nameParts = studentName.trim().split(/\s+/);
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : studentName.slice(0, 2).toUpperCase();

    const streak = item.currentStreak ?? 0;
    const longestStreak = item.longestStreak ?? 0;
    const points = streak * 100 + longestStreak * 25 + (item.freezeShieldsAvailable ?? 0) * 10;
    const title = getTitleForStreak(streak);

    return {
      id: item.studentId.toString(),
      name: studentName,
      initials,
      coach: coachLabel,
      points,
      streak,
      longestStreak,
      volume: streak * 1250,
      sessions: streak,
      delta: 0,
      title,
      me: item.studentId === currentStudentId,
    };
  });
}

type Metric = "streak" | "points" | "longestStreak";
const METRICS: { key: Metric; label: string; icon: typeof Trophy; unit: string }[] = [
  { key: "streak", label: "Racha actual", icon: Flame, unit: "días" },
  { key: "points", label: "Puntos", icon: Sparkles, unit: "pts" },
  { key: "longestStreak", label: "Récord histórico", icon: Medal, unit: "días" },
];

const PERIODS = ["Semana", "Mes", "Temporada"] as const;

function fmt(value: number, metric: Metric) {
  if (metric === "points") return value.toLocaleString("es-ES");
  return value.toString();
}

function Avatar({ initials, size = "md" }: { initials: string; size?: "md" | "lg" }) {
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-primary flex items-center justify-center font-semibold text-primary-foreground shrink-0",
        size === "lg" ? "h-16 w-16 text-lg shadow-glow" : "h-10 w-10 text-sm",
      )}
    >
      {initials}
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" />0
      </span>
    );
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        up ? "text-primary" : "text-destructive",
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta)}
    </span>
  );
}

function Podium({ top, metric }: { top: Athlete[]; metric: Metric }) {
  const order = [1, 0, 2]; // 2º, 1º, 3º
  const heights = ["h-20", "h-28", "h-16"];
  const meta = [
    { label: "2", ring: "ring-muted-foreground/40" },
    { label: "1", ring: "ring-primary" },
    { label: "3", ring: "ring-primary/40" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
      {order.map((idx, i) => {
        const a = top[idx];
        if (!a) return <div key={i} />;
        const isFirst = idx === 0;
        return (
          <div key={a.id} className="flex flex-col items-center gap-2 min-w-0">
            {isFirst && (
              <Crown className="h-5 w-5 text-primary drop-shadow-[0_0_10px_currentColor]" />
            )}
            <div
              className={cn(
                "rounded-full ring-2 ring-offset-2 ring-offset-background",
                meta[i].ring,
              )}
            >
              <Avatar initials={a.initials} size={isFirst ? "lg" : "md"} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-center truncate max-w-full px-1">
              {a.name.split(" ")[0]}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {fmt(a[metric], metric)} {METRICS.find((m) => m.key === metric)!.unit}
            </p>
            <div
              className={cn(
                "w-full rounded-t-xl border border-b-0 border-border flex items-start justify-center pt-2",
                heights[i],
                isFirst ? "bg-gradient-primary/20 shadow-glow" : "bg-gradient-card",
              )}
            >
              <span className="font-display text-2xl sm:text-3xl text-primary">
                {meta[i].label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankRow({
  athlete,
  position,
  metric,
  max,
}: {
  athlete: Athlete;
  position: number;
  metric: Metric;
  max: number;
}) {
  const pct = max > 0 ? Math.round((athlete[metric] / max) * 100) : 0;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-3 py-2.5 flex items-center gap-3 transition-colors",
        athlete.me
          ? "border-primary/60 bg-primary/10 shadow-glow"
          : "border-border bg-gradient-card hover:bg-sidebar-accent/40",
      )}
    >
      <div
        className="absolute inset-y-0 left-0 bg-primary/10 pointer-events-none"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <span className="relative w-6 text-center font-display text-lg text-muted-foreground">
        {position}
      </span>
      <div className="relative">
        <Avatar initials={athlete.initials} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium truncate">{athlete.name}</p>
          {athlete.me && (
            <Badge className="h-4 px-1.5 text-[10px] uppercase tracking-wider">Tú</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          {athlete.title} • {athlete.coach}
        </p>
      </div>
      <div className="relative text-right">
        <p className="text-sm font-semibold tabular-nums">
          {fmt(athlete[metric], metric)}
          <span className="ml-1 text-[10px] text-muted-foreground">
            {METRICS.find((m) => m.key === metric)!.unit}
          </span>
        </p>
        <DeltaBadge delta={athlete.delta} />
      </div>
    </div>
  );
}

function RankingPage() {
  const { globalLeaderboard, coachLeaderboard, currentStudentId } = Route.useLoaderData();
  const [scope, setScope] = useState<"coach" | "global">("coach");
  const [metric, setMetric] = useState<Metric>("streak");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Mes");
  const [query, setQuery] = useState("");

  const athletesData = useMemo(() => {
    const rawList = scope === "coach" ? coachLeaderboard : globalLeaderboard;
    const coachLabel = scope === "coach" ? "Tu Equipo" : "Global";

    if (!rawList || rawList.length === 0) {
      return [];
    }

    return mapLeaderboardToAthletes(rawList, currentStudentId, coachLabel);
  }, [scope, coachLeaderboard, globalLeaderboard, currentStudentId]);

  const ranked = useMemo(() => {
    return [...athletesData].sort((a, b) => b[metric] - a[metric]);
  }, [athletesData, metric]);

  const filtered = useMemo(
    () => ranked.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    [ranked, query],
  );

  const max = ranked.length ? ranked[0][metric] : 0;
  const myIndex = ranked.findIndex((a) => a.me);
  const me = myIndex >= 0 ? ranked[myIndex] : null;
  const aboveMe = myIndex > 0 ? ranked[myIndex - 1] : null;
  const gap = me && aboveMe ? aboveMe[metric] - me[metric] : 0;

  return (
    <AppShell>
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Header */}
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary drop-shadow-[0_0_10px_currentColor]" />
            <h1 className="font-display text-3xl tracking-wider">PODIO & RANKING</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Compite con tu equipo y escala en la clasificación global de PyrosFit.
          </p>
        </header>

        {/* Scope switch */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-gradient-card border border-border">
          {(
            [
              { key: "coach", label: "Tu Coach / Equipo", icon: Users },
              { key: "global", label: "Global PyrosFit", icon: Globe2 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all cursor-pointer",
                scope === key
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {/* Metric + period */}
        <div className="flex flex-wrap items-center gap-2">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                metric === key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 rounded-full border border-border p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] transition-colors cursor-pointer",
                  period === p
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Podium */}
        {ranked.length >= 3 && (
          <Card className="p-4 sm:p-6 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <Medal className="h-4 w-4 text-primary" />
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Podio · {period}
              </p>
            </div>
            <Podium top={ranked.slice(0, 3)} metric={metric} />
          </Card>
        )}

        {/* My position */}
        {me && (
          <Card className="p-4 bg-gradient-card border-primary/40">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="font-display text-3xl text-primary leading-none">#{myIndex + 1}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  tu puesto
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{me.name}</p>
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    {me.title}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {aboveMe
                    ? `${fmt(gap, metric)} ${METRICS.find((m) => m.key === metric)!.unit} para alcanzar a ${aboveMe.name.split(" ")[0]}`
                    : "¡Estás en la cima! Defiende tu puesto."}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary"
                    style={{
                      width: `${aboveMe && aboveMe[metric] > 0 ? Math.round((me[metric] / aboveMe[metric]) * 100) : 100}%`,
                    }}
                  />
                </div>
              </div>
              <Flame className="h-6 w-6 text-primary drop-shadow-[0_0_10px_currentColor]" />
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alumno…"
            className="pl-9"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map((a) => (
            <RankRow
              key={a.id}
              athlete={a}
              position={ranked.indexOf(a) + 1}
              metric={metric}
              max={max}
            />
          ))}
          {filtered.length === 0 && (
            <Card className="p-8 text-center bg-gradient-card border-border">
              <p className="text-sm text-muted-foreground">No se encontraron alumnos en esta clasificación.</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
