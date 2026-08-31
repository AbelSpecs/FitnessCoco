import axios from "axios";
import {
  DownloadParams,
  PresignBannerParams,
  PresignProfileParams,
  PresignResponse,
  PresignVideoParams,
} from "@/types/storage";

const STORAGE_API_BASE = "https://api.pyrosfit.com/api/Storage";

// Cache in-memory for download URLs to avoid repetitive requests
interface CachedUrl {
  url: string;
  expiresAt: number;
}
const downloadUrlCache = new Map<string, CachedUrl>();

/**
 * Solicita una URL presignada para subir una foto de perfil de usuario
 */
export const getPresignedProfileUrl = async (
  params: PresignProfileParams,
): Promise<PresignResponse> => {
  try {
    const query = new URLSearchParams({
      userId: params.userId.toString(),
      fileName: params.fileName,
      contentType: params.contentType,
      expiresInSeconds: (params.expiresInSeconds || 300).toString(),
    });

    const response = await axios.post<PresignResponse>(
      `${STORAGE_API_BASE}/presign/profile?${query.toString()}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error al obtener URL presignada para perfil:", error);
    throw error;
  }
};

/**
 * Solicita una URL presignada para subir un banner de entrenador
 */
export const getPresignedBannerUrl = async (
  params: PresignBannerParams,
): Promise<PresignResponse> => {
  try {
    const query = new URLSearchParams({
      trainerId: params.trainerId.toString(),
      fileName: params.fileName,
      contentType: params.contentType,
      expiresInSeconds: (params.expiresInSeconds || 300).toString(),
    });

    const response = await axios.post<PresignResponse>(
      `${STORAGE_API_BASE}/presign/banner?${query.toString()}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error al obtener URL presignada para banner:", error);
    throw error;
  }
};

/**
 * Solicita una URL presignada para subir un video de ejercicio
 */
export const getPresignedVideoUrl = async (
  params: PresignVideoParams,
): Promise<PresignResponse> => {
  try {
    const query = new URLSearchParams({
      trainerId: params.trainerId.toString(),
      exerciseId: params.exerciseId.toString(),
      fileName: params.fileName,
      contentType: params.contentType,
      expiresInSeconds: (params.expiresInSeconds || 600).toString(),
    });

    const response = await axios.post<PresignResponse>(
      `${STORAGE_API_BASE}/presign/video?${query.toString()}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error al obtener URL presignada para video:", error);
    throw error;
  }
};

/**
 * Realiza la subida binaria directa a Cloudflare R2 / AWS S3 usando la URL presignada
 * NOTA: No debe enviarse el header Authorization de PyrosFit para no invalidar la firma S3
 */
export const uploadFileToPresignedUrl = async (
  uploadUrl: string,
  file: File | Blob,
  onProgress?: (percent: number) => void,
): Promise<void> => {
  try {
    // Axios request limpio sin interceptores ni headers de auth
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  } catch (error) {
    console.error("Error al subir archivo a la URL presignada de Cloudflare R2/S3:", error);
    throw error;
  }
};

/**
 * Obtiene la URL de lectura/descarga para una key de Storage
 */
export const getDownloadUrl = async (
  key: string,
  expiresInSeconds: number = 3600,
): Promise<string> => {
  if (!key) return "";

  // Revisar caché en memoria (si expira en más de 60s la usamos)
  const cached = downloadUrlCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60000) {
    return cached.url;
  }

  try {
    const query = new URLSearchParams({
      key,
      expiresInSeconds: expiresInSeconds.toString(),
    });

    const response = await axios.get(`${STORAGE_API_BASE}/download?${query.toString()}`);
    const data = response.data;

    let downloadUrl = "";
    if (typeof data === "string") {
      downloadUrl = data;
    } else if (typeof data?.downloadUrl === "string") {
      downloadUrl = data.downloadUrl;
    } else if (typeof data?.url === "string") {
      downloadUrl = data.url;
    } else if (typeof data?.data?.downloadUrl === "string") {
      downloadUrl = data.data.downloadUrl;
    } else if (typeof data?.data === "string") {
      downloadUrl = data.data;
    }

    if (downloadUrl) {
      downloadUrlCache.set(key, {
        url: downloadUrl,
        expiresAt: now + expiresInSeconds * 1000,
      });
    }

    return downloadUrl || key;
  } catch (error) {
    console.error("Error al resolver URL de descarga para key:", key, error);
    return "";
  }
};

/**
 * Helper para resolver una URL directa o Storage Key
 */
export const resolveMediaUrl = async (
  keyOrUrl?: string | null,
  expiresInSeconds: number = 3600,
): Promise<string> => {
  if (!keyOrUrl) return "";
  // Si ya es una URL completa o data URL, retornarla directamente
  if (
    keyOrUrl.startsWith("http://") ||
    keyOrUrl.startsWith("https://") ||
    keyOrUrl.startsWith("data:") ||
    keyOrUrl.startsWith("blob:")
  ) {
    return keyOrUrl;
  }

  // Es una clave de storage, consultar endpoint download
  return await getDownloadUrl(keyOrUrl, expiresInSeconds);
};
