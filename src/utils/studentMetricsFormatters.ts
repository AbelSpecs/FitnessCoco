/**
 * Utilidades puras para el formateo defensivo y cálculo de métricas antropométricas y clínicas
 * para la entidad Student (PyrosFit - Actividad T-19 / SCRUM-14).
 */

export interface MetricFormatResult {
  formatted: string;
  hasValue: boolean;
  value?: number;
}

export interface ClinicalTextResult {
  text: string;
  hasValue: boolean;
  items: string[];
}

export interface BMIResult {
  bmi: number;
  category: "Bajo peso" | "Normal" | "Sobrepeso" | "Obesidad";
  variant: "default" | "success" | "warning" | "destructive";
}

/**
 * Formatea un valor métrico numérico con su unidad.
 * Si es nulo, indefinido, NaN o menor o igual a 0, retorna el fallback ("No registrado").
 */
export function formatMetric(
  value: number | null | undefined,
  unit: string,
  fallback = "No registrado",
): MetricFormatResult {
  if (value === null || value === undefined || isNaN(value) || value <= 0) {
    return {
      formatted: fallback,
      hasValue: false,
    };
  }

  const formattedNumber = value.toLocaleString("es-ES", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  return {
    formatted: `${formattedNumber} ${unit}`.trim(),
    hasValue: true,
    value,
  };
}

/**
 * Calcula el Índice de Masa Corporal (IMC) a partir del peso en kg y la altura en cm.
 * Retorna null si alguno de los valores es inválido o menor/igual a cero.
 */
export function calculateBMI(
  weightKg?: number | null,
  heightCm?: number | null,
): BMIResult | null {
  if (
    weightKg === null ||
    weightKg === undefined ||
    isNaN(weightKg) ||
    weightKg <= 0 ||
    heightCm === null ||
    heightCm === undefined ||
    isNaN(heightCm) ||
    heightCm <= 0
  ) {
    return null;
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);

  if (!isFinite(rawBmi) || rawBmi <= 0 || rawBmi > 100) {
    return null;
  }

  const bmi = Number(rawBmi.toFixed(1));

  if (bmi < 18.5) {
    return { bmi, category: "Bajo peso", variant: "warning" };
  } else if (bmi < 25) {
    return { bmi, category: "Normal", variant: "success" };
  } else if (bmi < 30) {
    return { bmi, category: "Sobrepeso", variant: "warning" };
  } else {
    return { bmi, category: "Obesidad", variant: "destructive" };
  }
}

/**
 * Formatea campos de texto clínico como condiciones médicas, alergias o notas generales.
 * Filtra cadenas con solo espacios, valores nulos o placeholders como "-", "ninguna", "n/a".
 */
export function formatClinicalText(
  text: string | null | undefined,
  fallback = "Ninguna",
): ClinicalTextResult {
  if (!text || typeof text !== "string") {
    return {
      text: fallback,
      hasValue: false,
      items: [],
    };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (
    clean === "" ||
    clean === "-" ||
    clean === "—" ||
    lower === "ninguna" ||
    lower === "ninguno" ||
    lower === "sin registros" ||
    lower === "no registrado" ||
    lower === "no registra" ||
    lower === "n/a" ||
    lower === "none"
  ) {
    return {
      text: fallback,
      hasValue: false,
      items: [],
    };
  }

  // Dividir por comas, saltos de línea o punto y coma si el usuario ingresó una lista
  const items = clean
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return {
    text: clean,
    hasValue: true,
    items: items.length > 0 ? items : [clean],
  };
}

/**
 * Diccionario y formateador amigable para el nivel de actividad física.
 */
const activityLabels: Record<string, { label: string; badge: string }> = {
  sedentary: { label: "Sedentario", badge: "Poco o ningún ejercicio" },
  light: { label: "Ligero", badge: "1-3 días por semana" },
  moderate: { label: "Moderado", badge: "3-5 días por semana" },
  very_active: { label: "Muy activo", badge: "6-7 días por semana" },
  extra_active: { label: "Atleta / Intenso", badge: "Doble sesión diaria" },
};

export function formatActivityLevel(level?: string | null): { label: string; detail?: string; hasValue: boolean } {
  if (!level || typeof level !== "string" || !level.trim()) {
    return { label: "No especificado", hasValue: false };
  }

  const clean = level.trim();
  const key = clean.toLowerCase().replace(/\s+/g, "_");

  if (activityLabels[key]) {
    return {
      label: activityLabels[key].label,
      detail: activityLabels[key].badge,
      hasValue: true,
    };
  }

  return {
    label: clean,
    hasValue: true,
  };
}

/**
 * Diccionario y formateador para la experiencia en el fitness.
 */
const experienceLabels: Record<string, { label: string; detail?: string }> = {
  beginner: { label: "Principiante", detail: "< 6 meses" },
  novice: { label: "Novato", detail: "6 meses - 1 año" },
  intermediate: { label: "Intermedio", detail: "1 - 3 años" },
  advanced: { label: "Avanzado", detail: "> 3 años" },
  expert: { label: "Experto / Competidor", detail: "Nivel competitivo" },
};

export function formatFitnessExperience(experience?: string | null): {
  label: string;
  detail?: string;
  hasValue: boolean;
} {
  if (!experience || typeof experience !== "string" || !experience.trim()) {
    return { label: "No especificado", hasValue: false };
  }

  const clean = experience.trim();
  const key = clean.toLowerCase().replace(/\s+/g, "_");

  if (experienceLabels[key]) {
    return {
      label: experienceLabels[key].label,
      detail: experienceLabels[key].detail,
      hasValue: true,
    };
  }

  return {
    label: clean,
    hasValue: true,
  };
}
