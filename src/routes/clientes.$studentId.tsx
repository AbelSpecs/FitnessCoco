import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Timer,
} from "lucide-react";
import { notify } from "@/components/NotificationCenter";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppShell } from "@/components/AppShell";
import { getStudentById } from "@/services/student.service";
import { getUser } from "@/services/user.service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteExercise,
  getExercises,
  getRoutine,
  postExercise,
  postRoutine,
} from "@/services/routine.service";
import { useAuthStore } from "@/store/authStore";
import {
  DailyStudentExerciseDto,
  ExerciseDto,
  GetDailyStudentExerciseDto,
  GetExerciseDto,
} from "@/dtos/exerciseDto";
import { DayRoutine, ExerciseDraft, RoutineDraft } from "@/types/exercises";
import { determineDate } from "@/utils/determineDate";
import DatePicker from "@/components/DatePicker";
import { SpinnerInline, SpinnerOverlay } from "@/components/Spinner";

const emptyExercise = (): ExerciseDraft => ({
  id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  muscle: "",
  sets: "",
  reps: "",
  weight: "",
  coaNotes: "",
  restSec: "",
  scheduledDate: "",
});

export const Route = createFileRoute("/clientes/$studentId")({
  head: () => ({
    meta: [
      { title: "Rutinas del cliente — PyrosFit" },
      { name: "description", content: "Gestiona las rutinas del cliente." },
    ],
  }),
  component: ClientRoutinesPage,
});

