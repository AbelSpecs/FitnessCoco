import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Dumbbell,
  Calendar,
  ChevronRight,
  X,
  Save,
  Layers,
  Repeat,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { notify } from "@/components/NotificationCenter";
import { AppShell } from "@/components/AppShell";
import { getStudentById } from "@/services/student.service";
import { getUser } from "@/services/user.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteExercise,
  getDailyStudentExercisesByStudentIdAndDate,
  getExercise,
  getExerciseByMuscleGroupId,
  getMuscleGroups,
  postDailyStudentExercises,
  postExercise,
} from "@/services/routine.service";
import { useAuthStore } from "@/store/authStore";
import {
  DailyExerciseSetsDto,
  DailyStudentExerciseDto,
  ExerciseDto,
  GetDailyExerciseSetsDto,
  GetDailyStudentExerciseDto,
  GetMuscleGroupDto,
} from "@/dtos/exerciseDto";
import {
  DailyExerciseSets,
  DailyExerciseSetsForm,
  Exercise,
  ExerciseForm,
  ExerciseSelect,
  MuscleGroupSelect,
  NewExercise,
} from "@/types/exercises";
import { determineDate } from "@/utils/determineDate";
import DatePicker from "@/components/DatePicker";
import { SpinnerOverlay } from "@/components/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exercisesMapper } from "@/mappers/exercises";

const emptySet = (): DailyExerciseSetsForm => ({
  id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  setNumber: "",
  targetReps: "",
  targetWeight: "",
  restTime: "",
  isAchieved: false,
});

