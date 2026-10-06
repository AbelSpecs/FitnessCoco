/**
 * Utilidades para formateo y parseo de tiempos de descanso en ejercicios.
 */

/**
 * Convierte cualquier formato de tiempo de descanso a segundos totales.
 * Soporta:
 * - Números simples o strings numéricos: "90", 90 -> 90
 * - Notación con minutos: "2m", "2 min", "1.5m", "1.5 min" -> 120, 90
 * - Notación con dos puntos: "1:30" -> 90, "02:00" -> 120, "01:15" -> 75
 * - Notación con segundos: "45s", "45 seg" -> 45
 */
export function parseRestTimeToSeconds(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return isNaN(raw) ? 0 : Math.max(0, Math.round(raw));

  const str = String(raw).trim().toLowerCase();
  if (!str) return 0;

  // Formato MM:SS o HH:MM:SS (ej: "1:30" -> 90s)
  if (str.includes(":")) {
    const parts = str.split(":").map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
    }
    if (parts.length === 2) {
      return Math.round(parts[0] * 60 + parts[1]);
    }
  }

  // Notación con 'm' o 'min' (ej: "2m", "1.5min", "2 min")
  if (str.includes("m")) {
    const numPart = parseFloat(str.replace(/[^\d.]/g, ""));
    if (!isNaN(numPart)) {
      return Math.round(numPart * 60);
    }
  }

  // Notación con 's' o 'seg' (ej: "90s", "45 seg")
  if (str.includes("s")) {
    const numPart = parseFloat(str.replace(/[^\d.]/g, ""));
    if (!isNaN(numPart)) {
      return Math.round(numPart);
    }
  }

  // Número plano (asumido segundos)
  const val = parseFloat(str);
  return isNaN(val) ? 0 : Math.max(0, Math.round(val));
}

/**
 * Formatea segundos a texto amigable para mostrar en interfaces.
 * Ejemplos:
 * 120 -> "2 min"
 * 90 -> "1m 30s"
 * 60 -> "1 min"
 * 45 -> "45s"
 * 150 -> "2m 30s"
 */
export function formatRestTimeDisplay(raw: string | number | null | undefined): string {
  const totalSeconds = parseRestTimeToSeconds(raw);
  if (!totalSeconds || totalSeconds <= 0) return "0s";

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  if (seconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes}m ${seconds}s`;
}
