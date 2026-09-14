import React, { useRef, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Link2,
  UploadCloud,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Video,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExerciseVideoSelectorProps {
  videoMode: "url" | "upload";
  onVideoModeChange: (mode: "url" | "upload") => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  selectedFile: File | null;
  onFileSelected: (file: File | null) => void;
  uploading?: boolean;
  uploadProgress?: number;
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const ExerciseVideoSelector: React.FC<ExerciseVideoSelectorProps> = ({
  videoMode,
  onVideoModeChange,
  videoUrl,
  onVideoUrlChange,
  selectedFile,
  onFileSelected,
  uploading = false,
  uploadProgress = 0,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const ytId = extractYoutubeId(videoUrl);
  const isDirectVideo =
    videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".mov");

  const handleFileValidation = (file: File): boolean => {
    setErrorMessage(null);

    // Validar tipo de archivo
    const validExtensions = ["mp4", "webm", "mov"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidType =
      file.type.startsWith("video/") || (extension && validExtensions.includes(extension));

    if (!isValidType) {
      setErrorMessage("Solo se admiten archivos de video válidos (.mp4, .webm, .mov).");
      return false;
    }

    // Validar tamaño máximo
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE_MB}MB). Por favor selecciona un archivo más ligero o usa un enlace de YouTube.`,
      );
      return false;
    }

    return true;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (handleFileValidation(file)) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (handleFileValidation(file)) {
      onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className={cn("space-y-2 pt-1", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-primary-glow" />
          Video demostrativo <span className="text-[10px] text-muted-foreground/60 font-normal lowercase">(opcional)</span>
        </Label>
      </div>

      <Tabs
        value={videoMode}
        onValueChange={(val) => {
          setErrorMessage(null);
          onVideoModeChange(val as "url" | "upload");
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full bg-background/50 border border-border/60 h-8 p-0.5">
          <TabsTrigger
            value="url"
            disabled={disabled || uploading}
            className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary-glow data-[state=active]:shadow-none h-7 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Link2 className="h-3.5 w-3.5" />
            Enlace Web
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            disabled={disabled || uploading}
            className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary-glow data-[state=active]:shadow-none h-7 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Subir Video
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Enlace URL */}
        <TabsContent value="url" className="space-y-2 pt-1">
          <div className="relative">
            <Input
              value={videoUrl}
              onChange={(e) => {
                setErrorMessage(null);
                onVideoUrlChange(e.target.value);
              }}
              placeholder="https://www.youtube.com/watch?v=... o enlace directo"
              disabled={disabled || uploading}
              className="bg-background/60 border-border focus-visible:ring-primary/40 text-xs pr-8"
            />
            {videoUrl && (
              <button
                type="button"
                onClick={() => onVideoUrlChange("")}
                disabled={disabled || uploading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpiar enlace"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Vista previa miniatura de YouTube o URL */}
          {ytId && (
            <div className="relative rounded-lg overflow-hidden border border-border/80 bg-zinc-950 aspect-video max-h-36 group">
              <img
                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                alt="Vista previa de YouTube"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="h-9 w-9 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-primary-glow shadow-glow">
                  <PlayCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-sm text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Video de YouTube detectado
              </div>
            </div>
          )}

          {videoUrl && !ytId && (
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              Se vinculará el enlace directo al ejercicio.
            </p>
          )}
        </TabsContent>

        {/* Tab 2: Subida de archivo a Cloudflare R2 */}
        <TabsContent value="upload" className="space-y-2 pt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
          />

          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => {
                if (!disabled && !uploading) {
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-1.5",
                isDragging
                  ? "border-primary bg-primary/10 scale-[0.99]"
                  : "border-border/80 hover:border-primary/50 bg-background/30 hover:bg-background/50",
                (disabled || uploading) && "opacity-60 cursor-not-allowed",
              )}
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-glow shadow-glow">
                <UploadCloud className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  Haz clic para seleccionar o arrastra un video
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Formatos MP4 o WEBM (Máx. {MAX_FILE_SIZE_MB}MB) · Alojado en Cloudflare R2
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/80 bg-background/50 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-primary/15 text-primary-glow border border-primary/20 shrink-0">
                    <FileVideo className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate max-w-[210px] sm:max-w-[260px]" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                {!uploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onFileSelected(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Quitar archivo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Barra de progreso animada durante la subida a R2 */}
              {uploading && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 text-primary-glow font-medium">
                      Subiendo a Cloudflare R2...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alertas y errores de validación */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
