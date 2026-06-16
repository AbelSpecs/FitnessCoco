import { createFileRoute, Link, notFound, redirect, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RestTimer } from "@/components/ui/restTimer";
import type { DayPlan } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { weekPlan } from "@/lib/mock-data";
import {
  ArrowLeft,
  History,
  PlayCircle,
  Clock,
  Flame,
  CheckCircle2,
  Layers,
  Repeat,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, DayRoutine, Exercise } from "@/types/exercises";
import {
  getDailyStudentExercisesByStudentIdAndDate,
  updateDailyExercisesSets,
  updateDailyStudentExercises,
} from "@/services/routine.service";
import {
  DailyExerciseSetsDto,
  GetDailyStudentExerciseDto,
  UpdateDailyStudentExerciseDto,
} from "@/dtos/exerciseDto";
import { determineDate } from "@/utils/determineDate";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { notify } from "@/components/NotificationCenter";

export const Route = createFileRoute("/rutina/$studentId/$dayId")({
  head: () => ({
    meta: [
      { title: "Rutina del dia — PYROSFIT" },
      { name: "description", content: "Tu entrenamiento del dia." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const exercisesData: GetDailyStudentExerciseDto[] =
        await getDailyStudentExercisesByStudentIdAndDate(Number(params.studentId), params.dayId);

      const mappedExercises: Exercise[] = exercisesData.map((e) => {
        const completeDate: CompleteDate = determineDate(e.scheduledDate);
        return {
          dailyExerciseId: e.id,
          coachId: e.coachId,
          exerciseId: e.exerciseId,
          studentId: e.studentId,
          exerciseName: e.exerciseName,
          muscleGroupName: e.muscleGroupName,
          coachNotes: e.coachNotes,
          studentNotes: e.studentNotes,
          isCompleted: e.isCompleted,
          scheduledDate: e.scheduledDate.split("T")[0],
          day: completeDate.day,
          short: completeDate.short,
          dailyExerciseSets: e.dailyExerciseSets as DailyExerciseSets[],
        };
      });

      return { dayExercises: mappedExercises };
    } catch (error) {
      console.error(error);
      return { initialExercises: [] };
    }
  },
  component: DayDetail,
  notFoundComponent: () => (
    <AppShell>
      <p>Día no encontrado.</p>
    </AppShell>
  ),
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");
    const role = auth && JSON.parse(auth).role !== "student";

    if (role) {
      throw new Error("Unauthorized");
    }

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

function DayDetail() {
  const { dayId } = useParams({ from: "/rutina/$studentId/$dayId" });
  const { dayExercises } = Route.useLoaderData();
  const { user } = useAuthStore();
  const actualDay: DayRoutine = useMemo(() => {
    if (!dayExercises || dayExercises.length === 0) {
      return {
        id: 0,
        scheduledDate: dayId || "",
        name: "Descanso",
        short: "D",
        estimated: "",
        rest: true,
        muscleGroupName: "Descanso",
        exercises: [],
      };
    }

    return {
      id: 0,
      scheduledDate: dayId || "",
      name: dayExercises[0].day,
      short: dayExercises[0].short,
      estimated: "",
      rest: false,
      muscleGroupName: dayExercises[0].muscleGroupName || "Entrenamiento",
      exercises: dayExercises,
    };
  }, [dayExercises, dayId]);

  return (
    <AppShell>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 hover:text-white">
        <Link to="/rutina/$studentId" params={{ studentId: user?.studentId?.toString() ?? "" }}>
          <ArrowLeft className="h-4 w-4" /> Volver a la semana
        </Link>
      </Button>

      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 lg:p-10 mb-5 sm:mb-6">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
            {actualDay?.name}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-none">
            {actualDay?.muscleGroupName}
          </h1>
          {!actualDay?.rest && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-5 text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-glow" /> {actualDay?.estimated} min
              </span>
              <span className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary-glow" /> ~{Number(actualDay?.estimated) * 8}{" "}
                kcal
              </span>
              <Badge variant="secondary">{actualDay?.exercises.length} ejercicios</Badge>
            </div>
          )}
        </div>
      </div>

      {actualDay?.rest ? (
        <Card className="bg-gradient-card border-border p-12 text-center">
          <div className="text-7xl mb-4">🌿</div>
          <h2 className="font-display text-4xl mb-2">Descanso</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Recuperarse es parte del entrenamiento. Hidrátate, duerme bien y mueve el cuerpo con
            calma.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {actualDay?.exercises.map((ex, i) => {
            return <ExerciseRow key={ex.dailyExerciseId} ex={ex} index={i + 1} />;
          })}
        </div>
      )}
    </AppShell>
  );
}

function ExerciseRow({ ex, index }: { ex: Exercise; index: number }) {
  const [finalDone, setFinalDone] = useState(ex.isCompleted);
  const [notes, setNotes] = useState(ex.studentNotes);
  const [showSets, setShowSets] = useState(false);

  const handleExerciseUpdate = async (ex: Exercise) => {
    const exercisetoUpdate: UpdateDailyStudentExerciseDto = {
      isCompleted: true,
      studentNotes: notes,
    };
    try {
      const updatedExercise = await updateDailyStudentExercises(
        ex.dailyExerciseId,
        exercisetoUpdate,
      );
    } catch (error) {
      notify.error("Error al actualizar", "Intenta de nuevo");
      console.error(error);
      return;
    } finally {
      setFinalDone(true);
    }
  };

  return (
    <Card className="bg-gradient-card border-border p-4 sm:p-5 lg:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-display text-lg sm:text-xl shrink-0 ${
            finalDone
              ? "bg-success text-success-foreground"
              : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {finalDone ? <CheckCircle2 className="h-5 w-5" /> : index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="font-display text-xl sm:text-2xl leading-tight break-words">
                {ex.exerciseName}
              </h3>
              {/* <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {set!.setNumber} series × {set!.targetReps} · descanso {set!.restTime}s
              </p> */}
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setShowSets((s) => !s)}
                className="gap-1"
              >
                <Layers className="h-4 w-4" />
                {showSets ? "Ocultar" : "Series"}
                {showSets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              {/* <HistoryDialog ex={set} /> */}
              {/* <VideoDialog ex={set} /> */}
            </div>
          </div>

          {showSets && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {ex.dailyExerciseSets.map((set, index) => {
                return (
                  <DetailsSetsRow key={set.id} exId={ex.dailyExerciseId} set={set} index={index} />
                );
              })}
            </div>
          )}
          <Textarea
            placeholder="Comentarios: sensación, asistencia, dolor, etc."
            value={ex.studentNotes || notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 bg-background/50 min-h-[60px]"
            disabled={finalDone}
          />
          <Button
            variant={finalDone ? "secondary" : "hero"}
            onClick={() => {
              handleExerciseUpdate(ex);
            }}
            className="h-9 text-xs font-medium uppercase tracking-wider truncate"
            disabled={finalDone}
          >
            {finalDone ? "Completado" : "Terminar Ejercicio"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function DetailsSetsRow({
  exId,
  set,
  index,
}: {
  exId: number;
  set: DailyExerciseSets;
  index: number;
}) {
  const [weight, setWeight] = useState(set.actualWeight?.toString() || "");
  const [reps, setReps] = useState(set.actualReps?.toString() || "");
  const [done, setDone] = useState(set.isAchieved);
  const [timerOn, setTimerOn] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const handleSetsUpdate = async (set: DailyExerciseSets, exId: number) => {
    const setToUpdate: DailyExerciseSetsDto = {
      id: set.id,
      dailyStudentExerciseId: exId,
      setNumber: Number(set.setNumber),
      targetReps: Number(set.targetReps),
      targetWeight: Number(set.targetWeight),
      restTime: set.restTime,
      actualReps: Number(reps),
      actualWeight: Number(weight),
      isAchieved: true,
    };

    try {
      const updatedSet = await updateDailyExercisesSets(set.id, setToUpdate);
    } catch (error) {
      notify.error("Error al actualizar el set", "Intenta de nuevo");
      console.error(error);
      return;
    } finally {
      setReps("");
      setWeight("");
      setDone((d) => {
        if (!d) {
          setTimerKey((k) => k + 1);
          setTimerOn(true);
        }
        return !d;
      });
    }
  };

  return (
    <div
      key={set.id || index}
      className="bg-background/20 border border-border/40 rounded-xl p-3 sm:p-4 flex flex-col gap-3.5"
    >
      {/* LADO IZQUIERDO (AHORA ARRIBA): Datos objetivos alineados */}
      <div className="grid grid-cols-3 gap-2 w-full text-center">
        {/* Bloque de Nro Serie */}
        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Layers className="h-3 w-3" /> Set
          </p>
          <p className="text-sm sm:text-base font-bold text-primary-glow">#{set.setNumber}</p>
        </div>

        {/* Bloque de Repeticiones Objetivo */}
        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Repeat className="h-3 w-3" /> Reps
          </p>
          <p className="text-sm sm:text-base font-semibold text-foreground">{set.targetReps}</p>
        </div>

        {/* Bloque de Descanso */}
        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Timer className="h-3 w-3" /> Descanso
          </p>
          <p className="text-sm sm:text-base font-medium text-muted-foreground">{set.restTime}s</p>
        </div>
      </div>

      {/* LADO DERECHO (AHORA ABAJO): Inputs de registro a todo lo ancho */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <Input
          placeholder="Peso (kg)"
          value={set.actualWeight || weight}
          onChange={(e) => setWeight(e.target.value)}
          type="number"
          inputMode="decimal"
          disabled={set.actualWeight ? true : false}
          className="bg-background/50 h-9 text-sm focus-visible:ring-primary-glow w-full"
        />
        <Input
          placeholder="Reps"
          value={set.actualReps || reps}
          onChange={(e) => setReps(e.target.value)}
          type="number"
          inputMode="numeric"
          disabled={set.actualReps ? true : false}
          className="bg-background/50 h-9 text-sm focus-visible:ring-primary-glow w-full"
        />
        <Button
          variant={done ? "secondary" : "hero"}
          onClick={() => {
            handleSetsUpdate(set, exId);
          }}
          className="h-9 text-xs font-medium uppercase tracking-wider w-full truncate"
          disabled={done ? true : false}
        >
          {done ? "Completada" : "Descansar"}
        </Button>
      </div>
      {timerOn && (
        <RestTimer
          key={timerKey}
          seconds={Number(set.restTime)}
          onClose={() => setTimerOn(false)}
        />
      )}
    </div>
  );
}

// function HistoryDialog({ ex }: { ex: Exercise }) {
//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button variant="glass" size="icon" title="Historial">
//           <History className="h-4 w-4" />
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="bg-card border-border max-w-2xl">
//         <DialogHeader>
//           <DialogTitle className="font-display text-2xl sm:text-3xl pr-8 break-words">
//             Historial · {ex.name}
//           </DialogTitle>
//         </DialogHeader>
//         <div className="h-56 sm:h-64 mt-2 -mx-1">
//           {/* <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={ex.history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
//               <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.015 60)" vertical={false} />
//               <XAxis dataKey="date" stroke="oklch(0.7 0.02 70)" fontSize={10} />
//               <YAxis stroke="oklch(0.7 0.02 70)" fontSize={10} />
//               <Tooltip
//                 contentStyle={{
//                   background: "oklch(0.17 0.008 60)",
//                   border: "1px solid oklch(0.26 0.015 60)",
//                   borderRadius: 12,
//                 }}
//               />
//               <Line
//                 type="monotone"
//                 dataKey="weight"
//                 stroke="oklch(0.82 0.17 65)"
//                 strokeWidth={3}
//                 dot={{ fill: "oklch(0.72 0.19 50)", r: 4 }}
//               />
//             </LineChart>
//           </ResponsiveContainer> */}
//         </div>
//         <div className="grid grid-cols-3 gap-2 text-xs mt-2">
//           <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
//             <p className="text-[10px] sm:text-xs text-muted-foreground">Mejor peso</p>
//             <p className="font-display text-xl sm:text-2xl">
//               {Math.max(...ex.history.map((h) => h.weight))} kg
//             </p>
//           </div>
//           <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
//             <p className="text-[10px] sm:text-xs text-muted-foreground">RPE promedio</p>
//             <p className="font-display text-xl sm:text-2xl">
//               {(ex.history.reduce((s, h) => s + h.rpe, 0) / ex.history.length).toFixed(1)}
//             </p>
//           </div>
//           <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
//             <p className="text-[10px] sm:text-xs text-muted-foreground">Sesiones</p>
//             <p className="font-display text-xl sm:text-2xl">{ex.history.length}</p>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// function VideoDialog({ ex }: { ex: Exercise }) {
//   return (
//     <Dialog>
//       <DialogTrigger asChild>
//         <Button variant="glass" size="icon" title="Ver técnica">
//           <PlayCircle className="h-4 w-4" />
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="bg-card border-border max-w-2xl">
//         <DialogHeader>
//           <DialogTitle className="font-display text-2xl sm:text-3xl pr-8 break-words">
//             Técnica · {ex.name}
//           </DialogTitle>
//         </DialogHeader>
//         <div className="aspect-video rounded-xl bg-gradient-hero border border-border flex flex-col items-center justify-center text-center p-4 sm:p-6">
//           <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary-glow mb-3" />
//           <p className="font-display text-xl sm:text-2xl">Vídeo demostración</p>
//           <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-sm">
//             Aquí se mostrará el clip corto con la ejecución correcta del ejercicio (3-8s en loop).
//           </p>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
