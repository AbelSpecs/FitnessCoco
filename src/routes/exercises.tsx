import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/components/NotificationCenter";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import {
  getExerciseByCoachId,
  getMuscleGroups,
  postExercise,
  updateExercise,
  deleteExercise,
} from "@/services/routine.service";
import {
  getFileContentType,
  getPresignedVideoUrl,
  getServeUrl,
  uploadFileToPresignedUrl,
} from "@/services/storage.service";
import { GetExerciseDto, GetMuscleGroupDto } from "@/dtos/exerciseDto";
import {
  Dumbbell,
  Search,
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
  Video,
  VideoOff,
  X,
  Filter,
  Sparkles,
  ListFilter,
  LayoutGrid,
  Upload,
  Link2,
  Loader2,
  FileVideo,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "Ejercicios y videos — PyrosFit" },
      {
        name: "description",
        content:
          "Gestiona la biblioteca de ejercicios de PyrosFit: crea, edita y elimina ejercicios con sus videos demostrativos por grupo muscular.",
      },
    ],
  }),
  loader: async () => {
    const auth = useAuthStore.getState();
    const coachId = auth.user?.coachId || auth.user?.id || 1;

    const [muscleGroups, exercises] = await Promise.all([
      getMuscleGroups().catch((err) => {
        console.error("Error al cargar grupos musculares:", err);
        return [] as GetMuscleGroupDto[];
      }),
      getExerciseByCoachId(coachId).catch((err) => {
        console.error("Error al cargar ejercicios del coach:", err);
        return [] as GetExerciseDto[];
      }),
    ]);

    return {
      muscleGroups,
      exercises,
      coachId,
    };
  },
  component: EjerciciosPage,
});

/* -------------------------------- helpers -------------------------------- */

function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] ?? null;
}

