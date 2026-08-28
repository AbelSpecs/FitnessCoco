import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dumbbell,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { resetPassword } from "@/services/auth.service";
import { notify } from "@/components/NotificationCenter";
import { SpinnerOverlay } from "@/components/Spinner";

interface ResetPasswordSearch {
  userId?: string;
  token?: string;
  code?: string;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    return {
      userId: typeof search.userId === "string" ? search.userId : undefined,
      token: typeof search.token === "string" ? search.token : undefined,
      code: typeof search.code === "string" ? search.code : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Restablecer Contraseña — PyrosFit" },
      {
        name: "description",
        content: "Establece una nueva contraseña segura para tu cuenta PyrosFit.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { userId, token, code } = Route.useSearch();
  const navigate = useNavigate();

  const activeToken = token || code || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeToken) {
      notify.error("Enlace incompleto", "El enlace no contiene el token de recuperación.");
      return;
    }

    if (!hasMinLength) {
      notify.error("Contraseña corta", "La contraseña debe contener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      notify.error("Las contraseñas no coinciden", "Verifica que ambas contraseñas sean idénticas.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await resetPassword({
        code: activeToken,
        token: activeToken,
        userId: userId ? Number(userId) : undefined,
        newPassword: password,
        confirmPassword: confirmPassword,
      });

      setIsSuccess(true);
      notify.success("¡Contraseña actualizada!", "Ya puedes iniciar sesión con tu nueva clave.");
    } catch (error: any) {
      console.error("Error al restablecer la contraseña:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "El enlace de recuperación ha expirado o no es válido. Por favor solicita uno nuevo.";
      setErrorMessage(apiMessage);
      notify.error("Error", apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden text-foreground"
      style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
    >
      {/* Background glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-primary opacity-15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3">
          <Link to="/" className="flex flex-col items-center gap-3 group">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-foreground">
                PyrosFit
              </h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow font-medium mt-1">
                Seguridad de tu Cuenta
              </p>
            </div>
          </Link>
        </div>

        {/* Dynamic Card */}
        <Card className="rounded-2xl border border-border bg-card/85 backdrop-blur-md p-6 sm:p-8 shadow-elevated">
          {/* SCENARIO 1: MISSING TOKEN IN URL */}
          {!activeToken ? (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-400 space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
                <span>Enlace Inválido</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                Token no encontrado
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                El enlace que has abierto no contiene los parámetros de seguridad requeridos para restablecer tu contraseña.
              </p>

              <div className="w-full space-y-2.5 pt-2">
                <Link to="/forgot-password" className="w-full block">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full shadow-glow font-medium cursor-pointer"
                  >
                    Solicitar nuevo enlace
                  </Button>
                </Link>

                <Link to="/login" className="w-full block">
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs"
                  >
                    Ir al Inicio de Sesión
                  </Button>
                </Link>
              </div>
            </div>
          ) : !isSuccess ? (
            /* SCENARIO 2: PASSWORD RESET FORM */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  Restablecer Contraseña
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta PyrosFit.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                      className="bg-input/60 pl-10 pr-10 focus:border-primary"
                    />
                    <Lock className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Requirements feedback */}
                  <div className="space-y-1 pt-1.5 px-0.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <div
                        className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasMinLength
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {hasMinLength ? <Check className="h-2.5 w-2.5" /> : "•"}
                      </div>
                      <span className={hasMinLength ? "text-emerald-400 font-medium" : "text-muted-foreground"}>
                        Mínimo 8 caracteres
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <div
                        className={`h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] ${
                          hasNumber && hasUppercase
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {hasNumber && hasUppercase ? <Check className="h-2.5 w-2.5" /> : "•"}
                      </div>
                      <span className={hasNumber && hasUppercase ? "text-emerald-400 font-medium" : "text-muted-foreground"}>
                        Incluye mayúsculas y números (recomendado)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                    >
                      Confirmar Contraseña
                    </Label>
                    {passwordsMatch && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Coinciden
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`bg-input/60 pl-10 pr-10 focus:border-primary ${
                        confirmPassword.length > 0 && !passwordsMatch
                          ? "border-destructive/60 focus:border-destructive"
                          : ""
                      }`}
                    />
                    <Lock className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full gap-2 font-medium cursor-pointer shadow-glow py-5 mt-2"
                  disabled={isLoading || !hasMinLength || !passwordsMatch}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Actualizando contraseña...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Restablecer Contraseña</span>
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center border-t border-border/40">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <span>¿Recordaste tu clave?</span>
                  <span className="text-primary hover:underline font-semibold">Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          ) : (
            /* SCENARIO 3: SUCCESS STATE */
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-400 space-y-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-primary-glow animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span>Cambio Confirmado</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                ¡Contraseña actualizada!
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                La contraseña de tu cuenta PyrosFit ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva clave de acceso.
              </p>

              <div className="w-full pt-2">
                <Link to="/login" className="w-full block">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-medium text-sm sm:text-base py-5 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} PyrosFit. Todos los derechos reservados.
        </p>
      </div>

      {isLoading && <SpinnerOverlay label="Actualizando contraseña..." />}
    </div>
  );
}
