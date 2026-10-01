import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dumbbell,
  Plus,
  Trash2,
  Layers,
  Repeat,
  RefreshCw,
  Sparkles,
  X,
  Save,
  Calendar,
  Loader2,
} from "lucide-react";
import { notify } from "@/components/NotificationCenter";
import { useAuthStore } from "@/store/authStore";
import {
  filterExercisesForUser,
  formatExerciseDescriptionWithStudentId,
  isUserIndependent,
} from "@/utils/exerciseFilter";
import {
  getMuscleGroups,
  getExerciseByMuscleGroupId,
  postDailyStudentExercises,
  getExercise,
  postExercise,
} from "@/services/routine.service";
import {
  getPresignedVideoUrl,
  uploadFileToPresignedUrl,
  getFileContentType,
} from "@/services/storage.service";
import { ExerciseVideoSelector } from "@/components/exercises/ExerciseVideoSelector";
import { determineDate } from "@/utils/determineDate";
import {
  DailyExerciseSetsForm,
  Exercise,
  ExerciseSelect,
  MuscleGroupSelect,
  NewExercise,
} from "@/types/exercises";
import {
  DailyExerciseSetsDto,
  DailyStudentExerciseDto,
  ExerciseDto,
  GetDailyExerciseSetsDto,
  GetMuscleGroupDto,
} from "@/dtos/exerciseDto";

interface AddDailyExerciseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  scheduledDate: string; // "YYYY-MM-DD"
  onExerciseAdded: (exercise: Exercise) => void;
}

const createEmptySet = (): DailyExerciseSetsForm => ({
  id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  setNumber: "",
  targetReps: "12",
  targetWeight: "20",
  restTime: "90",
  isAchieved: false,
});

