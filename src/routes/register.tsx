import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell } from "lucide-react";
import { register } from "@/services/auth.service";

const COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Otro",
];

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crear Cuenta — FITYEI" },
      { name: "description", content: "Crea tu cuenta en FITYEI" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    country: "",
    city: "",
    address: "",
    birthdate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNextStep = () => setStep(2);
  const handlePreviousStep = () => setStep(1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (registerForm.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    console.log(registerForm);
    const data = await register(registerForm);
    setLoading(false);
    // console.log("re registre con", { firstName, email, password });
    // const { error: err } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: { full_name: firstName },
    //     emailRedirectTo: window.location.origin,
    //   },
    // });

    // if (err) {
    //   setError("error");
    //   setLoading(false);
    // } else {
    //   setSuccess(true);
    //   setLoading(false);
    // }
    navigate({ to: "/login" });
  };

  //   const handleGoogleLogin = async () => {
  //     setError("");
  //     const result = await lovable.auth.signInWithOAuth("google", {
  //       redirect_uri: window.location.origin,
  //     });
  //     if (result.error) {
  //       setError(result.error.message);
  //       return;
  //     }
  //     if (result.redirected) return;
  //     navigate({ to: "/" });
  //   };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background px-4"
        style={{ backgroundImage: "var(--gradient-mesh)", backgroundAttachment: "fixed" }}
      >
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-8 shadow-elevated text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow mx-auto">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold">¡Revisa tu email!</h2>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un enlace de confirmación a{" "}
              <span className="text-foreground font-medium">{registerForm.email}</span>. Confirma tu
              empezar.
            </p>
            <Link to="/login" className="text-primary font-medium hover:underline text-sm">
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="font-display text-5xl tracking-wider">FITYEI</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.25em]">
              training co.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-8 shadow-elevated space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Crear Cuenta</h2>
            {/* <p className="text-sm text-muted-foreground mt-1">
              Únete a FITYEI y comienza tu entrenamiento
            </p> */}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Paso 1: Datos personales */}
            {step === 1 && (
              <>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  Paso 1 de 2: Información básica
                </p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Nombre"
                      value={registerForm.firstName}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, firstName: e.target.value })
                      }
                      required
                      className="bg-input/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Apellido"
                      value={registerForm.lastName}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, lastName: e.target.value })
                      }
                      required
                      className="bg-input/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userName">UserName</Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Nombre de usuario"
                    value={registerForm.userName}
                    onChange={(e) => setRegisterForm({ ...registerForm, userName: e.target.value })}
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                    }
                    required
                    className="bg-input/60"
                  />
                </div>
                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  {"Siguiente"}
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  Paso 2 de 2: Información adicional
                </p>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    placeholder="123-456-7890"
                    value={registerForm.phoneNumber}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, phoneNumber: e.target.value })
                    }
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select
                    value={registerForm.country}
                    onValueChange={(value) =>
                      setRegisterForm({ ...registerForm, country: value })
                    }
                  >
                    <SelectTrigger id="country" className="bg-input/60">
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Ciudad"
                    value={registerForm.city}
                    onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Dirección"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthdate"
                    type="text"
                    placeholder="Fecha de Nacimiento"
                    value={registerForm.birthdate}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, birthdate: e.target.value })
                    }
                    required
                    className="bg-input/60"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={handlePreviousStep}
                    disabled={loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">o continuar con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            // onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button> */}

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
