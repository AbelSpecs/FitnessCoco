import { createFileRoute, Link, createLazyRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/uiSkeletons/DashboardSkeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flame,
  Shield,
  Smartphone,
  LayoutDashboard,
  Dumbbell,
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  MessageCircle,
  Send,
  Trophy,
  PartyPopper,
  CalendarDays,
} from "lucide-react";
import { weekPlan, volumeData } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { goalLabels } from "@/types/goals";
import { useAuthStore } from "@/store/authStore";
import { getCoachStudents } from "@/services/coach.service";
import { CoachStudentsDto, StudentDto } from "@/dtos/userDto";
import {
  countActiveClients,
  countPorcentageStudents,
  calculateWeeklyStreak,
  calculateMaxWeightLifted,
  calculateRoutineDurationInMin,
  formatDuration,
} from "@/helpers/studentsHelper";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStudents } from "@/services/student.service";
import {
  getDailyStudentExercisesByStudentIdAndDate,
  getDailyStudentExercisesByStudentIdAndDates,
} from "@/services/routine.service";
import { format, addDays, startOfWeek, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { History } from "@/types/exercises";
import {
  combinedHistoryMapper,
  historyExercisesMapper,
  riskRadarStudentsMapper,
  streakHistoryMapper,
} from "@/mappers/exercises";
import { calculateStreakExperience, getSixDaysLaterFormatted } from "@/helpers/generics";
import { notify } from "@/components/NotificationCenter";
import {
  getCoachRiskRadar,
  getStudentStreak,
  getStudentStreakHistory,
  useFreezeShield,
} from "@/services/streak.service";
import { Tier } from "@/types";
import { Student, StudentInfo } from "@/types/user";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PyrosFit Training" },
      {
        name: "description",
        content: "Tu centro de entrenamiento personal: rutina semanal, progreso y rachas.",
      },
    ],
  }),
  loader: async () => {
    const auth = JSON.parse(localStorage.getItem("pyrosfit_user")!);
    const { role, coachId, studentId } = auth;

    try {
      if (role === "coach") {
        const [completeStudentsList, studentListData, riskRadarStudents] = await Promise.all([
          getStudents().catch((err) => {
            console.warn("Error al cargar lista completa de alumnos:", err);
            return [];
          }),
          getCoachStudents(coachId).catch((err) => {
            console.warn("Error al cargar alumnos del coach:", err);
            return [];
          }),
          getCoachRiskRadar(coachId).catch((err) => {
            console.warn("Error al cargar radar de riesgo:", err);
            return [];
          }),
        ]);

        return {
          role,
          riskRadarStudents,
          completeStudentsList,
          studentListData,
          dailyExercises: undefined,
          weeklyExercises: undefined,
          historyExercises: undefined,
          studentStreakData: undefined,
        };
      }

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
      const dateStringStart = format(startOfThisWeek, "yyyy-MM-dd");
      const sixDaysLaterStr = getSixDaysLaterFormatted(new Date());

      const threeDaysAgoStr = format(subDays(new Date(), 3), "yyyy-MM-dd");
      const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

      const [
        dailyExercises,
        weeklyExercises,
        historyExercises,
        studentStreakData,
        streakHistoryLogs,
      ] = await Promise.all([
        getDailyStudentExercisesByStudentIdAndDate(studentId, todayStr),
        getDailyStudentExercisesByStudentIdAndDates(studentId, dateStringStart, sixDaysLaterStr),
        getDailyStudentExercisesByStudentIdAndDates(studentId, threeDaysAgoStr, yesterdayStr),
        getStudentStreak(studentId).catch((error) => {
          console.warn("No se pudo cargar la racha del alumno:", error);
          return undefined;
        }),
        getStudentStreakHistory(studentId).catch((error) => {
          console.warn("No se pudo cargar el historial de racha:", error);
          return [];
        }),
      ]);
      console.log(streakHistoryLogs);

      // const lastCompletedExercises = historyExercises.slice(
      //   historyExercises.length - 3,
      //   historyExercises.length - 1,
      // );

      return {
        role,
        riskRadarStudents: undefined,
        completeStudentsList: undefined,
        studentListData: undefined,
        dailyExercises,
        weeklyExercises,
        lastCompletedExercises: historyExercises,
        studentStreakData,
        streakHistoryLogs,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },
  component: Dashboard,
  pendingComponent: DashboardSkeleton,
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
});

