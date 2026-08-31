import React, { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/services/storage.service";

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storageKey?: string | null;
  src?: string | null;
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export const StorageImage: React.FC<StorageImageProps> = ({
  storageKey,
  src,
  alt = "Imagen",
  className = "",
  fallback = null,
  containerClassName = "",
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const rawSource = storageKey || src;

  useEffect(() => {
    let isMounted = true;

    const loadUrl = async () => {
      if (!rawSource) {
        if (isMounted) {
          setResolvedSrc("");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const url = await resolveMediaUrl(rawSource);
        if (isMounted) {
          setResolvedSrc(url);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error al resolver URL de StorageImage:", err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadUrl();

    return () => {
      isMounted = false;
    };
  }, [rawSource]);

  if (!rawSource || hasError || (!isLoading && !resolvedSrc)) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse flex items-center justify-center z-10" />
      )}
      {resolvedSrc && (
        <img
          src={resolvedSrc}
          alt={alt}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          {...props}
        />
      )}
    </div>
  );
};

export default StorageImage;
