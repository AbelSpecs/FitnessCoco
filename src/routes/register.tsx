import { createFileRoute, Link } from "@tanstack/react-router";
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
import { getCities, getCountries } from "@/services/general.service";
import { City, PhoneCode } from "@/types/general";
import { RegisterCredentials } from "@/types/auth";
import { age } from "@/utils/age";
import { notify } from "@/components/NotificationCenter";
import { Coach } from "@/types/user";
import { createCoach } from "@/services/coach.service";
import { SpinnerOverlay } from "@/components/Spinner";
import { CountryDto } from "@/dtos/countryDto";
import { SearchableSelect } from "@/components/ui/searchable-select";
import DatePicker from "@/components/DatePicker";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Crear Cuenta — PYROSFIT" },
      { name: "description", content: "Crea tu cuenta en PYROSFIT" },
    ],
  }),
  loader: async () => {
    try {
      const countries: CountryDto[] = await getCountries();
      const phoneCodes: PhoneCode[] = countries.map((c) => {
        return { id: c.id, code: c.phoneCode };
      });

      return { countries, phoneCodes: phoneCodes };
    } catch (error) {
      console.error("Error al obtener los países:", error);
      throw error;
    }
  },
  pendingComponent: () => <SpinnerOverlay />,
  component: RegisterPage,
});

function RegisterPage() {
  const { countries, phoneCodes } = Route.useLoaderData();
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<City[]>([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [registerForm, setRegisterForm] = useState<RegisterCredentials>({
    firstName: "",
    lastName: "",
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    phoneCode: "",
    partialPhoneNumber: "",
    phoneNumber: "",
    countryId: 0,
    cityId: 0,
    address: "",
    birthdate: new Date(),
  });

  const handleNextStep = () => setStep(2);
  const handlePreviousStep = () => setStep(1);

  const handleCities = async (value: number) => {
    setRegisterForm({ ...registerForm, countryId: value });

    try {
      const cities = await getCities(value);

      setCities(cities ? [cities] : []);
    } catch (error) {
      console.error("Error al obtener las ciudades del pais:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerForm.firstName!.trim()) {
      notify.error("Error", `El nombre es obligatorio`);
      return;
    }

    if (!registerForm.lastName!.trim()) {
      notify.error("Error", `El apellido es obligatorio`);
      return;
    }

    if (!registerForm.email!.trim()) {
      notify.error("Error", `El email es obligatorio`);
      return;
    }

    if (!emailRegex.test(registerForm.email!)) {
      notify.error("Error", `Introduce un correo electrónico válido`);
      return;
    }

    if (!registerForm.userName!.trim()) {
      notify.error("Error", `El usuario es obligatorio`);
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      notify.error("Error", `Las contraseñas no coinciden`);
      return;
    }
    if (registerForm.password!.length < 8) {
      notify.error("Error", `La contraseña debe tener al menos 8 caracteres`);
      return;
    }

    if (!registerForm.phoneCode!.trim()) {
      notify.error("Error", `El código de teléfono es obligatorio`);
      return;
    }

    if (!registerForm.partialPhoneNumber!.trim()) {
      notify.error("Error", `El teléfono es obligatorio`);
      return;
    }

    if (!registerForm.countryId) {
      notify.error("Error", `Selecciona un País`);
      return;
    }

    if (!registerForm.cityId) {
      notify.error("Error", `Selecciona una Ciudad`);
      return;
    }

    if (!registerForm.address!.trim()) {
      notify.error("Error", `La dirección es obligatoria`);
      return;
    }

    const ageNum = age(registerForm.birthdate);
    if (!ageNum || ageNum < 10 || ageNum > 120) {
      notify.error("Error", `Ingresa una fecha de nacimiento válida`);
      return;
    }

    setLoading(true);

    try {
      registerForm.phoneNumber = registerForm.phoneCode + registerForm.partialPhoneNumber;
      const { phoneCode, partialPhoneNumber } = registerForm;
      const data = await register(registerForm);

      const coachToCreate: Coach = {
        userId: data.id,
        bio: "",
        certifications: "",
      };

      const coachData = await createCoach(coachToCreate);

      notify.created("Coach registrado!");
      setSuccess(true);
    } catch (error) {
      console.error("Error al registrar. Intenta nuevamente.", error);
      notify.error("Error", `Error al registrar. Intenta nuevamente.`);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="font-display text-5xl tracking-wider">PYROSFIT</h1>
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
              Únete a PYROSFIT y comienza tu entrenamiento
            </p> */}
          </div>

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
                    autoComplete="new password"
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
                    autoComplete="new password"
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
                  <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                  <DatePicker
                    value={registerForm.birthdate}
                    onChange={(e) => setRegisterForm({ ...registerForm, birthdate: e! })}
                    placeholder="Fecha de Nacimiento"
                    startMonth={new Date(1950, 0)}
                    endMonth={new Date()}
                    disabled={{ after: new Date() }}
                    className="mt-1.5 bg-background/60 border-border focus-visible:ring-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pais</Label>
                  <SearchableSelect
                    value={registerForm.countryId ? String(registerForm.countryId) : ""}
                    placeholder="Selecciona tu país"
                    options={countries.map((c) => ({ value: c.id.toString(), label: c.name }))}
                    onValueChange={(value) => {
                      handleCities(Number(value));
                    }}
                    className="mt-1.5 bg-background/60 border-border focus:ring-primary/40 hover:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <SearchableSelect
                    value={registerForm.cityId ? String(registerForm.cityId) : ""}
                    placeholder="Selecciona la ciudad"
                    options={cities.map((c) => ({ value: c.id.toString(), label: c.name }))}
                    onValueChange={(value) => {
                      setRegisterForm({ ...registerForm, cityId: Number(value) });
                    }}
                    className="mt-1.5 bg-background/60 border-border focus:ring-primary/40 hover:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <div className="flex ">
                    <SearchableSelect
                      value={registerForm.phoneCode ? String(registerForm.phoneCode) : ""}
                      placeholder="Selecciona el Código"
                      options={phoneCodes.map((p) => ({ value: p.id.toString(), label: p.code }))}
                      onValueChange={(value) => {
                        setRegisterForm({ ...registerForm, phoneCode: value });
                      }}
                      className="w-25 mt-1.5 bg-background/60 border-border focus:ring-primary/40 hover:text-white"
                    />
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder="424-258-6514"
                      value={registerForm.partialPhoneNumber}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, partialPhoneNumber: e.target.value })
                      }
                      required
                      className="mt-1.5 bg-input/60"
                    />
                  </div>
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
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={handlePreviousStep}
                    disabled={loading}
                  >
                    {"Anterior"}
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