export function AddDailyExerciseDialog({
  isOpen,
  onClose,
  studentId,
  scheduledDate,
  onExerciseAdded,
}: AddDailyExerciseDialogProps) {
  const { user } = useAuthStore();

  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupSelect[]>([]);
  const [exercises, setExercises] = useState<ExerciseSelect[]>([]);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<number | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [sets, setSets] = useState<DailyExerciseSetsForm[]>([createEmptySet()]);
  const [saving, setSaving] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // New Exercise Dialog State
  const [showNewExerciseDialog, setShowNewExerciseDialog] = useState<boolean>(false);
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: "",
    muscleGroupId: 0,
    videoUrl: "",
    description: "",
  });
  const [newExerciseVideoMode, setNewExerciseVideoMode] = useState<"url" | "upload">("url");
  const [selectedExerciseVideoFile, setSelectedExerciseVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [savingNewExercise, setSavingNewExercise] = useState<boolean>(false);
  const [pendingExercises, setPendingExercises] = useState<NewExercise[]>([]);

  // Load Muscle Groups on mount/open
  useEffect(() => {
    if (!isOpen) return;
    const fetchMuscleGroups = async () => {
      try {
        const groups = await getMuscleGroups();
        setMuscleGroups(groups.map((m: GetMuscleGroupDto) => ({ id: m.id, name: m.name })));
      } catch (err) {
        console.error("Error al cargar grupos musculares:", err);
      }
    };
    fetchMuscleGroups();
  }, [isOpen]);

  // Load exercises when muscle group changes
  const handleMuscleGroupChange = async (muscleGroupId: number) => {
    setSelectedMuscleGroupId(muscleGroupId);
    setSelectedExerciseId(null);
    try {
      const raw = await getExerciseByMuscleGroupId(muscleGroupId);
      const visible = filterExercisesForUser(raw, user, studentId);
      setExercises(visible);
    } catch (err) {
      console.error("Error al obtener ejercicios:", err);
      notify.error("Error", "No se pudieron cargar los ejercicios");
    }
  };

  const handleRefreshExercises = async () => {
    if (!selectedMuscleGroupId || refreshing) return;
    setRefreshing(true);
    try {
      const raw = await getExerciseByMuscleGroupId(selectedMuscleGroupId);
      const visible = filterExercisesForUser(raw, user, studentId);
      setExercises(visible);
      notify.success("Lista actualizada", "Ejercicios recargados");
    } catch (err) {
      console.error("Error al refrescar ejercicios:", err);
      notify.error("Error", "No se pudieron refrescar los ejercicios");
    } finally {
      setRefreshing(false);
    }
  };

  // Set management
  const addSet = () => {
    setSets((prev) => [...prev, createEmptySet()]);
  };

  const removeSet = (id: string | number) => {
    if (sets.length <= 1) return;
    setSets((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSet = (id: string | number, patch: Partial<DailyExerciseSetsForm>) => {
    setSets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const resetForm = () => {
    setSelectedMuscleGroupId(null);
    setSelectedExerciseId(null);
    setExercises([]);
    setNotes("");
    setSets([createEmptySet()]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Save Exercise Assignment
  const handleSave = async () => {
    if (!selectedMuscleGroupId) {
      notify.error("Falta grupo muscular", "Selecciona el grupo muscular");
      return;
    }
    if (!selectedExerciseId) {
      notify.error("Falta ejercicio", "Selecciona el ejercicio a realizar");
      return;
    }

    const incomplete = sets.some((s) => !s.targetReps || !s.targetWeight || !s.restTime);
    if (incomplete) {
      notify.error("Sets incompletos", "Completa las repeticiones, peso y descanso para cada serie");
      return;
    }

    setSaving(true);
    try {
      const dailyExerciseSetsData: DailyExerciseSetsDto[] = sets.map((set, idx) => ({
        id: 0,
        dailyStudentExerciseId: 0,
        setNumber: idx + 1,
        targetReps: Number(set.targetReps),
        targetWeight: Number(set.targetWeight),
        restTime: set.restTime,
        isAchieved: false,
      }));

      const payload: DailyStudentExerciseDto = {
        assign: {
          coachId: Number(user?.coachId || user?.myCoachId || 9),
          studentId: Number(studentId),
          exerciseId: selectedExerciseId,
          scheduledDate: scheduledDate,
          dailyExerciseSets: dailyExerciseSetsData,
          coachNotes: notes || "",
        },
      };

      const response = await postDailyStudentExercises(payload);
      const extraData = await getExercise(response.exerciseId);
      const dateInfo = determineDate(response.scheduledDate);

      const newExercise: Exercise = {
        exerciseId: response.exerciseId,
        coachId: response.coachId,
        dailyExerciseId: response.id,
        studentId: response.studentId,
        exerciseName: extraData.name,
        muscleGroupName: extraData.muscleGroup,
        coachNotes: response.coachNotes,
        studentNotes: response.studentNotes,
        isCompleted: response.isCompleted,
        scheduledDate: response.scheduledDate ? response.scheduledDate.split("T")[0] : scheduledDate,
        day: dateInfo.day,
        short: dateInfo.short,
        dailyExerciseSets: (response.dailyExerciseSets || []).map((s: GetDailyExerciseSetsDto) => ({
          ...s,
          setNumber: String(s.setNumber),
          targetReps: String(s.targetReps),
          targetWeight: String(s.targetWeight),
          restTime: String(s.restTime),
        })),
        videoKey: extraData.videoKey || null,
        videoUrl: extraData.videoUrl || null,
      };

      notify.created("Ejercicio agregado", `${newExercise.exerciseName} se añadió a la rutina`);
      onExerciseAdded(newExercise);
      handleClose();
    } catch (err) {
      console.error("Error al guardar ejercicio en la rutina:", err);
      notify.error("Error al guardar", "Ocurrió un error al añadir el ejercicio a la rutina");
    } finally {
      setSaving(false);
    }
  };

  // Save Brand New Custom Exercise
  const handleSaveNewExercise = async () => {
    const name = newExerciseForm.name.trim();
    if (!name) {
      notify.error("Falta el nombre", "Escribe el nombre del ejercicio");
      return;
    }
    if (!newExerciseForm.muscleGroupId) {
      notify.error("Falta grupo muscular", "Selecciona el grupo muscular");
      return;
    }

    setSavingNewExercise(true);
    try {
      let finalVideoKey = "";

      if (newExerciseVideoMode === "upload" && selectedExerciseVideoFile) {
        setIsUploadingVideo(true);
        setVideoUploadProgress(0);

        const tempId = Math.floor(Date.now() % 100000000);
        const contentType = getFileContentType(selectedExerciseVideoFile);
        const presign = await getPresignedVideoUrl({
          trainerId: user?.coachId || 0,
          exerciseId: tempId,
          fileName: selectedExerciseVideoFile.name,
          contentType,
          expiresInSeconds: 600,
        });

        await uploadFileToPresignedUrl(
          presign.uploadUrl,
          selectedExerciseVideoFile,
          contentType,
          (pct) => setVideoUploadProgress(pct),
        );
        finalVideoKey = presign.key;
      } else if (newExerciseVideoMode === "url") {
        finalVideoKey = newExerciseForm.videoUrl?.trim() || "";
      }

      const independent = isUserIndependent(user);
      const userDesc = newExerciseForm.description?.trim() || "";
      let finalDesc = userDesc;
      if (independent && studentId) {
        finalDesc = formatExerciseDescriptionWithStudentId(userDesc, Number(studentId));
      }

      const exerciseDto: ExerciseDto = {
        exercise: {
          coachId: independent ? null : user?.coachId || null,
          name: name,
          description: finalDesc,
          muscleGroupId: newExerciseForm.muscleGroupId,
          videoKey: finalVideoKey || null,
          videoUrl: finalVideoKey || null,
          isCustom: true,
        },
      };

      await postExercise(exerciseDto);

      setPendingExercises((prev) => [
        ...prev,
        {
          name: name,
          muscleGroupId: newExerciseForm.muscleGroupId,
          videoUrl: finalVideoKey,
          videoKey: finalVideoKey,
        } as NewExercise,
      ]);

      // If the selected muscle group matches, automatically select this muscle group and refresh list
      setSelectedMuscleGroupId(newExerciseForm.muscleGroupId);
      const raw = await getExerciseByMuscleGroupId(newExerciseForm.muscleGroupId);
      const visible = filterExercisesForUser(raw, user, studentId);
      setExercises(visible);

      // Auto-select newly created exercise
      const foundNew = visible.find((e) => e.name.toLowerCase() === name.toLowerCase());
      if (foundNew) {
        setSelectedExerciseId(foundNew.id);
      }

      notify.created("Ejercicio creado", "El ejercicio está disponible para seleccionarlo");
      setShowNewExerciseDialog(false);
      setNewExerciseForm({ name: "", muscleGroupId: 0, videoUrl: "", description: "" });
      setSelectedExerciseVideoFile(null);
    } catch (err) {
      console.error("Error al crear nuevo ejercicio:", err);
      notify.error("Error al crear", "Ocurrió un error al registrar el ejercicio");
    } finally {
      setSavingNewExercise(false);
      setIsUploadingVideo(false);
    }
  };

  const dateDetails = determineDate(scheduledDate);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-primary/40 shadow-elevated max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary-glow text-xs uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dateDetails.day || scheduledDate}</span>
            </div>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary-glow" />
              Agregar ejercicio a la rutina
            </DialogTitle>
            <DialogDescription>
              Selecciona el ejercicio, define las series y añádelo directamente al entrenamiento de este día.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Muscle Group & Exercise */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Grupo Muscular
                </Label>
                <SearchableSelect
                  value={selectedMuscleGroupId ? String(selectedMuscleGroupId) : ""}
                  placeholder="Selecciona grupo muscular"
                  options={muscleGroups.map((g) => ({ value: String(g.id), label: g.name }))}
                  onValueChange={(val) => handleMuscleGroupChange(Number(val))}
                  className="mt-1.5 bg-background/60 border-border focus:ring-primary/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Ejercicio
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRefreshExercises}
                    disabled={!selectedMuscleGroupId || refreshing}
                    title="Refrescar lista"
                    className="h-6 w-6 rounded-md hover:text-primary-glow"
                  >
                    <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <SearchableSelect
                  value={selectedExerciseId ? String(selectedExerciseId) : ""}
                  placeholder={
                    selectedMuscleGroupId
                      ? "Selecciona ejercicio"
                      : "Primero elige un grupo muscular"
                  }
                  options={exercises.map((e) => ({ value: String(e.id), label: e.name }))}
                  onValueChange={(val) => setSelectedExerciseId(Number(val))}
                  className="mt-1.5 bg-background/60 border-border focus:ring-primary/40"
                />

                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setNewExerciseForm((prev) => ({
                        ...prev,
                        muscleGroupId: selectedMuscleGroupId || 0,
                      }));
                      setShowNewExerciseDialog(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary-glow transition-colors underline-offset-4"
                  >
                    ¿No encuentras el ejercicio?{" "}
                    <span className="text-primary-glow font-medium">Crea uno</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sets & Reps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm flex items-center gap-1.5 text-foreground">
                  <Layers className="h-4 w-4 text-primary-glow" />
                  Series programadas ({sets.length})
                </h3>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {sets.map((set, idx) => (
                  <div
                    key={set.id}
                    className="rounded-lg border border-border bg-background/40 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] font-display text-primary-glow">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Serie {idx + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={sets.length === 1}
                        onClick={() => removeSet(set.id)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Reps
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={set.targetReps}
                          onChange={(e) => updateSet(set.id, { targetReps: e.target.value })}
                          className="h-8 mt-1 bg-background/60 text-xs"
                          placeholder="12"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Layers className="h-3 w-3" /> Peso (kg)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={500}
                          value={set.targetWeight}
                          onChange={(e) => updateSet(set.id, { targetWeight: e.target.value })}
                          className="h-8 mt-1 bg-background/60 text-xs"
                          placeholder="20"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> Desc. (s)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={1200}
                          value={set.restTime}
                          onChange={(e) => updateSet(set.id, { restTime: e.target.value })}
                          className="h-8 mt-1 bg-background/60 text-xs"
                          placeholder="90"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={addSet}
                variant="outline"
                size="sm"
                className="w-full mt-2 border-dashed border-primary/40 hover:bg-primary/10 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-primary-glow" /> Añadir otro set
              </Button>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Notas / Indicaciones
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de técnica, tempo, sensaciones..."
                maxLength={500}
                className="mt-1.5 h-16 bg-background/60 border-border focus-visible:ring-primary/40 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" /> Guardar ejercicio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subdialog: Create Brand New Exercise */}
      <Dialog
        open={showNewExerciseDialog}
        onOpenChange={(open) => {
          setShowNewExerciseDialog(open);
          if (!open) {
            setNewExerciseForm({ name: "", muscleGroupId: 0, videoUrl: "", description: "" });
            setSelectedExerciseVideoFile(null);
          }
        }}
      >
        <DialogContent className="bg-popover/95 backdrop-blur-xl border-primary/40 shadow-elevated sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-glow" />
              Crear nuevo ejercicio
            </DialogTitle>
            <DialogDescription>
              Crea un ejercicio personalizado para tus rutinas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Grupo Muscular
              </Label>
              <Select
                value={newExerciseForm.muscleGroupId ? String(newExerciseForm.muscleGroupId) : ""}
                onValueChange={(val) =>
                  setNewExerciseForm((prev) => ({ ...prev, muscleGroupId: Number(val) }))
                }
              >
                <SelectTrigger className="mt-1.5 bg-input/60">
                  <SelectValue placeholder="Selecciona grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
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
                onChange={(e) =>
                  setNewExerciseForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej. Press banca con mancuernas"
                className="mt-1.5 bg-background/60"
              />
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Descripción
              </Label>
              <Textarea
                value={newExerciseForm.description}
                onChange={(e) =>
                  setNewExerciseForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Detalles sobre ejecución, agarre..."
                className="mt-1.5 bg-background/60 text-xs h-16"
              />
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1 block">
                Video demostrativo
              </Label>
              <ExerciseVideoSelector
                videoMode={newExerciseVideoMode}
                onVideoModeChange={setNewExerciseVideoMode}
                videoUrl={newExerciseForm.videoUrl}
                onVideoUrlChange={(url) =>
                  setNewExerciseForm((prev) => ({ ...prev, videoUrl: url }))
                }
                selectedFile={selectedExerciseVideoFile}
                onFileSelected={setSelectedExerciseVideoFile}
                uploading={isUploadingVideo}
                uploadProgress={videoUploadProgress}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNewExerciseDialog(false)}
              disabled={savingNewExercise}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNewExercise}
              disabled={savingNewExercise}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              {savingNewExercise ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : (
                "Crear ejercicio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