/* del ámbar tibio al rojo fuego a medida que sube la racha */
const TIERS: Tier[] = [
  {
    min: 0,
    label: "Chispa de Esparta",
    card: "linear-gradient(135deg, oklch(0.14 0.01 60) 0%, oklch(0.2 0.04 70) 100%)",
    orb: "linear-gradient(135deg, oklch(0.7 0.11 85), oklch(0.62 0.13 70))",
    glow: "0 8px 30px -10px oklch(0.7 0.12 80 / 0.5)",
    text: "oklch(0.82 0.12 85)",
    ring: "oklch(0.7 0.11 85 / 0.45)",
  },
  {
    min: 3,
    label: "Llama Olímpica",
    card: "linear-gradient(135deg, oklch(0.14 0.01 60) 0%, oklch(0.26 0.09 62) 100%)",
    orb: "linear-gradient(135deg, oklch(0.74 0.15 78), oklch(0.64 0.17 55))",
    glow: "0 10px 34px -10px oklch(0.7 0.16 65 / 0.55)",
    text: "oklch(0.84 0.14 78)",
    ring: "oklch(0.72 0.15 70 / 0.5)",
  },
  {
    min: 7,
    label: "Forja de Hefesto",
    card: "linear-gradient(135deg, oklch(0.14 0.01 40) 0%, oklch(0.3 0.12 45) 100%)",
    orb: "linear-gradient(135deg, oklch(0.72 0.18 60), oklch(0.6 0.2 38))",
    glow: "0 12px 38px -10px oklch(0.66 0.19 45 / 0.6)",
    text: "oklch(0.84 0.15 62)",
    ring: "oklch(0.7 0.18 50 / 0.55)",
  },
  {
    min: 14,
    label: "Furia del Fénix",
    card: "linear-gradient(135deg, oklch(0.15 0.02 30) 0%, oklch(0.34 0.15 32) 100%)",
    orb: "linear-gradient(135deg, oklch(0.66 0.2 40), oklch(0.55 0.21 27))",
    glow: "0 14px 44px -10px oklch(0.58 0.21 30 / 0.7)",
    text: "oklch(0.82 0.16 45)",
    ring: "oklch(0.62 0.2 32 / 0.6)",
  },
  {
    min: 30,
    label: "Fuego de los Titanes",
    card: "linear-gradient(135deg, oklch(0.16 0.04 25) 0%, oklch(0.42 0.2 27) 100%)",
    orb: "linear-gradient(135deg, oklch(0.6 0.22 30), oklch(0.5 0.23 25))",
    glow: "0 18px 55px -10px oklch(0.55 0.24 27 / 0.85)",
    text: "oklch(0.78 0.19 30)",
    ring: "oklch(0.58 0.23 27 / 0.7)",
  },
];

const STUDENTS: StudentInfo[] = [
  {
    studentId: "1",
    name: "Carlos Mendoza",
    initials: "CM",
    streak: 0,
    lastWorkout: "Hace 5 días",
    inactivity: 5,
    risk: "high",
  },
  {
    studentId: "2",
    name: "Sofía Rodríguez",
    initials: "SR",
    streak: 2,
    lastWorkout: "Hace 3 días",
    inactivity: 3,
    risk: "medium",
  },
  {
    studentId: "3",
    name: "María Gómez",
    initials: "MG",
    streak: 14,
    lastWorkout: "Ayer",
    inactivity: 1,
    risk: "low",
  },
  {
    studentId: "4",
    name: "Julián Ferrer",
    initials: "JF",
    streak: 0,
    lastWorkout: "Hace 8 días",
    inactivity: 8,
    risk: "high",
  },
  {
    studentId: "5",
    name: "Lucía Ibarra",
    initials: "LI",
    streak: 6,
    lastWorkout: "Hoy",
    inactivity: 0,
    risk: "low",
  },
  {
    studentId: "6",
    name: "Diego Salas",
    initials: "DS",
    streak: 1,
    lastWorkout: "Hace 3 días",
    inactivity: 3,
    risk: "medium",
  },
];

const RISK_META = {
  high: {
    label: "Riesgo Alto",
    dot: "🔴",
    cls: "bg-destructive/15 text-destructive ring-destructive/40",
  },
  medium: { label: "Riesgo Medio", dot: "🟡", cls: "bg-warning/15 text-warning ring-warning/40" },
  low: { label: "Normal", dot: "🟢", cls: "bg-success/15 text-success ring-success/40" },
} as const;

