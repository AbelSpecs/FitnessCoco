import { UserAuth } from "@/types/auth";

/**
 * Determina si el usuario actual es un cliente independiente.
 * Un cliente es independiente si su rol es "student" y no tiene un entrenador asignado
 * (myCoachId es 0, undefined, null o el ID legado 9).
 */
export function isUserIndependent(user: UserAuth | null | undefined): boolean {
  if (!user) return false;

  const userId = Number(user.id);
  const studentId = Number(user.studentId);
  const coachId = Number(user.coachId);
  const myCoachId = Number(user.myCoachId);

  // El usuario con ID 53 (o studentId 23) siempre se considera independiente
  if (userId === 53 || studentId === 23) {
    return true;
  }

  // Cualquier usuario que dependa del coachId 9 (sea en myCoachId o coachId legado) es independiente
  if (coachId === 9 || myCoachId === 9) {
    return true;
  }

  // Si es un entrenador real (tiene coachId asignado > 0 y distinto de 9), no es independiente
  if (user.role === "coach" && coachId > 0 && coachId !== 9) {
    return false;
  }

  // Si tiene un entrenador asignado real (distinto de 0 y del ID legado 9), no es independiente
  if (myCoachId && !isNaN(myCoachId) && myCoachId !== 0 && myCoachId !== 9) {
    return false;
  }

  return true;
}

/**
 * Agrega el tag del studentId al final de la descripción del ejercicio.
 * Ejemplo: "Hacer con pausa abajo [studentId:15]"
 */
export function formatExerciseDescriptionWithStudentId(
  description: string | null | undefined,
  studentId: number | string
): string {
  const baseDesc = (description || "").trim();
  const idStr = String(studentId).trim();
  if (!idStr || idStr === "0") return baseDesc;

  const tag = `[studentId:${idStr}]`;
  // Si ya tiene el tag, no duplicarlo
  if (baseDesc.includes(tag)) {
    return baseDesc;
  }
  return baseDesc ? `${baseDesc} ${tag}` : tag;
}

/**
 * Limpia el tag de studentId de la descripción para mostrar un texto limpio en la interfaz.
 */
export function cleanExerciseDescription(description: string | null | undefined): string {
  if (!description) return "";
  return description.replace(/\[student(?:Id)?:\s*\d+\]/gi, "").trim();
}

/**
 * Filtra la lista de ejercicios según el usuario y alcance:
 * - Si es entrenador o cliente con entrenador asignado: no filtra por studentId (ve el catálogo normal).
 * - Si es cliente independiente: ve todos los ejercicios del sistema (isCustom = false)
 *   y ÚNICAMENTE sus propios ejercicios personalizados (que contienen su studentId en la descripción).
 */
export function filterExercisesForUser<
  T extends { isCustom?: boolean; description?: string | null }
>(
  exercisesList: T[],
  user: UserAuth | null | undefined,
  currentStudentId?: number | string
): T[] {
  if (!isUserIndependent(user)) {
    return exercisesList;
  }

  const effectiveId = String(currentStudentId || user?.studentId || "").trim();

  return exercisesList.filter((exercise) => {
    // 1. Ejercicios globales / base de Pyrosfit: visibles para todos
    if (!exercise.isCustom) {
      return true;
    }

    // 2. Si es personalizado, solo lo ve si la descripción contiene su studentId
    const desc = exercise.description || "";
    if (!desc || !effectiveId || effectiveId === "0") {
      return false;
    }

    const regex = new RegExp(`\\[student(?:Id)?:\\s*${effectiveId}\\]`, "i");
    return regex.test(desc) || desc.includes(`studentId:${effectiveId}`) || desc.includes(`student:${effectiveId}`);
  });
}
