/**
 * Utilidades para conversión y formateo de peso (Kilogramos y Libras).
 * 1 kg = 2.20462 lbs
 */

export const KG_TO_LBS_FACTOR = 2.20462;

/**
 * Convierte kilogramos a libras redondeado a 1 decimal.
 */
export function kgToLbs(kg: number | string | null | undefined): number {
  if (kg === null || kg === undefined || kg === "") return 0;
  const num = typeof kg === "number" ? kg : parseFloat(String(kg));
  if (isNaN(num) || num <= 0) return 0;
  return Number((num * KG_TO_LBS_FACTOR).toFixed(1));
}

/**
 * Convierte libras a kilogramos redondeado a 1 decimal.
 */
export function lbsToKg(lbs: number | string | null | undefined): number {
  if (lbs === null || lbs === undefined || lbs === "") return 0;
  const num = typeof lbs === "number" ? lbs : parseFloat(String(lbs));
  if (isNaN(num) || num <= 0) return 0;
  return Number((num / KG_TO_LBS_FACTOR).toFixed(1));
}

/**
 * Obtiene el valor numérico en kg independientemente de la unidad en que se haya escrito.
 */
export function parseWeightToKg(
  rawVal: number | string | null | undefined,
  unit: "kg" | "lbs" = "kg"
): number {
  if (rawVal === null || rawVal === undefined || rawVal === "") return 0;
  const num = typeof rawVal === "number" ? rawVal : parseFloat(String(rawVal));
  if (isNaN(num) || num <= 0) return 0;

  if (unit === "lbs") {
    return lbsToKg(num);
  }
  return Number(num.toFixed(1));
}

/**
 * Formatea el peso en kg para mostrarlo en la interfaz con su equivalente en libras.
 * Ejemplo: "20 kg · 44.1 lbs"
 */
export function formatWeightWithEquivalent(
  rawKg: number | string | null | undefined
): string {
  if (rawKg === null || rawKg === undefined || rawKg === "" || rawKg === 0 || rawKg === "0") {
    return "0 kg";
  }
  const kg = typeof rawKg === "number" ? rawKg : parseFloat(String(rawKg));
  if (isNaN(kg) || kg <= 0) return "0 kg";

  const lbs = kgToLbs(kg);
  return `${kg} kg (${lbs} lbs)`;
}
