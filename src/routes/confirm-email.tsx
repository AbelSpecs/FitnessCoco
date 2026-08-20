import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Flame, Sparkles } from "lucide-react";
import { confirmEmail } from "@/services/auth.service";
import { notify } from "@/components/NotificationCenter";

interface ConfirmEmailSearch {
  userId?: string;
  token?: string;
  code?: string;
}

export const Route = createFileRoute("/confirm-email")({
  validateSearch: (search: Record<string, unknown>): ConfirmEmailSearch => {
    return {
      userId: typeof search.userId === "string" ? search.userId : undefined,
      token: typeof search.token === "string" ? search.token : undefined,
      code: typeof search.code === "string" ? search.code : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Activar cuenta — PyrosFit" },
      {
        name: "description",
        content: "Confirma tu dirección de correo electrónico y activa tu cuenta de entrenamiento en PyrosFit.",
      },
    ],
  }),
  component: ConfirmEmailPage,
});

type StatusState = "validating" | "success" | "error";

function ConfirmEmailPage() {
  const { userId, token, code } = Route.useSearch();
  const [status, setStatus] = useState<StatusState>("validating");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const activeToken = token || code || "";

  useEffect(() => {
    let isMounted = true;

    const executeConfirmation = async () => {
      if (!activeToken) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("El enlace no contiene el token o código de activación requerido.");
        }
        return;
      }

      try {
        setStatus("validating");
        await confirmEmail({
          userId: userId ? Number(userId) : undefined,
          token: activeToken,
          code: activeToken,
        });

        if (isMounted) {
          setStatus("success");
          notify.success("¡Cuenta activada!", "Tu correo ha sido confirmado correctamente.");
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus("error");
          const apiMessage =
            error.response?.data?.message ||
            error.response?.data?.title ||
            "El enlace de activación ha expirado o ya ha sido utilizado.";
          setErrorMessage(apiMessage);
        }
      }
    };

    executeConfirmation();

    return () => {
      isMounted = false;
    };
  }, [userId, activeToken]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background Mesh Gradient */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl sm:text-3xl tracking-wider text-foreground">
              PYROSFIT
            </span>
          </Link>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow font-medium">
            Activación de Cuenta
          </p>
        </div>

        {/* Dynamic State Card */}
        <Card className="p-6 sm:p-8 bg-gradient-card border-border shadow-elevated relative overflow-hidden">
          {/* STATE 1: VALIDATING */}
          {status === "validating" && (
            <div className="flex flex-col items-center text-center py-4 sm:py-6 animate-in fade-in duration-300">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Flame className="h-10 w-10 text-primary-glow animate-pulse" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border border-primary/20 animate-spin pointer-events-none" />
              </div>

              <h1 className="font-display text-2xl sm:text-3xl mb-2 text-foreground">
                Validando tu cuenta...
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs leading-relaxed">
                Estamos verificando tu enlace de activación en nuestros servidores. Solo tomará unos segundos.
              </p>

              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/80">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary-glow" />
                <span>Procesando confirmación segura</span>
              </div>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-400">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>
                <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-primary-glow animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-3">
                <span>Cuenta Verificada</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl mb-2 text-foreground">
                ¡Tu cuenta ha sido validada!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">
                Tu dirección de correo ha sido confirmada con éxito. Ya puedes iniciar sesión con tus credenciales y acceder a tus entrenamientos.
              </p>

              <Link to="/login" className="w-full">
                <Button
                  size="lg"
                  className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-medium text-sm sm:text-base py-5 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          {/* STATE 3: ERROR */}
          {status === "error" && (
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-400">
              <div className="h-20 w-20 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium mb-3">
                <span>Enlace No Válido</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl mb-2 text-foreground">
                Enlace no válido o expirado
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">
                {errorMessage ||
                  "El enlace de activación ha caducado (límite de 24 horas) o ya ha sido utilizado para validar tu cuenta."}
              </p>

              <div className="w-full space-y-3">
                <Link to="/login" className="w-full block">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-medium cursor-pointer"
                  >
                    Ir al Inicio de Sesión
                  </Button>
                </Link>
                <Link to="/register" className="w-full block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs"
                  >
                    Crear una nueva cuenta
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground/70 mt-6">
          © {new Date().getFullYear()} PyrosFit. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