function thumbFor(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function resolveVideoUrl(videoKey?: string | null, videoUrl?: string | null): string {
  const key = videoKey?.trim();
  if (key) {
    if (key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }
    return getServeUrl(key);
  }
  const url = videoUrl?.trim();
  if (url) {
    return url;
  }
  return "";
}

/* --------------------------------- types --------------------------------- */

interface ExerciseFormState {
  name: string;
  muscleGroupId: number;
  description: string;
  videoUrl: string;
  videoKey: string;
  isCustom: boolean;
}

const FALLBACK_MUSCLE_GROUPS: GetMuscleGroupDto[] = [
  { id: 1, name: "Pecho", description: "Pectorales", imageUrl: "", createdAt: "" },
  { id: 2, name: "Espalda", description: "Dorsales y trapecios", imageUrl: "", createdAt: "" },
  { id: 3, name: "Hombros", description: "Deltoides", imageUrl: "", createdAt: "" },
  { id: 4, name: "Bíceps", description: "Bíceps braquial", imageUrl: "", createdAt: "" },
  { id: 5, name: "Tríceps", description: "Tríceps braquial", imageUrl: "", createdAt: "" },
  { id: 6, name: "Cuádriceps", description: "Pierna frontal", imageUrl: "", createdAt: "" },
  { id: 7, name: "Isquiotibiales", description: "Femorales", imageUrl: "", createdAt: "" },
  { id: 8, name: "Glúteos", description: "Glúteos", imageUrl: "", createdAt: "" },
  { id: 9, name: "Pantorrillas", description: "Gemelos y sóleo", imageUrl: "", createdAt: "" },
  { id: 10, name: "Abdomen", description: "Core", imageUrl: "", createdAt: "" },
];

/* --------------------------------- page ---------------------------------- */

function EjerciciosPage() {
  const {
    muscleGroups: loadedMuscleGroups,
    exercises: initialExercises,
    coachId: loaderCoachId,
  } = Route.useLoaderData();
  const { user } = useAuthStore();
  const currentCoachId = user?.coachId || user?.id || loaderCoachId || 1;

  const muscleGroups = loadedMuscleGroups.length > 0 ? loadedMuscleGroups : FALLBACK_MUSCLE_GROUPS;

  const [items, setItems] = useState<GetExerciseDto[]>(initialExercises);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("Todos");
  const [onlyVideo, setOnlyVideo] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GetExerciseDto | null>(null);
  const [videoMode, setVideoMode] = useState<"upload" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ExerciseFormState>({
    name: "",
    muscleGroupId: muscleGroups[0]?.id || 1,
    description: "",
    videoUrl: "",
    videoKey: "",
    isCustom: true,
  });

  // Action states
  const [toDelete, setToDelete] = useState<GetExerciseDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<GetExerciseDto | null>(null);

  // Filtered exercises
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      const muscleName =
        e.muscleGroup || muscleGroups.find((m) => m.id === e.muscleGroupId)?.name || "";
      const matchesGroup = group === "Todos" || muscleName === group;
      const hasVideo = !!(e.videoKey?.trim() || e.videoUrl?.trim());
      const matchesVideo = !onlyVideo || hasVideo;
      const matchesQuery =
        !q ||
        e.name.toLowerCase().includes(q) ||
        muscleName.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q));

      return matchesGroup && matchesVideo && matchesQuery;
    });
  }, [items, query, group, onlyVideo, muscleGroups]);

  const withVideoCount = useMemo(() => {
    return items.filter((e) => !!(e.videoKey?.trim() || e.videoUrl?.trim())).length;
  }, [items]);

  function openCreate() {
    setEditing(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setVideoMode("upload");
    setForm({
      name: "",
      muscleGroupId: muscleGroups[0]?.id || 1,
      description: "",
      videoUrl: "",
      videoKey: "",
      isCustom: true,
    });
    setFormOpen(true);
  }

  function openEdit(item: GetExerciseDto) {
    setEditing(item);
    setSelectedFile(null);
    setUploadProgress(0);
    const hasExternalUrl = youtubeId(item.videoKey || item.videoUrl);
    setVideoMode(hasExternalUrl ? "url" : "upload");
    setForm({
      name: item.name,
      muscleGroupId: item.muscleGroupId || muscleGroups[0]?.id || 1,
      description: item.description || "",
      videoUrl: item.videoUrl || (hasExternalUrl ? item.videoKey || "" : ""),
      videoKey: item.videoKey || "",
      isCustom: item.isCustom,
    });
    setFormOpen(true);
  }

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      notify.error(
        "Formato no válido",
        "Por favor selecciona un archivo de video válido (MP4, WEBM, MOV).",
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      notify.error("Archivo demasiado grande", "El video no debe superar los 50MB.");
      return;
    }

    setSelectedFile(file);
  };

  async function handleSave() {
    if (!form.name.trim()) {
      notify.error("Falta el nombre", "Escribe un nombre para el ejercicio.");
      return;
    }

    if (videoMode === "url" && form.videoUrl.trim()) {
      if (!/^https?:\/\//i.test(form.videoUrl.trim())) {
        notify.error("URL inválida", "El enlace del video debe comenzar con http:// o https://");
        return;
      }
    }

    setSaving(true);
    let finalVideoKey = form.videoKey;
    const muscleName =
      muscleGroups.find((m) => m.id === form.muscleGroupId)?.name || "General";

    try {
      if (editing) {
        // 1. Si estamos editando y seleccionó un archivo nuevo de video
        if (videoMode === "upload" && selectedFile) {
          setUploading(true);
          setUploadProgress(0);
          notify.info("Subiendo video demostrativo a Cloudflare R2...");

          const contentType = getFileContentType(selectedFile);
          const presign = await getPresignedVideoUrl({
            trainerId: currentCoachId,
            exerciseId: editing.id,
            fileName: selectedFile.name,
            contentType,
            expiresInSeconds: 600,
          });

          await uploadFileToPresignedUrl(
            presign.uploadUrl,
            selectedFile,
            contentType,
            (percent) => setUploadProgress(percent),
          );

          finalVideoKey = presign.key;
          setUploading(false);
        } else if (videoMode === "url") {
          finalVideoKey = form.videoUrl.trim();
        }

        // 2. Actualizar ejercicio en BD
        await updateExercise(editing.id, {
          coachId: currentCoachId,
          name: form.name.trim(),
          description: form.description.trim(),
          muscleGroupId: Number(form.muscleGroupId),
          videoUrl: finalVideoKey || null,
          isCustom: form.isCustom,
        });

        setItems((prev) =>
          prev.map((e) =>
            e.id === editing.id
              ? {
                  ...e,
                  name: form.name.trim(),
                  description: form.description.trim(),
                  muscleGroupId: Number(form.muscleGroupId),
                  muscleGroup: muscleName,
                  videoKey: finalVideoKey,
                  videoUrl: finalVideoKey,
                  isCustom: form.isCustom,
                }
              : e,
          ),
        );

        notify.updated("Ejercicio actualizado", form.name.trim());
      } else {
        // 3. Crear ejercicio nuevo en BD
        if (videoMode === "upload" && selectedFile) {
          setUploading(true);
          setUploadProgress(0);
          notify.info("Subiendo video demostrativo a Cloudflare R2...");

          const tempExerciseId = Math.floor(Date.now() % 100000000);
          const contentType = getFileContentType(selectedFile);
          const presign = await getPresignedVideoUrl({
            trainerId: currentCoachId,
            exerciseId: tempExerciseId,
            fileName: selectedFile.name,
            contentType,
            expiresInSeconds: 600,
          });

          await uploadFileToPresignedUrl(
            presign.uploadUrl,
            selectedFile,
            contentType,
            (percent) => setUploadProgress(percent),
          );

          finalVideoKey = presign.key;
          setUploading(false);
        } else if (videoMode === "url") {
          finalVideoKey = form.videoUrl.trim();
        }

        const responseData = await postExercise({
          coachId: currentCoachId,
          name: form.name.trim(),
          description: form.description.trim(),
          muscleGroupId: Number(form.muscleGroupId),
          videoUrl: finalVideoKey || null,
          isCustom: form.isCustom,
        });

        const newId = responseData?.id || responseData?.exercise?.id || Date.now();

        const createdItem: GetExerciseDto = {
          id: newId,
          coachId: currentCoachId,
          name: form.name.trim(),
          description: form.description.trim(),
          muscleGroupId: Number(form.muscleGroupId),
          muscleGroup: muscleName,
          videoKey: finalVideoKey,
          videoUrl: videoMode === "url" ? form.videoUrl.trim() : "",
          isCustom: form.isCustom,
        };

        setItems((prev) => [createdItem, ...prev]);
        notify.created("Ejercicio creado con éxito", form.name.trim());
      }

      setFormOpen(false);
    } catch (err: any) {
      console.error("Error al guardar ejercicio:", err);
      notify.error(
        "Error al guardar",
        err?.response?.data?.message ||
          "No se pudo guardar el ejercicio en el servidor. Intenta de nuevo.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);

    try {
      await deleteExercise(toDelete.id);
      setItems((prev) => prev.filter((e) => e.id !== toDelete.id));
      notify.deleted("Ejercicio eliminado", toDelete.name);
      setToDelete(null);
    } catch (err: any) {
      console.error("Error al eliminar ejercicio:", err);
      notify.error(
        "Error al eliminar",
        err?.response?.data?.message ||
          "No se pudo eliminar el ejercicio. Puede que esté asignado a alguna rutina activa.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <header className="rounded-2xl border border-border bg-gradient-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shrink-0">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display tracking-wide">Ejercicios y videos</h1>
                <p className="text-sm text-muted-foreground">
                  Biblioteca técnica del entrenador — administra ejercicios y videos demostrativos.
                </p>
              </div>
            </div>
            <Button onClick={openCreate} className="bg-gradient-primary shadow-glow">
              <Plus className="h-4 w-4 mr-2" /> Nuevo ejercicio
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Ejercicios", value: items.length, icon: Dumbbell },
              { label: "Con video", value: withVideoCount, icon: Video },
              { label: "Sin video", value: items.length - withVideoCount, icon: VideoOff },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                <p className="text-2xl font-semibold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </header>

        {/* Filters */}
        <Card className="p-4 bg-gradient-card border-border space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por ejercicio, técnica o grupo muscular…"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Switch checked={onlyVideo} onCheckedChange={setOnlyVideo} />
                Solo con video
              </label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-label="Vista tarjetas"
                  className={cn(
                    "p-2 transition-colors",
                    view === "grid"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-label="Vista lista"
                  className={cn(
                    "p-2 transition-colors",
                    view === "list"
                      ? "bg-gradient-primary text-primary-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  <ListFilter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setGroup("Todos")}
              className={cn(
                "px-3 py-1 rounded-full text-xs border transition-all",
                group === "Todos"
                  ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40",
              )}
            >
              Todos
            </button>
            {muscleGroups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroup(g.name)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-all",
                  group === g.name
                    ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        </Card>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="p-10 text-center bg-gradient-card border-border">
            <Sparkles className="h-8 w-8 mx-auto text-primary-glow mb-3" />
            <p className="font-medium">Sin resultados</p>
            <p className="text-sm text-muted-foreground">
              Ajusta los filtros de búsqueda o crea un nuevo ejercicio para tu biblioteca.
            </p>
          </Card>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => {
              const videoSrc = resolveVideoUrl(e.videoKey, e.videoUrl);
              const ytThumb = thumbFor(videoSrc);
              const muscleName =
                e.muscleGroup ||
                muscleGroups.find((m) => m.id === e.muscleGroupId)?.name ||
                "General";

              return (
                <Card
                  key={e.id}
                  className="overflow-hidden bg-gradient-card border-border hover:border-primary/40 transition-colors flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => videoSrc && setPreview(e)}
                    className="relative block w-full aspect-video bg-card/60 group overflow-hidden border-b border-border/50"
                  >
                    {ytThumb ? (
                      <img
                        src={ytThumb}
                        alt={`Miniatura del video de ${e.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : videoSrc ? (
                      <div className="h-full w-full relative flex items-center justify-center bg-zinc-950">
                        <video
                          src={videoSrc}
                          className="h-full w-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                          muted
                          preload="metadata"
                        />
                        <span className="absolute inset-0 bg-black/25" />
                        <PlayCircle className="h-10 w-10 text-primary-glow absolute drop-shadow-md group-hover:scale-110 transition-transform" />
                      </div>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1">
                        <VideoOff className="h-6 w-6" />
                        <span className="text-xs">Sin video</span>
                      </div>
                    )}
                    {videoSrc && !ytThumb && (
                      <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1">
                        <Video className="h-3 w-3" /> Demo
                      </span>
                    )}
                    {ytThumb && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-10 w-10 text-primary-glow" />
                      </span>
                    )}
                  </button>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-medium text-base truncate">{e.name}</h2>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {muscleName}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {e.description || "Sin descripción técnica agregada."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      {e.isCustom ? (
                        <Badge className="bg-primary/15 text-primary-glow border-primary/30 text-[10px]">
                          Personalizado
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Biblioteca base</span>
                      )}

                      <div className="flex gap-1">
                        {videoSrc && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreview(e)}
                            aria-label={`Reproducir video de ${e.name}`}
                            className="h-8 w-8 text-primary hover:text-primary-glow"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(e)}
                          aria-label={`Editar ${e.name}`}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {e.isCustom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setToDelete(e)}
                            aria-label={`Eliminar ${e.name}`}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/15"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-gradient-card border-border divide-y divide-border">
            {filtered.map((e) => {
              const videoSrc = resolveVideoUrl(e.videoKey, e.videoUrl);
              const muscleName =
                e.muscleGroup ||
                muscleGroups.find((m) => m.id === e.muscleGroupId)?.name ||
                "General";

              return (
                <div key={e.id} className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="h-4 w-4 text-primary-glow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{e.name}</p>
                      {e.isCustom && (
                        <Badge className="bg-primary/15 text-primary-glow border-primary/30 text-[9px] px-1.5 py-0">
                          Propio
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {muscleName} • {videoSrc ? "Con video" : "Sin video"}
                      {e.description ? ` — ${e.description}` : ""}
                    </p>
                  </div>
                  {videoSrc && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreview(e)}
                      aria-label={`Ver video de ${e.name}`}
                      className="text-primary hover:text-primary-glow"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(e)}
                    aria-label={`Editar ${e.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {e.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setToDelete(e)}
                      aria-label={`Eliminar ${e.name}`}
                      className="text-destructive hover:text-destructive hover:bg-destructive/15"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-gradient-card border-border sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-xl">
              {editing ? "Editar ejercicio" : "Nuevo ejercicio"}
            </DialogTitle>
            <DialogDescription>
              Define el nombre, grupo muscular y video demostrativo para tus rutinas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ex-name">Nombre del ejercicio *</Label>
              <Input
                id="ex-name"
                value={form.name}
                onChange={(ev) => setForm({ ...form, name: ev.target.value })}
                placeholder="Ej. Press inclinado con mancuernas"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Grupo muscular *</Label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 rounded-lg border border-border/50 bg-card/40">
                {muscleGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm({ ...form, muscleGroupId: g.id })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      form.muscleGroupId === g.id
                        ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Section: Direct R2 Upload or External URL */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card/60">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4 text-primary" /> Video demostrativo
                </Label>
                <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setVideoMode("upload")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5",
                      videoMode === "upload"
                        ? "bg-gradient-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Upload className="h-3 w-3" /> Subir archivo (R2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode("url")}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5",
                      videoMode === "url"
                        ? "bg-gradient-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Link2 className="h-3 w-3" /> Enlace / YouTube
                  </button>
                </div>
              </div>

              {videoMode === "upload" ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-card/40 flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileVideo className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        {selectedFile
                          ? selectedFile.name
                          : "Haz clic para seleccionar un video (MP4, WEBM)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedFile
                          ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                          : "Máximo 50MB. Se alojará en Cloudflare R2 con streaming rápido"}
                      </p>
                    </div>
                  </div>

                  {form.videoKey && !selectedFile && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="truncate">Video actual: {form.videoKey}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, videoKey: "" })}
                        className="h-6 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Quitar
                      </Button>
                    </div>
                  )}

                  {uploading && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Subiendo a Cloudflare R2...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="ex-video"
                    value={form.videoUrl}
                    onChange={(ev) => setForm({ ...form, videoUrl: ev.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... o URL directa"
                    disabled={saving}
                  />
                  {thumbFor(form.videoUrl) && (
                    <img
                      src={thumbFor(form.videoUrl)!}
                      alt="Vista previa del video"
                      className="rounded-lg border border-border w-full aspect-video object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-desc">Instrucciones técnicas / Descripción</Label>
              <Textarea
                id="ex-desc"
                rows={3}
                value={form.description}
                onChange={(ev) => setForm({ ...form, description: ev.target.value })}
                placeholder="Indicaciones de postura, agarre, tempo o errores comunes a evitar…"
                disabled={saving}
              />
            </div>

            <label className="flex items-center gap-3 text-sm cursor-pointer pt-1">
              <Switch
                checked={form.isCustom}
                onCheckedChange={(v) => setForm({ ...form, isCustom: v })}
                disabled={saving}
              />
              <span>Ejercicio personalizado del entrenador</span>
            </label>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-primary shadow-glow"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Subiendo video..." : "Guardando..."}
                </>
              ) : editing ? (
                "Guardar cambios"
              ) : (
                "Crear ejercicio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <DialogContent className="bg-gradient-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar ejercicio</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar “{toDelete?.name}”? Esta acción lo quitará de tu
              biblioteca personalizada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-3xl bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="min-w-0">
                <p className="font-display text-lg truncate">{preview.name}</p>
                <p className="text-xs text-muted-foreground">
                  {preview.muscleGroup ||
                    muscleGroups.find((m) => m.id === preview.muscleGroupId)?.name ||
                    "General"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreview(null)}
                aria-label="Cerrar video"
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {(() => {
              const videoSrc = resolveVideoUrl(preview.videoKey, preview.videoUrl);
              const ytId = youtubeId(videoSrc);

              return (
                <div className="aspect-video rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center">
                  {ytId ? (
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      title={`Video demostrativo de ${preview.name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoSrc ? (
                    <video
                      className="h-full w-full object-contain"
                      src={videoSrc}
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="text-center text-muted-foreground p-6">
                      <VideoOff className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                      <p className="text-sm">No hay video disponible para este ejercicio.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {preview.description && (
              <p className="text-xs text-muted-foreground bg-card/60 p-3 rounded-lg border border-border/40">
                {preview.description}
              </p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