const tierFor = (streak: number) => [...TIERS].reverse().find((t) => streak >= t.min) ?? TIERS[0];

const nextTierFor = (streak: number) => TIERS.find((t) => t.min > streak) ?? null;

function PrMedal({
  prMedalInfo,
  record,
  tier,
  onChange,
}: {
  prMedalInfo: boolean;
  record: number;
  tier: { orb: string; glow: string; text: string; ring: string };
  onChange: () => void;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  // const arc = C / 3 - 8; // hueco entre líneas
  return (
    <button
      type="button"
      onClick={onChange}
      // title={`Récord ${record} kg · ${lifts}/3 hacia ${pending} kg`}
      className="relative flex h-20 w-20 shrink-0 items-center justify-center transition-transform hover:scale-105 active:scale-95"
    >
      {prMedalInfo && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full font-display text-sm leading-none text-amber-500 whitespace-nowrap animate-float-up">
          Peso Máx
        </span>
      )}
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90">
        {[0].map((i) => {
          // const on = i < lifts;
          return (
            <circle
              key={i}
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke={tier.text}
              className={"text-border"}
              strokeWidth={4}
              strokeLinecap="round"
              // strokeDasharray={`${arc} ${C - arc}`}
              strokeDashoffset={-(i * (C / 3)) - 2.5}
              style={{
                transition: "stroke 400ms, stroke-width 400ms",
                filter: `drop-shadow(0 0 5px ${tier.text})`,
              }}
            />
          );
        })}
      </svg>

      <div
        className="flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur-md"
        style={{ boxShadow: tier.glow }}
      >
        <Dumbbell className="h-4 w-4" style={{ color: tier.text }} />
        <span className="font-display text-sm leading-none">{record}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">kg</span>
      </div>
    </button>
  );
}

