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
  PlayCircle,
  Video,
  Plus,
  Lock,
  Link2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { CompleteDate, DailyExerciseSets, DayRoutine, Exercise } from "@/types/exercises";
import {
  getDailyStudentExercisesByStudentIdAndDate,
  updateDailyExercisesSets,
  updateCompleteDailyStudentExercises,
  getExercise,
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
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { ExerciseVideoModal } from "@/components/exercises/ExerciseVideoModal";
import { isUserIndependent, getMuscleGroupsTitle } from "@/utils/exerciseFilter";
import { AddDailyExerciseDialog } from "@/components/exercises/AddDailyExerciseDialog";
import { formatRestTimeDisplay, parseRestTimeToSeconds } from "@/utils/timeFormat";
import { formatWeightWithEquivalent } from "@/utils/weightFormat";
import { WeightInput } from "@/components/exercises/WeightInput";

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

      const mappedExercises: Exercise[] = await Promise.all(
        (exercisesData || []).map(async (e) => {
          const completeDate: CompleteDate = determineDate(e.scheduledDate);
          let videoKey = e.videoKey || e.exercise?.videoKey || null;
          let videoUrl = e.videoUrl || e.exercise?.videoUrl || null;

          if (!videoKey && !videoUrl && e.exerciseId) {
            try {
              const exData = await getExercise(e.exerciseId);
              if (exData) {
                videoKey = exData.videoKey || null;
                videoUrl = exData.videoUrl || null;
              }
            } catch (err) {
              console.warn(`No se pudo obtener detalles del ejercicio ${e.exerciseId}:`, err);
            }
          }

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
            videoKey,
            videoUrl,
            superSetTag: e.superSetTag ?? null,
            superSetOrder: e.superSetOrder ?? null,
          };
        }),
      );

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

interface RoutineTimerContextType {
  isRestTimerRunning: boolean;
  activeSetId: number | string | null;
  startRestTimer: (seconds: number, label: string, setId: number | string) => void;
  closeRestTimer: () => void;
}

const RoutineTimerContext = createContext<RoutineTimerContextType>({
  isRestTimerRunning: false,
  activeSetId: null,
  startRestTimer: () => {},
  closeRestTimer: () => {},
});

