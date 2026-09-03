import React, { useEffect, useRef, useState } from "react";
import { getServeDownloadUrl } from "@/services/storage.service";
import { PlayCircle, Video, VideoOff } from "lucide-react";

export interface VideoThumbnailProps {
  videoKey?: string | null;
  videoUrl?: string | null;
  className?: string;
  containerClassName?: string;
  alt?: string;
  showPlayBadge?: boolean;
  hoverPlay?: boolean;
}

function extractYoutubeId(url?: string | null): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoKey,
  videoUrl,
  className = "",
  containerClassName = "",
  alt = "Miniatura de video",
  showPlayBadge = true,
  hoverPlay = false,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rawSource = videoUrl?.trim() || videoKey?.trim() || "";
  const ytId = extractYoutubeId(rawSource);

  useEffect(() => {
    let isMounted = true;

    if (!rawSource) {
      setResolvedUrl("");
      setIsLoading(false);
      return;
    }

    if (ytId) {
      setResolvedUrl(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
      setIsLoading(false);
      setIsLoaded(true);
      return;
    }

    if (rawSource.startsWith("http://") || rawSource.startsWith("https://")) {
      setResolvedUrl(rawSource);
      setIsLoading(false);
      return;
    }

    // Storage Key
    setIsLoading(true);
    setHasError(false);
    getServeDownloadUrl(rawSource)
      .then((url) => {
        if (!isMounted) return;
        if (url) {
          setResolvedUrl(url);
        } else {
          setHasError(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error al resolver URL de miniatura:", err);
        setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [rawSource, ytId]);

  const handleMouseEnter = () => {
    if (hoverPlay && videoRef.current && isLoaded) {
      videoRef.current.play().catch(() => {
        // Ignorar si el navegador bloquea autoplay en hover
      });
    }
  };

  const handleMouseLeave = () => {
    if (hoverPlay && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0.1;
    }
  };

  if (!rawSource || hasError) {
    return (
      <div
        className={`h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1 bg-zinc-950 ${containerClassName}`}
      >
        <VideoOff className="h-6 w-6 text-muted-foreground/60" />
        <span className="text-[11px] text-muted-foreground/70">Sin video</span>
      </div>
    );
  }

  if (ytId) {
    return (
      <div
        className={`relative h-full w-full overflow-hidden bg-zinc-950 ${containerClassName}`}
      >
        <img
          src={resolvedUrl}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 ${className}`}
        />
        {showPlayBadge && (
          <>
            <span className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-11 w-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/80 transition-all shadow-glow">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 border border-white/10 font-medium">
              <Video className="h-3 w-3 text-red-500" /> YouTube
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-zinc-950 ${containerClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center z-10">
          <Video className="h-6 w-6 text-muted-foreground/40 animate-pulse" />
        </div>
      )}

      {resolvedUrl && (
        <video
          ref={videoRef}
          src={`${resolvedUrl}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          className={`h-full w-full object-cover transition-transform duration-300 ${className} ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {showPlayBadge && (
        <>
          <span className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-11 w-11 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/80 transition-all shadow-glow">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white flex items-center gap-1 border border-white/10 font-medium pointer-events-none">
            <Video className="h-3 w-3 text-primary-glow" /> Video HD
          </span>
        </>
      )}
    </div>
  );
};