export const Route = createFileRoute("/clientes/$studentId")({
  head: () => ({
    meta: [
      { title: "Rutinas del cliente — PyrosFit" },
      { name: "description", content: "Gestiona las rutinas del cliente." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const studentResponse = await getStudentById(Number(params.studentId));
      const [userResponse, dailyExercises, muscleGroups] = await Promise.all([
        getUser(studentResponse.userId),
        getDailyStudentExercisesByStudentIdAndDate(
          Number(params.studentId),
          new Date().toISOString(),
        ),
        getMuscleGroups(),
      ]);

      const client = {
        name: `${userResponse.firstName} ${userResponse.lastName}`,
        goal: studentResponse.fitnessGoal || "—",
        plan: userResponse.planType || "basic",
      };

      const completeExercisesMapped: Exercise[] = exercisesMapper(dailyExercises);

      const muscleGroupsMapped: MuscleGroupSelect[] = muscleGroups.map((m: GetMuscleGroupDto) => ({
        id: m.id,
        name: m.name,
      }));

      return {
        client,
        completeExercisesMapped,
        muscleGroupsMapped,
      };
    } catch (error) {
      console.error("Error fetching:", error);
      throw error;
    }
  },
  pendingComponent: () => <SpinnerOverlay />,
  pendingMs: 0,
  component: ClientRoutinesPage,
});

function ClientRoutinesPage() {
  const { studentId } = useParams({ from: "/clientes/$studentId" });
  const { user } = useAuthStore();
  const {
    client,
    completeExercisesMapped,
    muscleGroupsMapped: muscleGroups,
  } = Route.useLoaderData();

  // Get States
  const [routines, setRoutines] = useState<Exercise[]>(completeExercisesMapped);
  const [exercises, setExercises] = useState<ExerciseSelect[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateSearch, setSelectedDateSearch] = useState<Date | undefined>(new Date());
  const [getExerciseSetForm, setGetExerciseSetRoutineForm] = useState<DailyExerciseSets[]>([]);
  // const [isLoading, setIsLoading] = useState(false);

  // new exercise
  const [pendingExercises, setPendingExercises] = useState<NewExercise[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewExerciseDialog, setShowNewExerciseDialog] = useState(false);
  const [newExerciseForm, setNewExerciseForm] = useState<NewExercise>({
    name: "",
    muscleGroupId: 0,
  });

  // show form states
  const [showForm, setShowForm] = useState(false);
  const [getShowForm, setGetShowForm] = useState<number | string>("");
  // Post state
  const [savedRoutine, setSavedRoutine] = useState(false);
  const [routineForm, setRoutineForm] = useState<ExerciseForm>({
    exerciseId: 0,
    exerciseName: "",
    muscleGroupId: 0,
    muscleGroupName: "",
    description: "",
    coachNotes: "",
    scheduledDate: new Date().toISOString(),
    dailyExerciseSets: [emptySet()],
  });

  const resetForm = () => {
    setRoutineForm({
      exerciseId: 0,
      exerciseName: "",
      muscleGroupId: 0,
      muscleGroupName: "",
      description: "",
      coachNotes: "",
      scheduledDate: new Date().toISOString(),
      dailyExerciseSets: [emptySet()],
    });
    setSelectedDate(new Date());
  };

  const newExerciseFormReset = () => {
    setNewExerciseForm({
      name: "",
      muscleGroupId: 0,
    });
  };

  const handleAdd = () => {
    setShowForm((s) => !s);
  };

  const updateSet = (id: string, patch: Partial<DailyExerciseSets>) => {
    setRoutineForm((prev) => ({
      ...prev,
      dailyExerciseSets: prev.dailyExerciseSets.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const addSet = () =>
    setRoutineForm((prev) => ({
      ...prev,
      dailyExerciseSets: [...prev.dailyExerciseSets, emptySet()],
    }));

  const removeSet = (id: string) =>
    setRoutineForm((prev) => ({
      ...prev,
      dailyExerciseSets:
        prev.dailyExerciseSets.length > 1
          ? prev.dailyExerciseSets.filter((s) => s.id !== id)
          : prev.dailyExerciseSets,
    }));

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      const exerciseDeleted = await deleteExercise(Number(pendingDelete.dailyExerciseId));
      setRoutines((prev) =>
        prev.filter((r) => r.dailyExerciseId !== pendingDelete.dailyExerciseId),
      );
      notify.deleted(
        "Rutina eliminada",
        `${pendingDelete.exerciseName} se quitó de ${client.name}`,
      );
    } catch (error) {
      console.error("Error al eliminar la rutina", error);
      throw error;
    } finally {
      setPendingDelete(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement, HTMLTextAreaElement>,
    isNew: boolean = false,
  ) => {
    const { name, value } = e.target;

    if (isNew) {
      setNewExerciseForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setRoutineForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExercises = async (muscleGroupId: number, isNew: boolean = false) => {
    if (isNew) {
      setNewExerciseForm((prev) => ({ ...prev, muscleGroupId: muscleGroupId }));
      return;
    }
    console.log(muscleGroupId);

    setRoutineForm((prev) => ({ ...prev, muscleGroupId: muscleGroupId }));
    try {
      //@TODO @abel estos ejercicios deberian venir por coach
      //aunque esto se puede hablar
      const exercises = await getExerciseByMuscleGroupId(muscleGroupId);

      setExercises(exercises);
    } catch (error) {
      console.error("Error al obtener los ejercicios", error);
    }
  };

  const handleSearchDatePickerDate = async (date: Date | undefined) => {
    if (!date) return;

    setSelectedDateSearch(new Date(date.toISOString()));

    try {
      const updatedRoutines: GetDailyStudentExerciseDto[] =
        await getDailyStudentExercisesByStudentIdAndDate(Number(studentId), date.toISOString());

      const completeExercisesMapped: Exercise[] = exercisesMapper(updatedRoutines);
      setRoutines(completeExercisesMapped);
    } catch (error) {
      console.error("Error fetching:", error);
      throw error;
    }
  };

  const handleSaveNewExercise = async () => {
    setSaved(true);
    const name = newExerciseForm.name.trim();
    if (!name) {
      notify.error("Falta el nombre", "Escribe el nombre del ejercicio");
      return;
    }
    //@TODO @abel esto debe a;adirsele una comparacion con el coachID
    //esperar que @keiver haga el endpoint
    if (exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      notify.error("Ya existe", "Ese ejercicio ya está en la lista");
      return;
    }

    const newExercise: ExerciseDto = {
      exercise: {
        coachId: user!.coachId!,
        name: newExerciseForm.name,
        description: "",
        muscleGroupId: newExerciseForm.muscleGroupId!,
        videoUrl: "",
        isCustom: true,
      },
    };

    try {
      const newExerciseResponse = await postExercise(newExercise);
      setPendingExercises([
        ...pendingExercises,
        {
          name: newExerciseForm.name,
          muscleGroupId: newExerciseForm.muscleGroupId!,
        } as NewExercise,
      ]);

      setNewExerciseForm({
        name: "",
        muscleGroupId: 0,
      });
      notify.created("Ejercicio guardado", `Pulsa el botón de refrescar para verlo en la lista`);
    } catch (error) {
      console.error("Error al crear el ejercicio", error);
      notify.error("Error al crear", "Ocurrió un error al crear el ejercicio. Intenta de nuevo.");
      throw error;
    } finally {
      setSaved(false);
      setShowNewExerciseDialog(false);
    }
  };

  const handleRefreshExercises = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const exercises = await getExerciseByMuscleGroupId(routineForm.muscleGroupId);
      setExercises(exercises);
    } catch (error) {
      console.error("Error al refrescar", error);
      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveRoutine = async () => {
    setSavedRoutine(true);
    if (!routineForm.muscleGroupId) {
      notify.error("Falta el grupo muscular", "Selecciona grupo muscular");
      return;
    }

    if (!routineForm.exerciseId) {
      notify.error("Falta el ejercicio", "Selecciona ejercicio");
      return;
    }

    const incomplete = routineForm.dailyExerciseSets.some((e) => !e.targetReps || !e.targetWeight);
    if (incomplete) {
      notify.error("Sets incompletos", "Completa los campos para cada serie");
      return;
    }

    const dailyExerciseSetsData: DailyExerciseSetsDto[] = routineForm.dailyExerciseSets.map(
      (set, index) => {
        return {
          id: 0,
          dailyStudentExerciseId: 0,
          setNumber: Number(index + 1),
          targetReps: Number(set.targetReps),
          targetWeight: Number(set.targetWeight),
          restTime: set.restTime,
          isAchieved: false,
        };
      },
    );

    const dailyExerciseData: DailyStudentExerciseDto = {
      assign: {
        coachId: user!.coachId!,
        studentId: Number(studentId),
        exerciseId: routineForm.exerciseId,
        scheduledDate: selectedDate!.toISOString(),
        dailyExerciseSets: dailyExerciseSetsData,
        coachNotes: routineForm.coachNotes!,
      },
    };

    try {
      const exercisesResponse = await postDailyStudentExercises(dailyExerciseData);

      const exerciseExtraData = await getExercise(exercisesResponse.exerciseId);

      const completeDay = determineDate(exercisesResponse.scheduledDate).day;
      const shortDay = determineDate(exercisesResponse.scheduledDate).short;

      const newRoutine: Exercise = {
        exerciseId: exercisesResponse.exerciseId,
        coachId: exercisesResponse.coachId,
        dailyExerciseId: exercisesResponse.id,
        studentId: exercisesResponse.studentId,
        exerciseName: exerciseExtraData.name,
        muscleGroupName: exerciseExtraData.muscleGroup,
        coachNotes: exercisesResponse.coachNotes,
        scheduledDate: exercisesResponse.scheduledDate,
        day: completeDay,
        short: shortDay,
        dailyExerciseSets: exercisesResponse.dailyExerciseSets.map(
          (set: GetDailyExerciseSetsDto) => set,
        ),
      };

      setRoutines((prev) => [newRoutine, ...prev]);

      notify.created(
        "Rutina creada",
        `${newRoutine.exerciseName} con ${routineForm.dailyExerciseSets.length} ${
          routineForm.dailyExerciseSets.length === 1 ? "ejercicio" : "ejercicios"
        } para ${client.name}`,
      );
    } catch (error) {
      console.error("Error al guardar la rutina", error);
      notify.error("Error al guardar", "Ocurrió un error al guardar la rutina. Intenta de nuevo.");
      throw error;
    } finally {
      setSavedRoutine(false);
      resetForm();
      setShowForm(false);
    }
  };

  const handleViewExerciseDetails = async (exercise: Exercise) => {
    setGetExerciseSetRoutineForm(exercise.dailyExerciseSets);
    setGetShowForm(exercise.dailyExerciseId);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link
            to="/clientes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a clientes
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-primary flex items-center justify-center font-display text-2xl text-primary-foreground shrink-0 shadow-glow">
                {client.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-1">
                  Cliente
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
                  {client.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant="secondary" className="uppercase text-[10px] tracking-widest">
                    {client.plan}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">{client.goal}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleAdd}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-1" /> Añadir rutina
            </Button>
          </div>

          {showForm && (
            <Card className="relative z-20 bg-popover/95 backdrop-blur-xl border-primary/40 shadow-elevated p-5 sm:p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary-glow mb-1">
                    Nueva rutina
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary-glow" />
                    Crear rutina
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label
                    className="text-[11px] uppercase tracking-widest text-muted-foreground"
                    htmlFor="muscleGroup"
                  >
                    Grupo Muscular
                  </Label>
                  <SearchableSelect
                    value={routineForm.muscleGroupId ? String(routineForm.muscleGroupId) : ""}
                    placeholder="Selecciona el grupo Muscular"
                    options={muscleGroups.map((e) => ({ value: e.id.toString(), label: e.name }))}
                    onValueChange={(value) => {
                      handleExercises(Number(value));
                    }}
                    className="mt-1.5 bg-background/60 border-border focus:ring-primary/40 hover:text-white"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <div className="w-[100%]">
                    <Label
                      className="text-[11px] uppercase tracking-widest text-muted-foreground"
                      htmlFor="exercise"
                    >
                      Ejercicio
                    </Label>
                    <SearchableSelect
                      value={routineForm.muscleGroupId ? String(routineForm.exerciseId) : ""}
                      placeholder="Selecciona ejercicio"
                      options={exercises.map((e) => ({ value: e.id.toString(), label: e.name }))}
                      onValueChange={(value) => {
                        setRoutineForm((prev) => ({ ...prev, exerciseId: Number(value) }));
                      }}
                      className="mt-1.5 bg-background/60 border-border focus:ring-primary/40 hover:text-white"
                    />
                    <div className="text-center mb-5">
                      <button
                        type="button"
                        onClick={() => setShowNewExerciseDialog(true)}
                        className="text-xs sm:text-sm text-muted-foreground transition-colors underline-offset-4"
                      >
                        ¿No encuentras el ejercicio?{" "}
                        <span className="text-primary-glow font-medium cursor-pointer">
                          Crea uno
                        </span>
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRefreshExercises}
                    disabled={refreshing}
                    title={
                      pendingExercises.length > 0
                        ? `Refrescar (${pendingExercises.length} ${pendingExercises.length === 1 ? "" : "s"})`
                        : "Refrescar lista de ejercicios"
                    }
                    className="relative h-7 w-7 rounded-md border border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary-glow"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    {pendingExercises.length > 0 && !refreshing && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary shadow-glow" />
                    )}
                  </Button>
                </div>
                {/* <div className="flex items-center gap-2"></div> */}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Notas del Entrenador
                  </Label>
                  <Textarea
                    value={routineForm.coachNotes}
                    name="coachNotes"
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Notas"
                    maxLength={500}
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Notas del Cliente
                  </Label>
                  <Textarea
                    value={routineForm.studentNotes}
                    name="studentNotes"
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Notas del cliente"
                    maxLength={500}
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                    disabled
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Fecha Ejercicio
                  </Label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="Fecha Ejercicio"
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-glow" />
                  Series
                </h3>
                <span className="text-xs text-muted-foreground">
                  {routineForm.dailyExerciseSets.length}{" "}
                  {routineForm.dailyExerciseSets.length === 1 ? "serie" : "series"}
                </span>
              </div>
              <div className="space-y-3 mb-3">
                {routineForm.dailyExerciseSets.map((set, index) => (
                  <div
                    key={set.id}
                    className="rounded-lg border border-border bg-background/40 p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-display text-primary-glow">
                          {index + 1}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Serie
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        onClick={() => removeSet(set.id.toString())}
                        disabled={routineForm.dailyExerciseSets.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          Repeticiones
                        </Label>
                        <Input
                          value={set.targetReps}
                          name="targetReps"
                          onChange={(e) =>
                            updateSet(set.id.toString(), { targetReps: e.target.value })
                          }
                          placeholder="12"
                          type="number"
                          min={1}
                          max={50}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Peso (kg)
                        </Label>
                        <Input
                          type="number"
                          name="targetWeight"
                          min={1}
                          max={500}
                          value={set.targetWeight}
                          onChange={(e) =>
                            updateSet(set.id.toString(), { targetWeight: e.target.value })
                          }
                          placeholder="100"
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> Descanso (s)
                        </Label>
                        <Input
                          value={set.restTime}
                          name="restTime"
                          onChange={(e) =>
                            updateSet(set.id.toString(), { restTime: e.target.value })
                          }
                          placeholder="90"
                          type="number"
                          min={0}
                          max={1200}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={addSet}
                variant="outline"
                className="w-full border-dashed border-primary/40 hover:bg-primary/10 hover:border-primary/60 mb-5"
              >
                <Plus className="h-4 w-4 mr-1 text-white" />{" "}
                <span className="text-white">Añadir otro set</span>
              </Button>
              <div className="flex items-center gap-3 justify-end flex-wrap">
                <Button
                  variant="outline"
                  className="border-border hover:text-white"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveRoutine}
                  className="bg-gradient-primary hover:opacity-90 shadow-glow"
                  disabled={savedRoutine}
                >
                  <Save className="h-4 w-4 mr-1" /> Guardar rutina
                </Button>
              </div>
            </Card>
          )}
          <Card className="bg-gradient-card border-border p-4 sm:p-5 mb-4 flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-primary-glow" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow leading-tight">
                  Fecha de los ejercicios
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  Selecciona día para buscar rutinas asignadas a esa fecha.
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <DatePicker
                value={selectedDateSearch}
                onChange={(date) => handleSearchDatePickerDate(date)}
                placeholder="Elegir fecha"
                size="lg"
                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
              />
            </div>
          </Card>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl sm:text-2xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary-glow" />
              Rutinas asignadas
            </h2>
            <span className="text-xs text-muted-foreground">
              {routines.length} {routines.length === 1 ? "rutina" : "rutinas"}
            </span>
          </div>
          {routines.length === 0 ? (
            <Card className="bg-gradient-card border-border p-10 text-center">
              <p className="text-muted-foreground mb-4">
                Este cliente todavía no tiene rutinas asignadas.
              </p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="border-primary/40 hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-1" /> Crear la primera
              </Button>
              {/* {isLoading && <SpinnerOverlay />} */}
            </Card>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => {
                const today = new Date();
                const routineDay = new Date(routine.scheduledDate);
                today.setHours(0, 0, 0, 0);
                routineDay.setHours(0, 0, 0, 0);
                const isFutureRoutine = routineDay.getTime() > today.getTime();
                return (
                  <Card
                    key={routine.exerciseId}
                    className="bg-gradient-card border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-card transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap mb-5">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <Dumbbell className="h-5 w-5 text-primary-glow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg sm:text-xl leading-tight truncate">
                          {routine.exerciseName}
                        </h3>
                        {/* <p className="font-display text-lg sm:text-xl leading-tight truncate">
                        {routine.}
                      </p> */}
                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary-glow" />
                            {(() => {
                              const fechaCruda = routine.scheduledDate;

                              if (!fechaCruda) return <span>Sin fecha asignada</span>;

                              const parsedDate = new Date(fechaCruda);
                              const esValida = !isNaN(parsedDate.getTime());

                              return esValida ? (
                                <>
                                  <span>Asignada para: </span>
                                  <span className="font-semibold text-foreground">
                                    {parsedDate.toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      timeZone: "UTC",
                                    })}
                                  </span>
                                </>
                              ) : (
                                <span>Cargando fecha...</span>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                          onClick={() => handleViewExerciseDetails(routine)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver
                          <ChevronRight className="h-3 w-3 ml-0.5 opacity-60" />
                        </Button>
                        {isFutureRoutine && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setPendingDelete(routine)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {getShowForm === routine.dailyExerciseId && (
                      <div className="space-y-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                          <div>
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                              Notas del Cliente
                            </Label>
                            <Textarea
                              value={routineForm.studentNotes}
                              placeholder="notas del cliente"
                              className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              disabled
                            />
                          </div>
                        </div>
                        {getExerciseSetForm.map((exerciseSet, index) => (
                          <div
                            key={exerciseSet.id}
                            className="rounded-lg border border-border bg-background/40 p-3 sm:p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-display text-primary-glow">
                                  {index + 1}
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                  Serie
                                </span>
                              </div>
                              {isFutureRoutine && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                                  onClick={() => removeSet(exerciseSet.id.toString())}
                                  disabled={getExerciseSetForm.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                  Repeticiones
                                </Label>
                                <Input
                                  value={exerciseSet.targetReps}
                                  onChange={(e) =>
                                    updateSet(exerciseSet.id.toString(), {
                                      targetReps: e.target.value,
                                    })
                                  }
                                  placeholder="4"
                                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  <Layers className="h-3 w-3" /> Peso (kg)
                                </Label>
                                <Input
                                  value={exerciseSet.targetWeight}
                                  onChange={(e) =>
                                    updateSet(exerciseSet.targetWeight.toString(), {
                                      targetWeight: e.target.value,
                                    })
                                  }
                                  placeholder="10 kg"
                                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                                  disabled
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  <Repeat className="h-3 w-3" /> Descanso (s)
                                </Label>
                                <Input
                                  value={exerciseSet.restTime}
                                  onChange={(e) =>
                                    updateSet(exerciseSet.id.toString(), {
                                      restTime: e.target.value,
                                    })
                                  }
                                  placeholder="90 s"
                                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                                  disabled
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  Repeticiones Conseguidas
                                </Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={50}
                                  value={exerciseSet.actualReps}
                                  onChange={(e) =>
                                    updateSet(exerciseSet.id.toString(), {
                                      actualReps: Number(e.target.value),
                                    })
                                  }
                                  placeholder="90"
                                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                              <div>
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  <Layers className="h-3 w-3" /> Peso Conseguido (kg)
                                </Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={700}
                                  value={exerciseSet.actualWeight}
                                  onChange={(e) =>
                                    updateSet(exerciseSet.id.toString(), {
                                      actualWeight: Number(e.target.value),
                                    })
                                  }
                                  placeholder="10 kg"
                                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 justify-end flex-wrap">
                          {isFutureRoutine && (
                            <Button variant="outline" className="border-border hover:text-white ">
                              Actualizar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            className="border-border hover:text-white"
                            onClick={() => {
                              setGetShowForm("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        <AlertDialog
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent className="bg-popover/95 backdrop-blur-xl border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl">
                ¿Eliminar rutina?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vas a eliminar{" "}
                <span className="text-foreground font-medium">{pendingDelete?.exerciseName}</span>{" "}
                de {client.name}. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={showNewExerciseDialog}
          onOpenChange={(open) => {
            setShowNewExerciseDialog(open);
            if (!open) {
              newExerciseFormReset();
            }
          }}
        >
          <DialogContent className="bg-popover/95 backdrop-blur-xl border-primary/40 shadow-elevated sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-glow" />
                Crear ejercicio
              </DialogTitle>
              <DialogDescription>
                Añade un ejercicio nuevo. Después pulsa el botón de refrescar para verlo en la
                lista.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label
                  className="text-[11px] uppercase tracking-widest text-muted-foreground"
                  htmlFor="muscleGroup"
                >
                  Grupo Muscular
                </Label>
                <Select
                  value={newExerciseForm.muscleGroupId ? String(newExerciseForm.muscleGroupId) : ""}
                  onValueChange={(value) => {
                    handleExercises(Number(value), true);
                  }}
                >
                  <SelectTrigger id="muscleGroup" className="bg-input/60">
                    <SelectValue placeholder="Selecciona el grupo Muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups?.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)} className="focus:text-white">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Nombre del ejercicio
                </Label>
                <Input
                  value={newExerciseForm.name}
                  name="name"
                  onChange={(e) => handleInputChange(e, true)}
                  placeholder="Press inclinado con mancuernas"
                  maxLength={80}
                  autoFocus
                  className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setShowNewExerciseDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNewExercise}
                className="bg-gradient-primary hover:opacity-90 shadow-glow"
                disabled={saved}
              >
                <Save className="h-4 w-4 mr-1" /> Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