function ClientRoutinesPage() {
  const { studentId } = useParams({ from: "/clientes/$studentId" });
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Get States
  const [client, setClient] = useState({ name: "Cliente", goal: "—", plan: "basic" });
  const [routines, setRoutines] = useState<DayRoutine[]>([]);
  const [pendingDelete, setPendingDelete] = useState<DayRoutine | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDateSearch, setSelectedDateSearch] = useState<Date | undefined>(new Date());
  const [getRoutineForm, setGetRoutineForm] = useState<Partial<RoutineDraft>>({
    exercises: [emptyExercise()],
  });
  const [isLoading, setIsLoading] = useState(false);

  // show form states
  const [showForm, setShowForm] = useState(false);
  const [getShowForm, setGetShowForm] = useState<number | string>("");
  // Post state
  const [routineForm, setRoutineForm] = useState<RoutineDraft>({
    routineName: "",
    muscleGroup: "",
    exercises: [emptyExercise()],
  });

  const resetForm = () => {
    setRoutineForm({
      routineName: "",
      muscleGroup: "",
      exercises: [emptyExercise()],
    });
    setSelectedDate(new Date());
  };

  useEffect(() => {
    setIsLoading(true);
    const fetchStudentData = async () => {
      try {
        const studentResponse = await getStudentById(Number(studentId));

        const userResponse = await getUser(studentResponse.userId);

        const client = {
          name: `${userResponse.firstName} ${userResponse.lastName}`,
          goal: studentResponse.fitnessGoal || "—",
          plan: userResponse.planType || "basic",
        };

        setClient(client);
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    const fetchRoutines = async () => {
      try {
        const dailyExercises: GetDailyStudentExerciseDto[] = await getExercises(Number(studentId));

        const exerciseIds = dailyExercises.map(
          (item: GetDailyStudentExerciseDto) => item.exerciseId,
        );

        const routines = await Promise.all(exerciseIds.map((item: number) => getRoutine(item)));

        const formattedRoutine: DayRoutine[] = routines.map((item: GetExerciseDto) => {
          const completeDay = determineDate(
            dailyExercises.find((e) => e.exerciseId === item.id)?.scheduledDate ?? "",
          );

          return {
            id: item.id.toString(),
            day: completeDay.day,
            short: completeDay.short,
            muscle: item.muscleGroup,
            focus: item.muscleGroup,
            scheduledDate: dailyExercises.find((e) => e.exerciseId === item.id)?.scheduledDate,
          };
        });

        setRoutines(formattedRoutine);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching routines:", error);
        setIsLoading(false);
      }
    };

    fetchStudentData();
    fetchRoutines();
  }, [studentId]);

  const handleAdd = () => {
    setShowForm((s) => !s);
  };

  const updateExercise = (id: string, patch: Partial<ExerciseDraft>) => {
    setRoutineForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addExercise = () =>
    setRoutineForm((prev) => ({ ...prev, exercises: [...prev.exercises, emptyExercise()] }));

  const removeExercise = (id: string) =>
    setRoutineForm((prev) => ({
      ...prev,
      exercises:
        prev.exercises.length > 1 ? prev.exercises.filter((e) => e.id !== id) : prev.exercises,
    }));

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      const exerciseDeleted = await deleteExercise(Number(pendingDelete.id));
    } catch (error) {
      console.error("Error al eliminar la rutina", error);
    }

    setRoutines((prev) => prev.filter((r) => r.id !== pendingDelete.id));
    notify.deleted("Rutina eliminada", `${pendingDelete.focus} se quitó de ${client.name}`);
    setPendingDelete(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setRoutineForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRoutine = async () => {
    if (!routineForm.muscleGroup.trim()) {
      notify.error("Falta el grupo muscular", "Indica el grupo muscular principal");
      return;
    }
    const incomplete = routineForm.exercises.some(
      (e) => !e.name.trim() || !e.sets || !e.reps.trim() || !e.restSec,
    );
    if (incomplete) {
      notify.error("Ejercicios incompletos", "Completa todos los campos de cada ejercicio");
      return;
    }

    const routineData: ExerciseDto = {
      exercise: {
        coachId: user!.coachId!,
        name: "Rutina sin título",
        description: `Rutina enfocada en ${routineForm.muscleGroup.trim()} con ${routineForm.exercises.length} ejercicios.`,
        muscleGroup: routineForm.muscleGroup.trim(),
        videoUrl: "",
        isCustom: false,
      },
    };

    try {
      const savedRoutine = await postRoutine(routineData);

      const newRoutine: DayRoutine = {
        id: savedRoutine.id.toString(),
        focus: routineForm.muscleGroup,
        day:
          routineForm.exercises.length > 0 &&
          !isNaN(new Date(routineForm.exercises[0].scheduledDate).getTime())
            ? determineDate(routineForm.exercises[0].scheduledDate).day
            : determineDate(selectedDate!.toISOString()).day,
        short:
          routineForm.exercises.length > 0 &&
          !isNaN(new Date(routineForm.exercises[0].scheduledDate).getTime())
            ? determineDate(routineForm.exercises[0].scheduledDate).short
            : determineDate(selectedDate!.toISOString()).short,
        scheduledDate: selectedDate!.toISOString(),
        rest: false,
      };

      const exercisesData: DailyStudentExerciseDto[] = routineForm.exercises.map((e) => ({
        assign: {
          coachId: user!.coachId!,
          studentId: Number(studentId),
          exerciseId: savedRoutine.id,
          scheduledDate: selectedDate!.toISOString(),
          sets: Number(e.sets),
          reps: e.reps,
          weight: Number(e.weight),
          restTime: e.restSec,
          coachNotes: e.coaNotes,
        },
      }));

      exercisesData.forEach(async (exData) => {
        await postExercise(exData);
      });

      setRoutines((prev) => [newRoutine, ...prev]);
      notify.created(
        "Rutina creada",
        `${newRoutine.focus} con ${routineForm.exercises.length} ${
          routineForm.exercises.length === 1 ? "ejercicio" : "ejercicios"
        } para ${client.name}`,
      );
    } catch (error) {
      console.error("Error al guardar la rutina", error);
      notify.error("Error al guardar", "Ocurrió un error al guardar la rutina. Intenta de nuevo.");
      return;
    }

    resetForm();
    setShowForm(false);
  };

  const handlefetchExercises = async (id: string) => {
    try {
      const dailyExercises: GetDailyStudentExerciseDto[] = await getExercises(Number(studentId));

      const filteredDailyExercises = dailyExercises.filter(
        (item) => item.exerciseId.toString() === id,
      );

      const mappedDailyExercises: ExerciseDraft[] = filteredDailyExercises.map(
        (e, index: number) => ({
          id: index.toString(),
          name: "Ejercicio de la chancla",
          muscle: "Prueba",
          sets: e.sets.toString(),
          reps: e.reps,
          weight: e.weight.toString(),
          coaNotes: e.coachNotes,
          restSec: e.restTime,
          scheduledDate: e.scheduledDate,
        }),
      );

      setGetRoutineForm((prev) => ({
        ...prev,
        exercises: mappedDailyExercises,
      }));
      setGetShowForm(id);
    } catch (error) {
      console.error("Error al obtener los ejercicios", error);
    }
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
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Grupo muscular principal
                  </Label>
                  <Input
                    value={routineForm.muscleGroup}
                    name="muscleGroup"
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Tren superior, pierna..."
                    maxLength={80}
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Nombre de la rutina (opcional)
                  </Label>
                  <Input
                    value={routineForm.routineName}
                    name="routineName"
                    onChange={(e) => handleInputChange(e)}
                    placeholder="Push / Pull / Legs"
                    maxLength={80}
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Fecha Rutina
                  </Label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    placeholder="Fecha Rutina"
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary-glow" />
                  Ejercicios
                </h3>
                <span className="text-xs text-muted-foreground">
                  {routineForm.exercises.length}{" "}
                  {routineForm.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                </span>
              </div>
              <div className="space-y-3 mb-3">
                {routineForm.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="rounded-lg border border-border bg-background/40 p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-display text-primary-glow">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Ejercicio
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        onClick={() => removeExercise(ex.id)}
                        disabled={routineForm.exercises.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Nombre
                        </Label>
                        <Input
                          value={ex.name}
                          name="name"
                          onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                          placeholder="Press banca"
                          maxLength={80}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Músculo
                        </Label>
                        <Input
                          value={ex.muscle}
                          name="muscle"
                          onChange={(e) => updateExercise(ex.id, { muscle: e.target.value })}
                          placeholder="Pecho"
                          maxLength={60}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Series
                        </Label>
                        <Input
                          type="number"
                          name="sets"
                          min={1}
                          max={20}
                          value={ex.sets}
                          onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                          placeholder="4"
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> Reps
                        </Label>
                        <Input
                          value={ex.reps}
                          name="reps"
                          onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                          placeholder="8-10"
                          maxLength={20}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Timer className="h-3 w-3" /> Descanso (s)
                        </Label>
                        <Input
                          type="number"
                          name="restSec"
                          min={0}
                          max={600}
                          value={ex.restSec}
                          onChange={(e) => updateExercise(ex.id, { restSec: e.target.value })}
                          placeholder="90"
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Peso (kg)
                        </Label>
                        <Input
                          type="number"
                          name="weight"
                          min={1}
                          max={100}
                          value={ex.weight}
                          onChange={(e) => updateExercise(ex.id, { weight: e.target.value })}
                          placeholder="10 kg"
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> Coach Notes
                        </Label>
                        <Input
                          value={ex.coaNotes}
                          name="coaNotes"
                          onChange={(e) => updateExercise(ex.id, { coaNotes: e.target.value })}
                          placeholder="Notas del entrenador"
                          maxLength={30}
                          className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={addExercise}
                variant="outline"
                className="w-full border-dashed border-primary/40 hover:bg-primary/10 hover:border-primary/60 mb-5"
              >
                <Plus className="h-4 w-4 mr-1 text-white" />{" "}
                <span className="text-white">Añadir otro ejercicio</span>
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
                  Selecciona el día para asignar la rutina
                </p>
              </div>
            </div>
            <div className="ml-auto">
              <DatePicker
                value={selectedDateSearch}
                onChange={(date) => setSelectedDateSearch(date)}
                placeholder="Elegir fecha"
                size="sm"
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
              {isLoading && <SpinnerOverlay />}
            </Card>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => (
                <Card
                  key={routine.id}
                  className="bg-gradient-card border-border p-4 sm:p-5 hover:border-primary/50 hover:shadow-card transition-all duration-300"
                >
                  <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Dumbbell className="h-5 w-5 text-primary-glow" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg sm:text-xl leading-tight truncate">
                        {routine.focus}
                      </h3>
                      {/* <p className="font-display text-lg sm:text-xl leading-tight truncate">
                        {routine.}
                      </p> */}
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary-glow" />
                          {(() => {
                            const fechaCruda =
                              routine.scheduledDate || routine.exercises?.[0]?.scheduledDate;

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
                        onClick={() => handlefetchExercises(routine.id!)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Ver
                        <ChevronRight className="h-3 w-3 ml-0.5 opacity-60" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDelete(routine)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {getShowForm === routine.id && (
                    <div className="space-y-3 mb-3">
                      {getRoutineForm.exercises!.map((ex, idx) => (
                        <div
                          key={ex.id}
                          className="rounded-lg border border-border bg-background/40 p-3 sm:p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[11px] font-display text-primary-glow">
                                {idx + 1}
                              </div>
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Ejercicio
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                              onClick={() => removeExercise(ex.id)}
                              disabled={getRoutineForm.exercises!.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Nombre
                              </Label>
                              <Input
                                value={ex.name}
                                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                                placeholder="Press banca"
                                maxLength={80}
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Músculo
                              </Label>
                              <Input
                                value={ex.muscle}
                                onChange={(e) => updateExercise(ex.id, { muscle: e.target.value })}
                                placeholder="Pecho"
                                maxLength={60}
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Series
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={ex.sets}
                                onChange={(e) => updateExercise(ex.id, { sets: e.target.value })}
                                placeholder="4"
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> Reps
                              </Label>
                              <Input
                                value={ex.reps}
                                onChange={(e) => updateExercise(ex.id, { reps: e.target.value })}
                                placeholder="8-10"
                                maxLength={20}
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Timer className="h-3 w-3" /> Descanso (s)
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                max={600}
                                value={ex.restSec}
                                onChange={(e) => updateExercise(ex.id, { restSec: e.target.value })}
                                placeholder="90"
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Peso (kg)
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                value={ex.weight}
                                onChange={(e) => updateExercise(ex.id, { weight: e.target.value })}
                                placeholder="10 kg"
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> Coach Notes
                              </Label>
                              <Input
                                value={ex.coaNotes}
                                onChange={(e) =>
                                  updateExercise(ex.id, { coaNotes: e.target.value })
                                }
                                placeholder="Notas del entrenador"
                                maxLength={30}
                                className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 justify-end flex-wrap">
                        <Button variant="outline" className="border-border hover:text-white ">
                          Actualizar
                        </Button>
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
              ))}
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
                <span className="text-foreground font-medium">{pendingDelete?.focus}</span> de{" "}
                {client.name}. Esta acción no se puede deshacer.
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
      </div>
    </AppShell>
  );
}
