import { UserAuth } from "@/types/auth";

/**
 * Determina si el usuario autenticado tiene permisos de administrador.
 * Pendiente de alinear con el criterio definitivo del backend
 * (por ejemplo: rol, flag `isAdmin`, `roleId` o claim específico).
 */
export function isAdminUser(user?: UserAuth | null): boolean {
  if (!user) return false;

  const candidate = user as UserAuth & {
    isAdmin?: boolean;
    roleName?: string;
  };

  return (
    candidate.isAdmin === true ||
    (candidate.role as string | undefined)?.toLowerCase() === "admin" ||
    candidate.roleName?.toLowerCase() === "admin"
  );
}

