import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { LoginCredentials, UserAuth } from "@/types/auth";
import { getUser, getUserDetails } from "@/services/user.service";
import { notify } from "@/components/NotificationCenter";
import Spinner, { SpinnerOverlay } from "@/components/Spinner";
import { getStudent } from "@/services/student.service";
import { getCoach } from "@/services/coach.service";
import { preview } from "vite";
import { PyrosLogo } from "@/components/brand/PyrosLogo";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsDialog } from "@/components/legal/TermsDialog";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar Sesión — PyrosFit" },
      { name: "description", content: "Inicia sesión en tu cuenta PyrosFit" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loginForm, setLoginForm] = useState({
    userName: "",
    password: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState<boolean>(false);
  const [initialTermsTab, setInitialTermsTab] = useState<"terms" | "privacy">("terms");

  const openTerms = (tab: "terms" | "privacy" = "terms") => {
    setInitialTermsTab(tab);
    setTermsDialogOpen(true);
  };
  //@TODO probablemente sea buena idea en el futuro ver si es posible hacer un helper
  // de los onChange
  const handleInputChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginForm.userName.trim()) {
      notify.error("Error", `El usuario es obligatorio`);
      return;
    }

    if (!loginForm.password.trim()) {
      notify.error("Error", `La constraseña es obligatoria`);
      return;
    }

    if (!acceptedTerms) {
      notify.error(
        "Aceptación requerida",
        "Debes aceptar los Términos y Condiciones y la Política de Privacidad para iniciar sesión.",
      );
      return;
    }

    setLoading(true);

    const loginData: LoginCredentials = {
      userName: loginForm.userName,
      password: loginForm.password,
    };

    try {
      const data = await login(loginData);
      const { id, token } = data;
      const [userData, studentData, coachData] = await Promise.all([
        getUser(id).catch(() => null),
        getStudent(id).catch(() => null),
        getCoach(id).catch(() => null),
      ]);

      let myCoachId = 0;
      if (studentData !== null && userData) {
        try {
          const details = await getUserDetails(userData.id).catch(() => null);
          if (details?.coach?.id) {
            myCoachId = details.coach.id;
          }
        } catch {
          myCoachId = 0;
        }
      }

      const firstName = userData?.firstName || "Usuario";

      const isRealCoach = coachData !== null && Number(coachData?.id) > 0;

      const user: UserAuth = {
        id,
        firstName,
        studentId: studentData?.id ?? (studentData ? Number(studentData) : 0),
        myCoachId: isRealCoach ? 0 : myCoachId,
        coachId: coachData?.id ?? 0,
        role: isRealCoach ? "coach" : "student",
      };

      if (token) {
        setAuth(user, token);
      }
      notify.success("Logueado con exito!");
      navigate({ to: "/perfil/$userId", params: { userId: id } });
    } catch (error: any) {
      console.error("error al iniciar sesion", error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        "Error al iniciar Sesión. Verifica tus credenciales.";
      notify.error("Error", backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4"
      style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <PyrosLogo variant="icon" size="xl" iconClassName="h-16 w-16" />
          <div className="text-center">
            <h1 className="font-display text-5xl tracking-wider">PyrosFit</h1>
            <a
              href="https://geek-solutions-landing-page-front.vercel.app/#inicio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-muted-foreground uppercase tracking-[0.25em] mt-1 hover:text-primary transition-colors cursor-pointer"
            >
              by GeekSolutions
            </a>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-8 shadow-elevated space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Usuario</Label>
              <Input
                id="userName"
                name="userName"
                type="text"
                placeholder="usuario"
                value={loginForm.userName}
                onChange={(e) => handleInputChange(e)}
                required
                autoComplete="username"
                className="bg-input/60"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => handleInputChange(e)}
                required
                autoComplete="current-password"
                className="bg-input/60"
              />
            </div>

            {/* Checkbox Términos y Condiciones */}
            <div className="flex items-start space-x-2.5 pt-1">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-snug cursor-pointer select-none"
              >
                He leído y acepto los{" "}
                <button
                  type="button"
                  onClick={() => openTerms("terms")}
                  className="text-primary hover:underline font-medium focus:outline-none inline"
                >
                  Términos y Condiciones
                </button>{" "}
                y la{" "}
                <button
                  type="button"
                  onClick={() => openTerms("privacy")}
                  className="text-primary hover:underline font-medium focus:outline-none inline"
                >
                  Política de Privacidad
                </button>
                .
              </label>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading || !acceptedTerms}
            >
              {isLoading ? "Ingresando" : "Ingresar"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            ¿Eres entrenador?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Regístrate Aquí
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            ¿Quieres entrenar?{" "}
            <Link
              to="/register-info"
              className="text-primary font-medium hover:underline"
            >
              Crea tu cuenta Aquí
            </Link>
          </p>
          <div className="pt-2 border-t border-border/40 text-center space-y-1.5">
            <p className="text-xs text-muted-foreground/75 leading-relaxed">
              * Si eres cliente, pídele a tu entrenador que te comparta el link de registro.
            </p>
            <div>
              <Link
                to="/terms"
                className="text-[11px] text-muted-foreground/80 hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Consultar Términos y Condiciones completos
              </Link>
            </div>
          </div>
          {isLoading && <SpinnerOverlay label="Iniciando" />}
        </div>
      </div>

      {/* Modal interactivo de lectura in situ */}
      <TermsDialog
        open={termsDialogOpen}
        onOpenChange={setTermsDialogOpen}
        initialTab={initialTermsTab}
        onAccept={() => setAcceptedTerms(true)}
      />
    </div>
  );
}
