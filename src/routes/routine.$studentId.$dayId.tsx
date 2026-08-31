import { createFileRoute, Link, notFound, redirect, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RestTimer } from "@/components/ui/restTimer";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Repeat,
  Timer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, DayRoutine, Exercise } from "@/types/exercises";
import {
  getDailyStudentExercisesByStudentIdAndDate,
  updateDailyExercisesSets,
  updateCompleteDailyStudentExercises,
} from "@/services/routine.service";
import { postWorkoutCompleted } from "@/services/streak.service";
import {
  DailyExerciseSetsDto,
  GetDailyStudentExerciseDto,
  UpdateCompleteDailyStudentExerciseDto,
} from "@/dtos/exerciseDto";
import { determineDate } from "@/utils/determineDate";
import { format } from "date-fns";
import { notify } from "@/components/NotificationCenter";

export const Route = createFileRoute("/routine/$studentId/$dayId")({
  head: () => ({
    meta: [
      { title: "Rutina del dia — PYROSFIT" },
      { name: "description", content: "Tu entrenamiento del dia." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const exercisesData: GetDailyStudentExerciseDto[] =
        await getDailyStudentExercisesByStudentIdAndDate(
          Number(params.studentId),
          params.dayId,
        ).catch((err) => {
          console.warn("No se pudieron obtener ejercicios para el día:", err);
          return [];
        });

      const mappedExercises: Exercise[] = (exercisesData || []).map((e) => {
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
          scheduledDate: e.scheduledDate ? e.scheduledDate.split("T")[0] : "",
          day: completeDate.day,
          short: completeDate.short,
          dailyExerciseSets: (e.dailyExerciseSets as DailyExerciseSets[]) || [],
        };
      });

      return { dayExercises: mappedExercises };
    } catch (error) {
      console.error("Error al cargar la rutina del día:", error);
      return { dayExercises: [] };
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
    if (!auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
    const parsed = JSON.parse(auth);
    if (parsed.role !== "student") {
      throw redirect({
        to: "/",
      });
    }
  },
});

function DayDetail() {
  const { dayId } = useParams({ from: "/routine/$studentId/$dayId" });
  const { dayExercises } = Route.useLoaderData();
  const { user } = useAuthStore();
  const [exercisesList, setExercisesList] = useState<Exercise[]>(dayExercises || []);

  useEffect(() => {
    setExercisesList(dayExercises || []);
  }, [dayExercises]);

  const actualDay: DayRoutine = useMemo(() => {
    if (!exercisesList || exercisesList.length === 0) {
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
      name: exercisesList[0].day,
      short: exercisesList[0].short,
      estimated: "",
      rest: false,
      muscleGroupName: exercisesList[0].muscleGroupName || "Entrenamiento",
      exercises: exercisesList,
    };
  }, [exercisesList, dayId]);

  const handleExerciseComplete = async (ex: Exercise, studentNotes?: string) => {
    const exercisetoUpdate: UpdateCompleteDailyStudentExerciseDto = {
      isCompleted: true,
      studentNotes: studentNotes || "",
    };

    try {
      await updateCompleteDailyStudentExercises(ex.dailyExerciseId, exercisetoUpdate);

      const nextList = exercisesList.map((item) =>
        item.dailyExerciseId === ex.dailyExerciseId
          ? { ...item, isCompleted: true, studentNotes: studentNotes || item.studentNotes }
          : item,
      );
      setExercisesList(nextList);

      const allCompleted = nextList.length > 0 && nextList.every((item) => item.isCompleted);

      if (allCompleted) {
        const dateStr = ex.scheduledDate
          ? ex.scheduledDate.split("T")[0]
          : dayId || format(new Date(), "yyyy-MM-dd");
        const isoActivityDate = `${dateStr}T12:00:00Z`;

        await postWorkoutCompleted({
          studentId: Number(ex.studentId || user?.studentId),
          activityDate: isoActivityDate,
        });

        notify.success(
          "¡Rutina completada!",
          "Has completado todos los ejercicios del día. Racha y progreso actualizados 🔥",
        );
      } else {
        notify.success("¡Ejercicio completado!", "Progreso guardado 💪");
      }
    } catch (error) {
      notify.error("Error al actualizar", "Intenta de nuevo");
      console.error("Error al completar ejercicio:", error);
      throw error;
    }
  };

  return (
    <AppShell>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 hover:text-white">
        <Link to="/routine/$studentId" params={{ studentId: user?.studentId?.toString() ?? "" }}>
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
            return (
              <ExerciseRow
                key={ex.dailyExerciseId}
                ex={ex}
                index={i + 1}
                onComplete={handleExerciseComplete}
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function ExerciseRow({
  ex,
  index,
  onComplete,
}: {
  ex: Exercise;
  index: number;
  onComplete: (ex: Exercise, notes?: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(ex.studentNotes || "");
  const [showSets, setShowSets] = useState(false);

  const handleFinish = async () => {
    if (ex.isCompleted || loading) return;
    setLoading(true);
    try {
      await onComplete(ex, notes);
    } catch (error) {
      console.error("Error al finalizar ejercicio:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border p-4 sm:p-5 lg:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-display text-lg sm:text-xl shrink-0 ${
            ex.isCompleted
              ? "bg-success text-success-foreground"
              : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {ex.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="font-display text-xl sm:text-2xl leading-tight break-words">
                {ex.exerciseName}
              </h3>
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
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 bg-background/50 min-h-[60px]"
            disabled={ex.isCompleted || loading}
          />
          <Button
            variant={ex.isCompleted ? "secondary" : "hero"}
            onClick={handleFinish}
            className="h-9 text-xs font-medium uppercase tracking-wider truncate"
            disabled={ex.isCompleted || loading}
          >
            {ex.isCompleted ? "Completado" : loading ? "Guardando..." : "Terminar Ejercicio"}
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
      await updateDailyExercisesSets(set.id, setToUpdate);
    } catch (error) {
      notify.error("Error al actualizar el set", "Intenta de nuevo");
      console.error("Error al actualizar set:", error);
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
      <div className="grid grid-cols-4 gap-2 w-full text-center">
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
            <Repeat className="h-3 w-3" /> Repeticiones
          </p>
          <p className="text-sm sm:text-base font-semibold text-foreground">{set.targetReps}</p>
        </div>

        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Layers className="h-3 w-3" /> Peso (kg)
          </p>
          <p className="text-sm sm:text-base font-semibold text-foreground">{set.targetWeight}</p>
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
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Peso Logrado
          </Label>
          <Input
            placeholder="Peso (kg)"
            value={set.actualWeight || weight}
            onChange={(e) => setWeight(e.target.value)}
            type="number"
            inputMode="decimal"
            disabled={set.actualWeight ? true : false}
            className="bg-background/50 h-9 text-sm focus-visible:ring-primary-glow w-full"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Repeat className="h-3 w-3" /> Repeticiones Logradas
          </Label>
          <Input
            placeholder="Reps"
            value={set.actualReps || reps}
            onChange={(e) => setReps(e.target.value)}
            type="number"
            inputMode="numeric"
            disabled={set.actualReps ? true : false}
            className="bg-background/50 h-9 text-sm focus-visible:ring-primary-glow w-full"
          />
        </div>
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