function Dashboard() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayPlan = weekPlan[todayIndex];
  const { user } = useAuthStore();
  const {
    completeStudentsList,
    studentListData,
    role,
    dailyExercises,
    weeklyExercises,
    riskRadarStudents,
    lastCompletedExercises,
    studentStreakData,
    streakHistoryLogs,
  } = Route.useLoaderData();
  const [streak, setStreak] = useState(() => studentStreakData?.currentStreak ?? 14);
  const [shields, setShields] = useState(() => studentStreakData?.freezeShieldsAvailable ?? 2);
  const [completed, setCompleted] = useState<boolean>(() => !!studentStreakData?.isCompletedToday);
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [history, setHistory] = useState<History[]>(() =>
    combinedHistoryMapper(streakHistoryLogs, lastCompletedExercises),
  );
  const [shieldModalOpen, setShieldModalOpen] = useState<boolean>(false);
  const [usingShield, setUsingShield] = useState<boolean>(false);
  const [prMedalInfo, setPrMedalInfo] = useState<boolean>(false);
  const [prRecord, setPrRecord] = useState<number>(() => calculateMaxWeightLifted(weeklyExercises));
  const prevStreakRef = useRef<number>(streak);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | StudentInfo["risk"]>("all");
  const [target, setTarget] = useState<StudentInfo | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleUseShield = async () => {
    if (!user?.studentId || shields <= 0 || usingShield) return;
    try {
      setUsingShield(true);
      await useFreezeShield(user.studentId);
      setShields((prev) => Math.max(0, prev - 1));
      notify.success("¡Escudo de Hielo activado!", "Tu racha está protegida ante inactividad 🛡️❄️");
      setShieldModalOpen(false);
    } catch (error) {
      console.error("Error al usar escudo congelador:", error);
      notify.error(
        "Error al activar escudo",
        "No se pudo usar el escudo de hielo. Intenta nuevamente.",
      );
    } finally {
      setUsingShield(false);
    }
  };

  const ChangePrMedalInfo = () => {
    setPrMedalInfo(!prMedalInfo);
  };

  useEffect(() => {
    if (studentStreakData) {
      if (typeof studentStreakData.currentStreak === "number") {
        setStreak(studentStreakData.currentStreak);
      }
      const shieldsCount = studentStreakData.freezeShieldsAvailable;
      if (typeof shieldsCount === "number") {
        setShields(shieldsCount);
      }
      if (typeof studentStreakData.isCompletedToday === "boolean") {
        setCompleted(studentStreakData.isCompletedToday);
      }
    }
  }, [studentStreakData]);

  useEffect(() => {
    if (weeklyExercises && weeklyExercises.length > 0) {
      setPrRecord(calculateMaxWeightLifted(weeklyExercises));
    }
  }, [weeklyExercises]);

  useEffect(() => {
    setHistory(combinedHistoryMapper(streakHistoryLogs, lastCompletedExercises));
  }, [streakHistoryLogs, lastCompletedExercises]);

  const studentsNumber = useMemo(
    () => (studentListData ? countActiveClients(studentListData) : 0),
    [studentListData],
  );
  const porcentageStudents = useMemo(
    () =>
      completeStudentsList && studentListData
        ? countPorcentageStudents(completeStudentsList, studentListData)
        : 0,
    [completeStudentsList, studentListData],
  );
  const dailyExercisesNum = useMemo(() => dailyExercises?.length || 0, [dailyExercises]);

  const dailyFocus = useMemo(() => {
    if (!dailyExercises || dailyExercises.length === 0) return todayPlan.focus;
    const groups = Array.from(
      new Set((dailyExercises as any).map((ex: any) => ex.muscleGroupName).filter(Boolean)),
    );
    return groups.length > 0 ? groups.join(", ") : todayPlan.focus;
  }, [dailyExercises, todayPlan.focus]);

  const weekRoutineDays = useMemo(() => {
    if (!weeklyExercises) return [];
    const todayDate = new Date();

    return Array.from({ length: 7 }, (_, i) => {
      const currentDayDate = addDays(todayDate, i);
      const dateString = format(currentDayDate, "yyyy-MM-dd");
      const dayName = format(currentDayDate, "EEEE", { locale: es });
      const dayShort = format(currentDayDate, "eeeeee", { locale: es });

      const dayExercises = weeklyExercises.filter(
        (ex: GetDailyStudentExerciseDto) => ex.scheduledDate.split("T")[0] === dateString,
      );

      return {
        id: dateString,
        day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        short: dayShort.charAt(0).toUpperCase(),
        rest: dayExercises.length === 0,
        focus: dayExercises.length > 0 ? dayExercises[0].muscleGroupName : "Descanso",
        isToday: i === 0,
      };
    });
  }, [weeklyExercises]);

  const tier = tierFor(streak);
  const next = nextTierFor(streak);
  const progress = next ? ((streak - tier.min) / (next.min - tier.min)) * 100 : 100;

  const coachStudentsRadar: StudentInfo[] = useMemo(() => {
    if (riskRadarStudents && riskRadarStudents.length > 0) {
      return riskRadarStudentsMapper(riskRadarStudents);
    }
    return STUDENTS;
  }, [riskRadarStudents]);

  const kpiTotalStudents = useMemo(() => {
    if (studentListData && studentListData.length > 0) {
      return studentListData.length.toString();
    }
    return coachStudentsRadar.length.toString();
  }, [studentListData, coachStudentsRadar]);

  const kpiAverageStreak = useMemo(() => {
    if (coachStudentsRadar.length === 0) return "0.0";
    const totalStreak = coachStudentsRadar.reduce((acc, curr) => acc + curr.streak, 0);
    return (totalStreak / coachStudentsRadar.length).toFixed(1);
  }, [coachStudentsRadar]);

  const kpiHighRiskCount = useMemo(() => {
    return coachStudentsRadar.filter((s) => s.risk === "high").length.toString();
  }, [coachStudentsRadar]);

  const rows = useMemo(
    () =>
      coachStudentsRadar.filter(
        (s) =>
          (filter === "all" || s.risk === filter) &&
          s.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [coachStudentsRadar, query, filter],
  );

  const openContact = (s: StudentInfo) => {
    setTarget(s);
    setSent(false);
    setMessage(
      `¡Hola ${s.name.split(" ")[0]}! Notamos que hace ${s.inactivity} días que no entrenás. ¿Coordinamos tu próxima sesión? 💪🔥`,
    );
  };

  return (
    <AppShell>
      {/* <div className="pyros text-foreground">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl tracking-wide">Streak</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* Card streak */}
      {user!.role === "student" ? (
        <div className="w-full">
          {/* header */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary font-display text-lg text-primary-foreground shadow-glow">
                {user?.firstName?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">¡Hola,</p>
              <p className="font-display text-2xl leading-none tracking-wide">{user?.firstName}!</p>
              {/* barra fina debajo del nombre */}
              {/* <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-border">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (streak / 30) * 100)}%`,
                    backgroundImage: tier.orb,
                    boxShadow: tier.glow,
                  }}
                />
              </div> */}
            </div>
            {/* <div className="shrink-0">
              <Badge className="gap-1 rounded-full bg-warning/15 px-3 py-1 text-warning ring-1 ring-warning/40 hover:bg-warning/15">
                <Trophy className="h-3.5 w-3.5" />
                Nivel 7
              </Badge>
            </div> */}
          </div>

          {/* tarjeta de racha */}
          <Card
            className="relative mt-4 overflow-hidden border-border p-5 transition-all duration-700"
            style={{ backgroundImage: tier.card, boxShadow: tier.glow }}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-70" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] transition-colors duration-700"
                  style={{ color: tier.text }}
                >
                  Pyros Streak
                </p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1"
                  style={{
                    color: tier.text,
                    borderColor: tier.ring,
                    boxShadow: `inset 0 0 0 1px ${tier.ring}`,
                  }}
                >
                  {tier.label}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-5 sm:mb-6">
                    Hoy te toca <strong className="text-foreground">{dailyFocus}</strong>·{" "}
                    {dailyExercisesNum} ejercicios.
                    {/* {dailyDuration} min · */}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div
                      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full transition-all duration-700"
                      style={{ backgroundImage: tier.orb, boxShadow: tier.glow }}
                    >
                      <span
                        className="absolute inset-0 animate-ping rounded-full opacity-30"
                        style={{ backgroundImage: tier.orb }}
                      />
                      <Flame className="h-10 w-10 animate-pulse text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-5xl leading-none">{streak}</p>
                      <p className="text-sm text-muted-foreground">Días Seguidos</p>
                    </div>
                  </div>
                </div>

                <PrMedal
                  prMedalInfo={prMedalInfo}
                  record={prRecord}
                  tier={tier}
                  onChange={ChangePrMedalInfo}
                />
              </div>

              {/* escudos */}
              <button
                type="button"
                onClick={() => setShieldModalOpen(true)}
                className="mt-5 flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 p-3 text-left backdrop-blur-md transition-colors hover:border-primary/60 hover:cursor-pointer"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-5 w-5 text-primary-glow" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Escudos de Hielo 🛡️</p>
                  <p className="text-xs text-muted-foreground">
                    {shields > 0
                      ? "Protegen tu racha ante un día de inactividad"
                      : "No tienes escudos disponibles en este momento"}
                  </p>
                </div>
                <span className="font-display text-lg text-primary-glow">{shields} disp.</span>
              </button>

              {/* barra de experiencia por hitos */}
              <div className="mt-12">
                <div className="relative h-1 rounded-full bg-background/60 ring-1 ring-border">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${calculateStreakExperience(streak, TIERS)}%`,
                      backgroundImage: tier.orb,
                      boxShadow: tier.glow,
                    }}
                  />

                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/3 items-center justify-between">
                    {TIERS.map((t, i) => {
                      const reached = streak >= t.min;
                      const size = 32 + i * 7;
                      const flame = 20 + i * 2.5;
                      return (
                        <div key={t.min} className="flex flex-col items-center">
                          <div
                            className="flex mb-2 sm:mb-0 items-center justify-center rounded-full border transition-all duration-500"
                            style={{
                              width: size,
                              height: size,
                              backgroundImage: reached
                                ? t.orb
                                : "linear-gradient(135deg, oklch(0.2 0.01 60), oklch(0.16 0.01 60))",
                              boxShadow: reached ? t.glow : "none",
                              borderColor: reached ? t.ring : "var(--color-border)",
                            }}
                          >
                            <Flame
                              style={{
                                width: flame,
                                height: flame,
                                color: reached
                                  ? "var(--color-primary-foreground)"
                                  : "oklch(0.55 0.01 60)",
                              }}
                              className={reached ? "animate-pulse" : ""}
                            />
                          </div>
                          <span
                            className="hidden sm:block mt-1 text-[9px] font-semibold uppercase tracking-wider transition-colors duration-500 "
                            style={{
                              color: reached ? t.text : "var(--color-muted-foreground)",
                              opacity: reached ? 1 : 0.35,
                            }}
                          >
                            {t.label}
                          </span>
                          <span
                            className="text-[9px] text-muted-foreground"
                            style={{ opacity: reached ? 1 : 0.5 }}
                          >
                            {t.min === 0 ? "1d" : `${t.min}d`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-14 text-center text-xs text-muted-foreground">
                  {next
                    ? `${next.min - streak} días para ${next.label} · ${Math.round(progress)}%`
                    : `Nivel máximo: ${TIERS[TIERS.length - 1].label} 🔥`}
                </p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <Button
            // onClick={completeToday}
            disabled={completed}
            className="mt-4 h-14 w-full rounded-2xl text-base font-bold text-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 hover:cursor-pointer"
            style={{
              boxShadow: tier.glow,
              borderColor: tier.ring,
            }}
          >
            <Link
              to="/rutina/$studentId/$dayId"
              params={{
                studentId: user!.studentId.toString(),
                dayId: format(new Date(), "yyyy-MM-dd"),
              }}
            >
              {completed ? "Rutina completada ✅" : "Completar Rutina de Hoy 💪"}
            </Link>
          </Button>

          {/* actividad reciente */}
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Actividad reciente
            </p>
            {history.length === 0 ? (
              <Card className="border-border bg-gradient-card p-4 text-center">
                <p className="text-sm text-muted-foreground">No existen actividades recientes</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 4).map((h, i) => (
                  <Card
                    key={`${h.name}-${i}`}
                    className="flex items-center gap-3 border-border bg-gradient-card p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <Dumbbell className="h-4 w-4 text-primary-glow" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {h.date}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3 w-3 text-primary-glow" />
                      {formatDuration(h.seconds ?? (h.min ? h.min * 60 : 1))}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-gradient-card border-border mt-6 p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Esta semana</p>
            <h2 className="font-display text-3xl mb-4">Plan</h2>
            <div className="space-y-3">
              {weekRoutineDays.map((d) => {
                return (
                  <Link
                    key={d.id}
                    to="/rutina/$studentId/$dayId"
                    params={{ studentId: user!.studentId.toString(), dayId: d.id }}
                    className="flex items-center gap-3 group"
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-display text-sm transition-all ${
                        d.isToday
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
                  </Link>
                );
              })}
            </div>
          </Card>

          <Dialog open={celebrate} onOpenChange={setCelebrate}>
            <DialogContent className="max-w-xs border-border bg-gradient-card text-center">
              <DialogHeader className="items-center">
                <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow">
                  <Flame className="h-10 w-10 animate-bounce text-primary-foreground" />
                </div>
                <DialogTitle className="font-display text-3xl tracking-wide">
                  ¡Racha Incrementada a {streak} días! 🔥
                </DialogTitle>
                <DialogDescription>
                  Seguís encendido, {user?.firstName}. Manten el fuego mañana también.
                </DialogDescription>
              </DialogHeader>
              <Button
                onClick={() => setCelebrate(false)}
                className="w-full bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
              >
                <PartyPopper className="h-4 w-4" /> ¡Vamos!
              </Button>
            </DialogContent>
          </Dialog>

          {/* Dialogo de Escudo de Hielo / Freeze Shield */}
          <Dialog open={shieldModalOpen} onOpenChange={setShieldModalOpen}>
            <DialogContent className="max-w-sm border-border bg-gradient-card text-center">
              <DialogHeader className="items-center">
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-glow">
                  <Shield className="h-8 w-8 text-cyan-400 animate-pulse" />
                </div>
                <DialogTitle className="font-display text-2xl tracking-wide">
                  Escudos de Hielo 🛡️❄️
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-2">
                  {shields > 0 ? (
                    <>
                      Tienes{" "}
                      <strong className="text-foreground">
                        {shields} {shields === 1 ? "escudo disponible" : "escudos disponibles"}
                      </strong>
                      . Al activar un escudo, tu racha de{" "}
                      <strong className="text-foreground">{streak} días</strong> no se romperá si
                      hoy o mañana no puedes entrenar.
                    </>
                  ) : (
                    <>
                      No te quedan escudos disponibles. Sigue entrenando y alcanzando nuevos hitos
                      de racha para desbloquear más escudos.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                {shields > 0 ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setShieldModalOpen(false)}
                      disabled={usingShield}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUseShield}
                      disabled={usingShield}
                      className="w-full sm:w-auto bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
                    >
                      {usingShield ? "Activando..." : "Activar Escudo 🛡️"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setShieldModalOpen(false)}
                    className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
                  >
                    Entendido
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-glow">Coach Panel</p>
            <h1 className="font-display text-4xl tracking-wide sm:text-5xl">Churn Risk Radar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Detectá alumnos en riesgo de abandono antes de perderlos.
            </p>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              icon={Users}
              label="Alumnos asignados"
              value={kpiTotalStudents}
              hint="en seguimiento"
            />
            <Kpi
              icon={TrendingUp}
              label="Racha promedio"
              value={kpiAverageStreak}
              hint="días por alumno"
            />
            <Kpi
              icon={AlertTriangle}
              label="Riesgo alto"
              value={kpiHighRiskCount}
              hint="requieren contacto"
              danger={Number(kpiHighRiskCount) > 0}
            />
          </div>

          {/* tabla */}
          <Card className="border-border bg-gradient-card p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar alumno..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Todos"],
                    ["high", "🔴 Alto Riesgo"],
                    ["medium", "🟡 Medio Riesgo"],
                    ["low", "🟢 Normal"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      filter === key
                        ? "border-primary-glow/50 bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                    <th className="pb-3 font-medium">Alumno</th>
                    <th className="pb-3 font-medium">Racha actual</th>
                    <th className="pb-3 font-medium">Último entrenamiento</th>
                    <th className="pb-3 font-medium">Inactividad</th>
                    <th className="pb-3 font-medium">Riesgo</th>
                    <th className="pb-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const meta = RISK_META[s.risk ?? "low"];
                    return (
                      <tr
                        key={s.studentId}
                        className="border-t border-border transition-colors hover:bg-background/40"
                      >
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary font-display text-sm text-primary-glow">
                              {s.initials}
                            </div>
                            <span className="font-medium">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1.5">
                            <Flame
                              className={`h-4 w-4 ${
                                s.streak > 0 ? "text-primary" : "text-muted-foreground/40"
                              }`}
                            />
                            <span className="font-display text-lg">{s.streak}</span>
                            <span className="text-xs text-muted-foreground">días</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-muted-foreground">{s.lastWorkout}</td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${
                                  s.risk === "high"
                                    ? "bg-destructive"
                                    : s.risk === "medium"
                                      ? "bg-warning"
                                      : "bg-success"
                                }`}
                                style={{ width: `${Math.min(s.inactivity ?? 0 / 8, 1) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{s.inactivity}d</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.cls}`}
                          >
                            {meta.dot} {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            size="sm"
                            variant={s.risk === "high" ? "default" : "outline"}
                            onClick={() => openContact(s)}
                            className={
                              s.risk === "high"
                                ? "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
                                : ""
                            }
                          >
                            <MessageCircle className="h-4 w-4" /> Contactar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        Sin resultados para esta búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
            <DialogContent className="border-border bg-gradient-card sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl tracking-wide">
                  Mensaje de motivación
                </DialogTitle>
                <DialogDescription>
                  {target
                    ? `Enviar a ${target.name} · ${target.lastWorkout?.toLowerCase() ?? "Hoy"}`
                    : ""}
                </DialogDescription>
              </DialogHeader>

              {sent ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/40">
                    <Send className="h-6 w-6 text-success" />
                  </div>
                  <p className="font-display text-2xl">¡Mensaje enviado!</p>
                  <p className="text-sm text-muted-foreground">
                    Le llegará por WhatsApp y notificación en la app.
                  </p>
                </div>
              ) : (
                <>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <DialogFooter className="gap-2 sm:gap-2">
                    <Button variant="outline" onClick={() => setTarget(null)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => setSent(true)}
                      className="bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110"
                    >
                      <Send className="h-4 w-4" /> Enviar por WhatsApp
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Hero */}
      {/* <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-hero border border-border p-5 sm:p-6 lg:p-10 mb-5 sm:mb-6 shadow-elevated">
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
              Hola, {user!.firstName!.split(" ")[0]}.
              <br />
              {user?.role === "student" ? (
                <span className="text-gradient">Es hora de entrenar.</span>
              ) : (
                <span className="text-gradient">Tienes clientes que atender.</span>
              )}
            </h1>
            {user?.role === "student" && (
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-5 sm:mb-6">
                Hoy te toca <strong className="text-foreground">{dailyFocus}</strong> ·{" "}
                {dailyDuration} min · {dailyExercisesNum} ejercicios.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              {user?.role === "student" && (
                <Button variant="hero" size="lg" asChild className="w-full sm:w-auto">
                  <Link
                    to="/rutina/$studentId"
                    params={{ studentId: user?.studentId?.toString() ?? "" }}
                  >
                    <Zap className="h-4 w-4" />
                    Iniciar entrenamiento
                  </Link>
                </Button>
              )}
              {/* <Button variant="glass" size="lg" asChild className="w-full sm:w-auto">
                <Link to=".">Ver progreso</Link>
              </Button> */}
      {/* </div>
          </div> */}

      {/* <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {user?.role === "coach" ? (
              <>
                <StatTile
                  icon={Target}
                  label="Número de Clientes"
                  value={studentsNumber.toString()}
                  hint="clientes inscritos"
                />
                <StatTile
                  icon={Trophy}
                  label="Porcentaje de Clientes"
                  value={porcentageStudents.toString() + " %"}
                  hint="de la totalidad"
                />
              </>
            ) : (
              <>
                <StatTile
                  icon={Flame}
                  label="Racha Semanal"
                  value={weeklyStreak.toString()}
                  hint="días completados"
                  // accent
                />
                <StatTile
                  icon={Dumbbell}
                  label="Maximo levantado"
                  value={`${maxWeightLifted} kg`}
                  hint="peso maximo levantado"
                />
              </>
            )}
          </div>
        </div> */}
      {/* </section> */}

      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's workout */}
      {/* {user?.role === "student" && (
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Sesión de hoy
              </p>
              <h2 className="font-display text-3xl">Entrenamiento</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link
                to="/rutina/$studentId/$dayId"
                params={{
                  studentId: user!.studentId.toString(),
                  dayId: format(new Date(), "yyyy-MM-dd"),
                }}
              >
                Abrir <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {!dailyExercises || dailyExercises.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">🌿</div>
              <p className="font-display text-2xl">Día de descanso</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hoy no tienes ejercicios asignados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dailyExercises.slice(0, 4).map((ex: GetDailyStudentExerciseDto, i: number) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-background/40 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center font-display text-lg">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ex.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.muscleGroupName} · {ex.dailyExerciseSets?.length || 0} series
                    </p>
                  </div>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )} */}

      {/* Weekly progress */}
      {/* <Card className="bg-gradient-card border-border p-6">
        {user?.role === "student" ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Esta semana</p>
            <h2 className="font-display text-3xl mb-4">Plan</h2>
            <div className="space-y-3">
              {weekRoutineDays.map((d) => {
                return (
                  <Link
                    key={d.id}
                    to="/rutina/$studentId/$dayId"
                    params={{ studentId: user!.studentId.toString(), dayId: d.id }}
                    className="flex items-center gap-3 group"
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-display text-sm transition-all ${
                        d.isToday
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
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Revisión de Clientes
                </p>
                <h2 className="font-display text-3xl">Tus Clientes</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/clientes">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {studentListData?.slice(0, 5).map((student: CoachStudentsDto) => (
                <Link
                  key={student.studentId}
                  to="/clientes/$studentId"
                  params={{ studentId: student.studentId.toString() }}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-display text-sm group-hover:bg-primary/20 group-hover:text-primary-glow">
                    {student.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Ver rutina</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary-glow" />
                </Link>
              ))}
              {!studentListData?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tienes estudiantes asignados.
                </p>
              )}
            </div>
          </>
        )}
      </Card> */}

      {/* Volume chart */}
      {/* <Card className="lg:col-span-3 bg-gradient-card border-border p-6"> */}
      {/* <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Volumen de entrenamiento
              </p>
              <h2 className="font-display text-3xl">Últimas 12 semanas</h2>
            </div>
            <Button variant="ghost" size="sm" asChild> */}
      {/* <Link to="/progreso">Ver todo</Link> */}
      {/* </Button>
          </div> */}
      {/* <div className="h-64"> */}
      {/* <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.17 65)" stopOpacity={0.6} />
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
                    color: "white",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.82 0.17 65)"
                  strokeWidth={2}
                  fill="url(#volumeGrad)"
                />
              </AreaChart>
            </ResponsiveContainer> */}
      {/* </div> */}
      {/* </Card> */}

      {/* Goal progress */}
      {/* <Card className="lg:col-span-3 bg-gradient-card border-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          <GoalRow label="Asistencia mensual" value={84} hint="21 / 25 sesiones" />
          <GoalRow label="Progreso a meta" value={62} hint="Ganar masa muscular" />
          <GoalRow label="Cumplimiento PAR-Q" value={100} hint="Vigente hasta mar 2026" />
        </div>
      </Card> */}
      {/* </div> */}
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-border p-5 ${
        danger ? "bg-destructive/10" : "bg-gradient-card"
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-primary-glow"}`} />
        <p className="text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className={`mt-2 font-display text-5xl leading-none ${danger ? "text-destructive" : ""}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
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
