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

    setLoading(true);

    const loginData: LoginCredentials = {
      userName: loginForm.userName,
      password: loginForm.password,
    };

    try {
      const data = await login(loginData);
      const { id, token } = data;
      const [userData, studentData, coachData] = await Promise.all([
        getUser(id),
        getStudent(id),
        getCoach(id),
      ]);

      const { firstName } = userData;

      const user: UserAuth = {
        id,
        firstName,
        studentId: studentData === null ? 0 : studentData.id,
        coachId: coachData === null ? 0 : coachData.id,
        role: studentData === null ? "coach" : "student",
      };

      if (token) {
        setAuth(user, token);
      }
      notify.success("Logueado con exito!");
      navigate({ to: "/perfil/$userId", params: { userId: id } });
    } catch (error) {
      console.error("error al iniciar sesion");
      notify.error("error", "Error al iniciar Sesión");
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
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Dumbbell className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-5xl tracking-wider">PyrosFit</h1>
            {/* <p className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
              training co.
            </p> */}
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
              <Label htmlFor="password">Contraseña</Label>
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
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Ingresando" : "Ingresar"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Regístrate
            </Link>
          </p>
          {isLoading && <SpinnerOverlay label="Iniciando" />}
        </div>
      </div>
    </div>
  );
}
