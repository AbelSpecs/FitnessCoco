import { createFileRoute, Link, createLazyRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, TrendingUp, Dumbbell, ChevronRight, Zap, Trophy } from "lucide-react";
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
  calculateWeeklyVolume,
  calculateRoutineDurationInMin,
} from "@/helpers/studentsHelper";
import { useMemo } from "react";
import { getStudents } from "@/services/student.service";
import {
  getDailyStudentExercisesByStudentIdAndDate,
  getDailyStudentExercisesByStudentIdAndDates,
} from "@/services/routine.service";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { GetDailyStudentExerciseDto } from "@/dtos/exerciseDto";
import { getSixDaysLaterFormatted } from "@/helpers/generics";

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
        const [completeStudentsList, studentListData] = await Promise.all([
          getStudents(),
          getCoachStudents(coachId),
        ]);

        return {
          role,
          completeStudentsList,
          studentListData,
          dailyExercises: undefined,
          weeklyExercises: undefined,
        };
      }

      const todayStr = format(new Date(), "yyyy-MM-dd");
      const sixDaysLaterStr = getSixDaysLaterFormatted(new Date());

      const [dailyExercises, weeklyExercises] = await Promise.all([
        getDailyStudentExercisesByStudentIdAndDate(studentId, todayStr),
        getDailyStudentExercisesByStudentIdAndDates(studentId, todayStr, sixDaysLaterStr),
      ]);

      return {
        role,
        completeStudentsList: undefined,
        studentListData: undefined,
        dailyExercises,
        weeklyExercises,
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  },
  component: Dashboard,
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

function Dashboard() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  const todayPlan = weekPlan[todayIndex];
  const { user } = useAuthStore();
  const { completeStudentsList, studentListData, role, dailyExercises, weeklyExercises } =
    Route.useLoaderData();

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
  const dailyDuration = useMemo(
    () => (dailyExercises ? calculateRoutineDurationInMin(dailyExercises as any) : 0),
    [dailyExercises],
  );
  const dailyFocus = useMemo(() => {
    if (!dailyExercises || dailyExercises.length === 0) return todayPlan.focus;
    const groups = Array.from(
      new Set((dailyExercises as any).map((ex: any) => ex.muscleGroupName).filter(Boolean)),
    );
    return groups.length > 0 ? groups.join(", ") : todayPlan.focus;
  }, [dailyExercises, todayPlan.focus]);

  const weeklyStreak = useMemo(
    () => (weeklyExercises ? calculateWeeklyStreak(weeklyExercises) : 0),
    [weeklyExercises],
  );
  const weeklyVolume = useMemo(
    () => (weeklyExercises ? calculateWeeklyVolume(weeklyExercises) : 0),
    [weeklyExercises],
  );

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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
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
                  label="Volumen Mensual"
                  value={`${weeklyVolume} kg`}
                  hint="peso levantado"
                />
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's workout */}
        {user?.role === "student" && (
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
        )}

        {/* Weekly progress */}
        <Card className="bg-gradient-card border-border p-6">
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
        </Card>

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
