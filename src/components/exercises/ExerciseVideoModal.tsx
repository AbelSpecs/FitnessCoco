import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, VideoOff, X, Play, Dumbbell, AlertCircle } from "lucide-react";
import { getServeDownloadUrl } from "@/services/storage.service";

export interface ExerciseVideoModalProps {
  exercise: {
    exerciseName: string;
    muscleGroupName?: string;
    videoKey?: string | null;
    videoUrl?: string | null;
    coachNotes?: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const ExerciseVideoModal: React.FC<ExerciseVideoModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const rawSource = exercise?.videoUrl?.trim() || exercise?.videoKey?.trim() || "";
  const ytId = extractYoutubeId(rawSource);

  useEffect(() => {
    if (!isOpen || !rawSource) {
      setActiveVideoUrl(null);
      setLoadingVideo(false);
      setVideoError(null);
      return;
    }

    if (ytId) {
      // Es un video de YouTube
      setActiveVideoUrl(null);
      setLoadingVideo(false);
      setVideoError(null);
      return;
    }

    if (rawSource.startsWith("http://") || rawSource.startsWith("https://")) {
      setActiveVideoUrl(rawSource);
      setLoadingVideo(false);
      setVideoError(null);
      return;
    }

    // Es una key de S3 / Storage
    let isMounted = true;
    setLoadingVideo(true);
    setVideoError(null);
    setActiveVideoUrl(null);

    getServeDownloadUrl(rawSource, true)
      .then((url) => {
        if (!isMounted) return;
        if (url) {
          setActiveVideoUrl(url);
        } else {
          setVideoError("No se pudo obtener el video demostrativo.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error al cargar URL del video:", err);
        setVideoError("Error al cargar el video. Por favor intenta nuevamente.");
      })
      .finally(() => {
        if (isMounted) setLoadingVideo(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, rawSource, ytId]);

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-gradient-card p-4 sm:p-6 overflow-hidden shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 shadow-glow">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-display text-xl sm:text-2xl leading-tight truncate">
                  {exercise.exerciseName}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {exercise.muscleGroupName && (
                    <Badge variant="secondary" className="text-[11px] py-0">
                      {exercise.muscleGroupName}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Video Demostrativo</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Video Player Container */}
        <div className="space-y-3 pt-2">
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center relative shadow-inner">
            {ytId ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                title={`Video demostrativo de ${exercise.exerciseName}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : loadingVideo ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-medium">Cargando video demostrativo...</p>
              </div>
            ) : videoError ? (
              <div className="flex flex-col items-center justify-center p-6 text-muted-foreground gap-2 text-center max-w-sm">
                <VideoOff className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">{videoError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLoadingVideo(true);
                    setVideoError(null);
                    getServeDownloadUrl(rawSource, true)
                      .then((url) => {
                        if (url) setActiveVideoUrl(url);
                        else setVideoError("No se pudo obtener el video.");
                      })
                      .finally(() => setLoadingVideo(false));
                  }}
                  className="mt-2 text-xs"
                >
                  Reintentar
                </Button>
              </div>
            ) : activeVideoUrl ? (
              <video
                key={activeVideoUrl}
                className="h-full w-full object-contain bg-black"
                src={activeVideoUrl}
                controls
                autoPlay
                playsInline
                preload="auto"
                onError={(e) => {
                  const err = e.currentTarget.error;
                  console.error("Error reproductor video:", err?.code, err?.message);
                  setVideoError("El formato del video no pudo ser reproducido por el navegador.");
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground p-6">
                <VideoOff className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm">No hay video disponible para este ejercicio.</p>
              </div>
            )}
          </div>

          {/* Coach Notes if present */}
          {exercise.coachNotes && (
            <div className="rounded-lg bg-card/60 border border-border/60 p-3 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Indicaciones del Coach:</p>
                <p className="text-muted-foreground leading-relaxed mt-0.5">{exercise.coachNotes}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
