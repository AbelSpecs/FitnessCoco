import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Lock,
  ArrowLeft,
  RefreshCw,
  LogIn,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { login } from "@/services/auth.service";
import { deleteUser, getUser } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/components/NotificationCenter";
import { SpinnerOverlay } from "@/components/Spinner";
import { PyrosLogo } from "@/components/brand/PyrosLogo";
import { isUserDeactivated, markAccountAsDeleted } from "@/utils/deletedAccount";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Eliminación de Datos — PyrosFit" },
      {
        name: "description",
        content: "Solicita la baja de tu cuenta y la eliminación permanente de tus datos en PyrosFit.",
      },
    ],
  }),
  component: DeleteAccountPage,
});

type DeleteStep = "credentials" | "confirm" | "deleted";

function DeleteAccountPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<DeleteStep>("credentials");
  const [verifiedUserName, setVerifiedUserName] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUserName = userName.trim();
    if (!trimmedUserName) {
      notify.error("Error", "El usuario es obligatorio");
      return;
    }

    if (!password.trim()) {
      notify.error("Error", "La contraseña es obligatoria");
      return;
    }

    setIsLoading(true);

    try {
      const data = await login({ userName: trimmedUserName, password });
      const userId = Number(data?.id);

      if (!userId || isNaN(userId)) {
        notify.error("Error", "No se pudo identificar la cuenta del usuario.");
        return;
      }

      if (isUserDeactivated(data, null, { id: userId, userName: trimmedUserName })) {
        notify.error("Cuenta dada de baja", "Esta cuenta ya fue eliminada y no puede ingresar.");
        return;
      }

      const userData = await getUser(userId).catch(() => null);

      if (isUserDeactivated(data, userData, { id: userId, userName: trimmedUserName })) {
        notify.error("Cuenta dada de baja", "Esta cuenta ya fue eliminada y no puede ingresar.");
        return;
      }

      setResolvedUserId(userId);
      setVerifiedUserName(userData?.userName || trimmedUserName);
      setVerifiedEmail(userData?.email || "");
      setStep("confirm");
      notify.success("Cuenta verificada", "Ahora puedes continuar con el proceso de baja.");
    } catch (error: any) {
      console.error("Error al verificar las credenciales:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Credenciales inválidas. Verifica tu usuario y contraseña.";
      notify.error("Error", apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!resolvedUserId) return;

    setIsConfirmDialogOpen(false);
    setIsDeleting(true);

    try {
      await deleteUser(resolvedUserId);

      markAccountAsDeleted({
        id: resolvedUserId,
        userName: verifiedUserName,
        email: verifiedEmail,
      });

      if (Number(authUser?.id) === resolvedUserId) {
        logout();
      }

      setStep("deleted");
      notify.success(
        "Eliminación confirmada",
        "Tu cuenta y tus datos han sido dados de baja correctamente."
      );
    } catch (error: any) {
      console.error("Error al eliminar los datos del usuario:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "No se pudo completar la eliminación. Intenta de nuevo más tarde.";
      notify.error("Error", apiMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReset = () => {
    setStep("credentials");
    setPassword("");
    setVerifiedUserName("");
    setVerifiedEmail("");
    setResolvedUserId(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden"
      style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
    >
      {/* Background glow orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-primary opacity-15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <Link to="/" className="flex flex-col items-center gap-3 group">
            <PyrosLogo
              variant="icon"
              size="xl"
              iconClassName="h-16 w-16 group-hover:scale-105 transition-transform"
            />
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-foreground">
                PyrosFit
              </h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow font-medium mt-1">
                Eliminación de Datos
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <Card className="rounded-2xl border border-border bg-card/85 backdrop-blur-md p-6 sm:p-8 shadow-elevated">
          {step === "credentials" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  ¿Deseas eliminar tus datos?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Ingresa tu usuario y contraseña para validar tu identidad y continuar con la baja
                  de tu cuenta.
                </p>
              </div>

              <form onSubmit={handleVerifyCredentials} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="userName"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Usuario
                  </Label>
                  <div className="relative">
                    <Input
                      id="userName"
                      name="userName"
                      type="text"
                      placeholder="usuario"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      autoFocus
                      autoComplete="username"
                      className="bg-input/60 pl-10 focus:border-primary"
                    />
                    <User className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="bg-input/60 pl-10 focus:border-primary"
                    />
                    <Lock className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full gap-2 font-medium cursor-pointer shadow-glow py-5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Verificar y continuar</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-border/40">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-5">
              <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-display text-2xl text-foreground">Dar de baja cuenta</h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Usuario verificado:{" "}
                  <strong className="text-foreground">{verifiedUserName}</strong>
                  {verifiedEmail ? (
                    <>
                      {" "}
                      (<span className="text-foreground/80">{verifiedEmail}</span>)
                    </>
                  ) : null}
                </p>
              </div>

              <div className="w-full text-left p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-muted-foreground leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-destructive font-semibold">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Atención: acción permanente</span>
                </div>
                <p>
                  Al dar de baja tu cuenta se eliminará tu perfil, historial de entrenamientos,
                  progreso físico, rachas y demás datos personales asociados en PyrosFit.
                </p>
              </div>

              <div className="w-full space-y-2.5 pt-1">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={() => setIsConfirmDialogOpen(true)}
                  disabled={isDeleting}
                  className="w-full gap-2 font-semibold cursor-pointer py-5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Dar de baja y eliminar datos</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleReset}
                  disabled={isDeleting}
                  className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Usar otra cuenta</span>
                </Button>
              </div>
            </div>
          )}

          {step === "deleted" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-300 space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span>Eliminación Confirmada</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                Cuenta dada de baja
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Se ha completado la eliminación de los datos asociados a{" "}
                <strong className="text-foreground">{verifiedUserName}</strong>.
              </p>

              <Link to="/login" className="w-full block pt-2">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full shadow-glow font-medium cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} PyrosFit. Todos los derechos reservados.
        </p>
      </div>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>¿Confirmar eliminación de datos?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Si confirmas esta acción, tu cuenta (<strong>{verifiedUserName}</strong>) y todos tus
              datos personales serán eliminados permanentemente. Esta operación no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeletion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Confirmar y eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(isLoading || isDeleting) && (
        <SpinnerOverlay label={isDeleting ? "Eliminando datos..." : "Verificando cuenta..."} />
      )}
    </div>
  );
}
