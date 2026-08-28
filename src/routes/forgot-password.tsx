import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Mail, ArrowLeft, MailCheck, RefreshCw, Sparkles, Send } from "lucide-react";
import { forgotPassword } from "@/services/auth.service";
import { notify } from "@/components/NotificationCenter";
import { SpinnerOverlay } from "@/components/Spinner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar Contraseña — PyrosFit" },
      {
        name: "description",
        content: "Solicita un enlace seguro para restablecer la contraseña de tu cuenta PyrosFit.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      notify.error("Por favor ingresa tu correo electrónico");
      return;
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      notify.error("Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword({ email: trimmedEmail });
      setSubmittedEmail(trimmedEmail);
      setIsSubmitted(true);
      notify.success("¡Correo enviado!", "Revisa tu bandeja de entrada para continuar.");
      startCooldown();
    } catch (error: any) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "No se pudo procesar la solicitud. Verifica el correo e intenta nuevamente.";
      notify.error("Error", apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !submittedEmail) return;

    setIsLoading(true);
    try {
      await forgotPassword({ email: submittedEmail });
      notify.success("¡Correo reenviado!", `Hemos vuelto a enviar el enlace a ${submittedEmail}`);
      startCooldown();
    } catch (error: any) {
      console.error("Error al reenviar correo:", error);
      notify.error("Error", "No se pudo reenviar el correo. Intenta de nuevo en unos momentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-foreground">
                PyrosFit
              </h1>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow font-medium mt-1">
                Recuperación de Contraseña
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <Card className="rounded-2xl border border-border bg-card/85 backdrop-blur-md p-6 sm:p-8 shadow-elevated">
          {!isSubmitted ? (
            /* FORM STATE */
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      className="bg-input/60 pl-10 focus:border-primary"
                    />
                    <Mail className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Enviar enlace de recuperación</span>
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
          ) : (
            /* SUCCESS STATE */
            <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-400 space-y-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                  <MailCheck className="h-10 w-10 text-emerald-400" />
                </div>
                <Sparkles className="absolute -top-1.5 -right-1.5 h-6 w-6 text-primary-glow animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <span>Correo de Recuperación Enviado</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-foreground">
                ¡Revisa tu bandeja de entrada!
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
                Hemos enviado un mensaje a <strong className="text-foreground">{submittedEmail}</strong> con el botón seguro para establecer tu nueva clave.
              </p>

              {/* Security notice box */}
              <div className="w-full text-left p-3.5 rounded-xl border border-border/80 bg-background/50 text-xs text-muted-foreground leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 text-primary-glow font-medium">
                  <span>⏱️ Vigencia del enlace:</span>
                </div>
                <p>
                  Por motivos de seguridad, el enlace expirará en <strong>2 horas</strong>. Si no lo encuentras en tu bandeja principal, revisa tu carpeta de <em>Spam o Correo no deseado</em>.
                </p>
              </div>

              {/* Action buttons */}
              <div className="w-full space-y-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleResend}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full border-border hover:bg-sidebar-accent cursor-pointer text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Reenviar correo en (${resendCooldown}s)`
                      : "¿No recibiste el correo? Reenviar"}
                  </span>
                </Button>

                <Link to="/login" className="w-full block">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full shadow-glow font-medium cursor-pointer"
                  >
                    Volver al Inicio de Sesión
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

      {isLoading && <SpinnerOverlay label="Enviando correo..." />}
    </div>
  );
}