function DayDetail() {
  const { dayId } = useParams({ from: "/routine/$studentId/$dayId" });
  const { dayExercises } = Route.useLoaderData();
  const { user } = useAuthStore();
  const [exercisesList, setExercisesList] = useState<Exercise[]>(dayExercises || []);
  const [selectedVideoExercise, setSelectedVideoExercise] = useState<Exercise | null>(null);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [activeTimer, setActiveTimer] = useState<{
    seconds: number;
    label: string;
    setId: number | string;
    isRunning: boolean;
    key: number;
  } | null>(null);

  const startRestTimer = (seconds: number, label: string, setId: number | string) => {
    setActiveTimer({
      seconds,
      label,
      setId,
      isRunning: true,
      key: Date.now(),
    });
  };

  const handleTimerFinish = () => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: false } : null));
    notify.success("¡Descanso completado!", "Listo para continuar con tu siguiente serie 🔥");
  };

  const handleTimerRestart = () => {
    setActiveTimer((prev) => (prev ? { ...prev, isRunning: true } : null));
  };

  const closeRestTimer = () => {
    setActiveTimer(null);
  };

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
      muscleGroupName: getMuscleGroupsTitle(exercisesList),
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

  const handleExerciseAdded = (newEx: Exercise) => {
    setExercisesList((prev) => [...prev, newEx]);
  };

  const handleSetUpdate = (exerciseId: number, updatedSet: DailyExerciseSets) => {
    setExercisesList((prev) =>
      prev.map((item) =>
        item.dailyExerciseId === exerciseId
          ? {
              ...item,
              dailyExerciseSets: item.dailyExerciseSets.map((s) =>
                s.id === updatedSet.id ? updatedSet : s,
              ),
            }
          : item,
      ),
    );
  };

  return (
    <RoutineTimerContext.Provider
      value={{
        isRestTimerRunning: !!activeTimer?.isRunning,
        activeSetId: activeTimer?.setId ?? null,
        startRestTimer,
        closeRestTimer,
      }}
    >
      <AppShell>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 hover:text-white">
          <Link to="/routine/$studentId" params={{ studentId: user?.studentId?.toString() ?? "" }}>
            <ArrowLeft className="h-4 w-4" /> Volver a la semana
          </Link>
        </Button>

        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-6 lg:p-10 mb-5 sm:mb-6">
          <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
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
            {isUserIndependent(user) && (
              <Button
                onClick={() => setShowAddExerciseModal(true)}
                className="bg-gradient-primary hover:opacity-90 shadow-glow self-start sm:self-auto shrink-0 cursor-pointer"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Agregar ejercicio
              </Button>
            )}
          </div>
        </div>

        {actualDay?.rest ? (
          <Card className="bg-gradient-card border-border p-12 text-center">
            <div className="text-7xl mb-4">🌿</div>
            <h2 className="font-display text-4xl mb-2">Descanso</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Recuperarse es parte del entrenamiento. Hidrátate, duerme bien y mueve el cuerpo con
              calma.
            </p>
            {isUserIndependent(user) && (
              <Button
                onClick={() => setShowAddExerciseModal(true)}
                className="bg-gradient-primary hover:opacity-90 shadow-glow cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Agregar ejercicio a este día
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {actualDay?.exercises.map((ex, i) => {
              const prevEx = i > 0 ? actualDay.exercises[i - 1] : null;
              const isNewSuperSetBlock = Boolean(
                ex.superSetTag && (!prevEx || prevEx.superSetTag !== ex.superSetTag),
              );

              return (
                <div key={ex.dailyExerciseId} className="space-y-2">
                  {isNewSuperSetBlock && (
                    <div className="flex items-center justify-between gap-2 py-2 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shadow-sm mt-3 first:mt-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-bold tracking-wide uppercase text-[11px]">
                          Serie Combinada #{ex.superSetTag}
                        </span>
                        <span className="hidden sm:inline text-amber-200/80">
                          • Realiza 1 set de cada ejercicio antes de descansar
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-300 bg-amber-500/10 text-[10px]"
                      >
                        Descanso único al final
                      </Badge>
                    </div>
                  )}
                  <ExerciseRow
                    ex={ex}
                    index={i + 1}
                    allExercises={actualDay.exercises}
                    onComplete={handleExerciseComplete}
                    onOpenVideo={(exercise) => setSelectedVideoExercise(exercise)}
                    onSetUpdate={handleSetUpdate}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Modal reproductor de video demostrativo */}
        <ExerciseVideoModal
          exercise={selectedVideoExercise}
          isOpen={!!selectedVideoExercise}
          onClose={() => setSelectedVideoExercise(null)}
        />

        {/* Modal para agregar ejercicios de forma rápida (independientes) */}
        {isUserIndependent(user) && (
          <AddDailyExerciseDialog
            isOpen={showAddExerciseModal}
            onClose={() => setShowAddExerciseModal(false)}
            studentId={Number(user?.studentId || 0)}
            scheduledDate={dayId || format(new Date(), "yyyy-MM-dd")}
            onExerciseAdded={handleExerciseAdded}
            existingExercises={actualDay?.exercises || []}
          />
        )}

        {/* Temporizador de descanso flotante único */}
        {activeTimer && (
          <RestTimer
            key={activeTimer.key}
            seconds={activeTimer.seconds}
            label={activeTimer.label}
            onClose={closeRestTimer}
            onFinish={handleTimerFinish}
            onRestart={handleTimerRestart}
          />
        )}
      </AppShell>
    </RoutineTimerContext.Provider>
  );
}

function ExerciseRow({
  ex,
  index,
  allExercises = [],
  onComplete,
  onOpenVideo,
  onSetUpdate,
}: {
  ex: Exercise;
  index: number;
  allExercises?: Exercise[];
  onComplete: (ex: Exercise, notes?: string) => Promise<void>;
  onOpenVideo: (ex: Exercise) => void;
  onSetUpdate: (exerciseId: number, updatedSet: DailyExerciseSets) => void;
}) {
  const { isRestTimerRunning } = useContext(RoutineTimerContext);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(ex.studentNotes || "");
  const [showSets, setShowSets] = useState(false);
  const hasVideo = !!(ex.videoKey?.trim() || ex.videoUrl?.trim());

  // Detectar grupo de serie combinada
  const superSetGroup = useMemo(() => {
    const tag = (ex.superSetTag || "").trim();
    if (!tag) return [];
    return allExercises
      .filter((item) => (item.superSetTag || "").trim().toLowerCase() === tag.toLowerCase())
      .sort((a, b) => (Number(a.superSetOrder) || 0) - (Number(b.superSetOrder) || 0));
  }, [allExercises, ex.superSetTag]);

  const isSuperSet = superSetGroup.length > 1;
  const totalInSuperSet = superSetGroup.length;
  const groupIndex = superSetGroup.findIndex((item) => item.dailyExerciseId === ex.dailyExerciseId);
  const isFirstInSuperSet = isSuperSet && groupIndex === 0;
  const isLastInSuperSet = isSuperSet && groupIndex === superSetGroup.length - 1;
  const nextExerciseInSuperSet =
    isSuperSet && groupIndex >= 0 && groupIndex < superSetGroup.length - 1
      ? superSetGroup[groupIndex + 1]
      : null;

  // Tiempo de descanso combinado unificado establecido en la serie combinada
  const combinedRestTime = useMemo(() => {
    if (!isSuperSet) return undefined;
    const found = superSetGroup.find(
      (e) => e.dailyExerciseSets?.[0]?.restTime && e.dailyExerciseSets[0].restTime !== "0",
    );
    return found?.dailyExerciseSets?.[0]?.restTime || ex.dailyExerciseSets?.[0]?.restTime || "60";
  }, [isSuperSet, superSetGroup, ex.dailyExerciseSets]);

  const handleFinish = async () => {
    if (ex.isCompleted || loading || isRestTimerRunning) return;
    setLoading(true);
    try {
      await onComplete(ex, notes);
    } catch (error) {
      console.error("Error al finalizar ejercicio:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedSets = useMemo(() => {
    return [...ex.dailyExerciseSets].sort(
      (a, b) => (Number(a.setNumber) || 0) - (Number(b.setNumber) || 0),
    );
  }, [ex.dailyExerciseSets]);

  return (
    <Card
      className={cn(
        "bg-gradient-card border-border p-4 sm:p-5 lg:p-6 transition-all",
        isSuperSet && "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.06)]",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-display text-lg sm:text-xl shrink-0 ${
            ex.isCompleted
              ? "bg-success text-success-foreground"
              : isSuperSet
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {ex.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index}
        </div>

        <div className="flex-1 min-w-0">
          {/* TAG / ETIQUETA VISIBLE DE SERIE COMBINADA */}
          {isSuperSet && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40 gap-1.5 text-xs py-0.5 px-2.5 font-semibold shadow-sm">
                <Link2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Serie Combinada #{ex.superSetTag}</span>
                {ex.superSetOrder && (
                  <span className="text-amber-200/90 font-normal">
                    • Ejercicio {ex.superSetOrder} de {totalInSuperSet}
                  </span>
                )}
              </Badge>
              {isFirstInSuperSet && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-400/90 text-[10px] py-0 px-2"
                >
                  1° en la combinación
                </Badge>
              )}
              {isLastInSuperSet && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400/90 text-[10px] py-0 px-2"
                >
                  Cierre de ronda (Activa descanso)
                </Badge>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="font-display text-xl sm:text-2xl leading-tight break-words">
                {ex.exerciseName}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasVideo && (
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => onOpenVideo(ex)}
                  className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                  title="Reproducir video demostrativo"
                >
                  <PlayCircle className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">Ver video</span>
                  <span className="sm:hidden">Video</span>
                </Button>
              )}
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

          {/* Miniatura de video si está disponible */}
          {hasVideo && (
            <div className="mt-2.5 mb-3">
              <button
                type="button"
                onClick={() => onOpenVideo(ex)}
                className="group relative block w-full sm:max-w-xs aspect-video rounded-xl overflow-hidden border border-border/70 hover:border-primary/60 bg-black/60 shadow-md text-left transition-all hover:shadow-glow cursor-pointer"
                title={`Ver técnica de ${ex.exerciseName}`}
              >
                <VideoThumbnail
                  videoKey={ex.videoKey}
                  videoUrl={ex.videoUrl}
                  alt={`Video demostrativo de ${ex.exerciseName}`}
                  showPlayBadge={true}
                  hoverPlay={true}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-white flex items-center gap-1.5 drop-shadow">
                    <PlayCircle className="h-4 w-4 text-primary" /> Ver movimiento
                  </span>
                  <Badge className="bg-primary/80 hover:bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-5 border-0">
                    Reproducir
                  </Badge>
                </div>
              </button>
            </div>
          )}

          {showSets && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {sortedSets.map((set, setIdx) => {
                let isLocked = false;
                let lockReason = "";

                if (isSuperSet) {
                  // Regla 1: Series anteriores en este mismo ejercicio deben estar completas
                  const prevSetsInCurrent = sortedSets.slice(0, setIdx);
                  if (!prevSetsInCurrent.every((s) => Boolean(s.isAchieved))) {
                    isLocked = true;
                    lockReason = "Completa tu serie anterior en este ejercicio";
                  }

                  // Regla 2: Los ejercicios anteriores de la combinación deben haber completado esta misma serie
                  if (!isLocked) {
                    const priorExercises = superSetGroup.slice(0, groupIndex);
                    for (const priorEx of priorExercises) {
                      const priorSorted = [...(priorEx.dailyExerciseSets || [])].sort(
                        (a, b) => (Number(a.setNumber) || 0) - (Number(b.setNumber) || 0),
                      );
                      const targetPriorSet = priorSorted[setIdx];
                      if (targetPriorSet && !targetPriorSet.isAchieved) {
                        isLocked = true;
                        lockReason = `Completa primero el Set #${setIdx + 1} de ${priorEx.exerciseName}`;
                        break;
                      }
                    }
                  }

                  // Regla 3: Si setIdx > 0, los ejercicios posteriores de la combinación deben haber completado la ronda anterior (setIdx - 1)
                  if (!isLocked && setIdx > 0) {
                    const laterExercises = superSetGroup.slice(groupIndex + 1);
                    for (const laterEx of laterExercises) {
                      const laterSorted = [...(laterEx.dailyExerciseSets || [])].sort(
                        (a, b) => (Number(a.setNumber) || 0) - (Number(b.setNumber) || 0),
                      );
                      const targetPrevSet = laterSorted[setIdx - 1];
                      if (targetPrevSet && !targetPrevSet.isAchieved) {
                        isLocked = true;
                        lockReason = `Completa la ronda anterior en ${laterEx.exerciseName} antes de iniciar el Set #${setIdx + 1}`;
                        break;
                      }
                    }
                  }
                } else {
                  // Ejercicio estándar individual
                  isLocked =
                    setIdx > 0 &&
                    !sortedSets.slice(0, setIdx).every((prevSet) => Boolean(prevSet.isAchieved));
                  if (isLocked) {
                    lockReason = "Completa la serie anterior antes de continuar";
                  }
                }

                return (
                  <DetailsSetsRow
                    key={set.id}
                    exId={ex.dailyExerciseId}
                    set={set}
                    index={setIdx}
                    isLocked={isLocked}
                    lockReason={lockReason}
                    isSuperSet={isSuperSet}
                    isLastInSuperSet={isLastInSuperSet}
                    nextExerciseName={nextExerciseInSuperSet?.exerciseName}
                    nextExerciseOrder={nextExerciseInSuperSet?.superSetOrder}
                    combinedRestTime={combinedRestTime}
                    onSetUpdate={onSetUpdate}
                  />
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
            className={cn(
              "h-9 text-xs font-medium uppercase tracking-wider truncate transition-all",
              !ex.isCompleted && isRestTimerRunning && "opacity-50 cursor-not-allowed",
            )}
            disabled={ex.isCompleted || loading || isRestTimerRunning}
            title={
              !ex.isCompleted && isRestTimerRunning
                ? "No puedes terminar el ejercicio mientras el descanso está en curso"
                : undefined
            }
          >
            {ex.isCompleted
              ? "Completado"
              : loading
                ? "Guardando..."
                : isRestTimerRunning
                  ? "Descanso en curso..."
                  : "Terminar Ejercicio"}
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
  isLocked = false,
  lockReason = "",
  isSuperSet = false,
  isLastInSuperSet = false,
  nextExerciseName,
  nextExerciseOrder,
  combinedRestTime,
  onSetUpdate,
}: {
  exId: number;
  set: DailyExerciseSets;
  index: number;
  isLocked?: boolean;
  lockReason?: string;
  isSuperSet?: boolean;
  isLastInSuperSet?: boolean;
  nextExerciseName?: string;
  nextExerciseOrder?: number | null;
  combinedRestTime?: string;
  onSetUpdate?: (exId: number, updatedSet: DailyExerciseSets) => void;
}) {
  const { isRestTimerRunning, startRestTimer } = useContext(RoutineTimerContext);

  const getInitialWeight = (s: DailyExerciseSets) => {
    if (s.isAchieved) {
      return s.actualWeight !== undefined && s.actualWeight !== null
        ? s.actualWeight.toString()
        : "";
    }
    return s.actualWeight ? s.actualWeight.toString() : "";
  };

  const getInitialReps = (s: DailyExerciseSets) => {
    if (s.isAchieved) {
      return s.actualReps !== undefined && s.actualReps !== null ? s.actualReps.toString() : "";
    }
    return s.actualReps ? s.actualReps.toString() : "";
  };

  const [weight, setWeight] = useState(getInitialWeight(set));
  const [reps, setReps] = useState(getInitialReps(set));
  const [done, setDone] = useState(Boolean(set.isAchieved));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (set.isAchieved) {
      setDone(true);
      if (set.actualWeight !== undefined && set.actualWeight !== null) {
        setWeight(set.actualWeight.toString());
      }
      if (set.actualReps !== undefined && set.actualReps !== null) {
        setReps(set.actualReps.toString());
      }
    } else {
      if (set.actualWeight) {
        setWeight(set.actualWeight.toString());
      }
      if (set.actualReps) {
        setReps(set.actualReps.toString());
      }
      setDone(false);
    }
  }, [set.actualWeight, set.actualReps, set.isAchieved]);

  const handleSetsUpdate = async (set: DailyExerciseSets, exId: number) => {
    if (isRestTimerRunning || done || isSaving || isLocked) return;

    const actualRepsNum = Number(reps) || 0;
    const actualWeightNum = Number(weight) || 0;

    const setToUpdate: DailyExerciseSetsDto = {
      id: set.id,
      dailyStudentExerciseId: exId,
      setNumber: Number(set.setNumber),
      targetReps: Number(set.targetReps),
      targetWeight: Number(set.targetWeight),
      restTime: set.restTime,
      actualReps: actualRepsNum,
      actualWeight: actualWeightNum,
      isAchieved: true,
    };

    setIsSaving(true);
    try {
      await updateDailyExercisesSets(set.id, setToUpdate);
      setDone(true);

      const updatedSetObj: DailyExerciseSets = {
        ...set,
        actualReps: actualRepsNum,
        actualWeight: actualWeightNum,
        isAchieved: true,
      };

      onSetUpdate?.(exId, updatedSetObj);

      // Si es ejercicio combinado y NO es el último de la combinación:
      // Pasar directo al siguiente ejercicio sin activar el cronómetro
      if (isSuperSet && !isLastInSuperSet) {
        notify.info(
          "¡Set completado!",
          nextExerciseName
            ? `Pasa directo a ${nextExerciseName} (${nextExerciseOrder ? `Ejercicio #${nextExerciseOrder}` : "siguiente"}) sin descanso ⚡`
            : "Pasa directo al siguiente ejercicio de la combinación ⚡",
        );
        return;
      }

      // Si es ejercicio normal O si es el último de la combinación:
      // Iniciar el cronómetro de descanso para toda la ronda
      const effectiveRestTime = isSuperSet ? (combinedRestTime || set.restTime) : set.restTime;
      const restSec = parseRestTimeToSeconds(effectiveRestTime);
      if (restSec > 0) {
        const timerLabel = isSuperSet
          ? `Descanso Combinado • Ronda #${set.setNumber}`
          : `Set #${set.setNumber}`;
        startRestTimer(restSec, timerLabel, set.id);
        if (isSuperSet) {
          notify.success("¡Ronda combinada completada!", `Iniciando descanso de ${restSec}s 🔥`);
        }
      }
    } catch (error) {
      notify.error("Error al actualizar el set", "Intenta de nuevo");
      console.error("Error al actualizar set:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      key={set.id || index}
      className={cn(
        "bg-background/20 border border-border/40 rounded-xl p-3 sm:p-4 flex flex-col gap-3.5 transition-all",
        isLocked && "opacity-60 bg-background/10",
        done && "border-success/30 bg-success/5",
      )}
    >
      {/* LADO IZQUIERDO (AHORA ARRIBA): Datos objetivos alineados */}
      <div className="grid grid-cols-4 gap-2 w-full text-center">
        {/* Bloque de Nro Serie */}
        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Layers className="h-3 w-3" /> Set
          </p>
          <p className="text-sm sm:text-base font-bold text-primary-glow flex items-center justify-center gap-1">
            #{set.setNumber}
            {isLocked && (
              <span title={lockReason || "Bloqueada hasta completar la serie anterior"}>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </span>
            )}
            {done && <CheckCircle2 className="h-3 w-3 text-success" />}
          </p>
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
            <Layers className="h-3 w-3" /> Peso
          </p>
          <p className="text-sm sm:text-base font-semibold text-foreground">
            {formatWeightWithEquivalent(set.targetWeight)}
          </p>
        </div>

        {/* Bloque de Descanso */}
        <div className="bg-background/40 rounded-lg py-2 px-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
            <Timer className="h-3 w-3" /> Descanso
          </p>
          <p className="text-sm sm:text-base font-medium text-muted-foreground">
            {isSuperSet && !isLastInSuperSet ? (
              <span
                className="text-amber-400 font-semibold text-xs flex items-center justify-center gap-0.5"
                title="Sin descanso intermedio: pasa directo al siguiente ejercicio"
              >
                <Zap className="h-3 w-3" /> Directo
              </span>
            ) : isSuperSet && isLastInSuperSet ? (
              <span
                className="text-emerald-400 font-semibold text-xs flex items-center justify-center gap-0.5"
                title="Descanso único de la ronda combinada"
              >
                <Timer className="h-3 w-3" /> Único: {formatRestTimeDisplay(combinedRestTime || set.restTime)}
              </span>
            ) : (
              formatRestTimeDisplay(set.restTime)
            )}
          </p>
        </div>
      </div>

      {/* LADO DERECHO (AHORA ABAJO): Inputs de registro a todo lo ancho */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Peso Logrado
          </Label>
          <WeightInput
            value={weight}
            onChange={(val) => setWeight(val)}
            disabled={done || isSaving || isLocked}
            compact
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <Repeat className="h-3 w-3" /> Repeticiones Logradas
          </Label>
          <Input
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            type="number"
            inputMode="numeric"
            disabled={done || isSaving || isLocked}
            className="bg-background/50 h-9 text-sm focus-visible:ring-primary-glow w-full"
          />
        </div>
        <Button
          variant={done ? "secondary" : "hero"}
          onClick={() => {
            handleSetsUpdate(set, exId);
          }}
          className={cn(
            "h-9 text-xs font-medium uppercase tracking-wider w-full truncate transition-all",
            !done && (isRestTimerRunning || isLocked) && "opacity-50 cursor-not-allowed",
            !done &&
              !isLocked &&
              !isRestTimerRunning &&
              isSuperSet &&
              !isLastInSuperSet &&
              "border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 shadow-sm",
            !done &&
              !isLocked &&
              !isRestTimerRunning &&
              isSuperSet &&
              isLastInSuperSet &&
              "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow hover:opacity-90",
          )}
          disabled={done || isRestTimerRunning || isSaving || isLocked}
          title={
            isLocked
              ? lockReason || "Debes completar la serie anterior antes de continuar"
              : !done && isRestTimerRunning
                ? "Descanso en curso. Espera a que el cronómetro termine o ciérralo."
                : undefined
          }
        >
          {isSaving ? (
            "Guardando..."
          ) : done ? (
            "Completada"
          ) : isRestTimerRunning ? (
            <span className="flex items-center justify-center gap-1">
              <Timer className="h-3 w-3 animate-pulse" /> En descanso
            </span>
          ) : isLocked ? (
            <span className="flex items-center justify-center gap-1 opacity-80">
              <Lock className="h-3 w-3" /> Bloqueada
            </span>
          ) : isSuperSet && !isLastInSuperSet ? (
            <span className="flex items-center justify-center gap-1 text-amber-200">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Pasa a #{nextExerciseOrder || 2}</span>
            </span>
          ) : isSuperSet && isLastInSuperSet ? (
            <span className="flex items-center justify-center gap-1">
              <Timer className="h-3.5 w-3.5" />
              <span>Descanso ({parseRestTimeToSeconds(combinedRestTime || set.restTime)}s)</span>
            </span>
          ) : (
            "Descansar"
          )}
        </Button>
      </div>
    </div>
  );
}
