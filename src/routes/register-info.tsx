import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { age } from "@/utils/age";
import { associateCoach, register } from "@/services/auth.service";
import { CoachStudent, RegisterCredentials } from "@/types/auth";
import { City, Country } from "@/types/general";
import { getCities, getCountries } from "@/services/general.service";
import { notify } from "@/components/NotificationCenter";
import { Student } from "@/types/user";
import { createStudent } from "@/services/user.service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Goal, goalLabels } from "@/types/goals";
import { SpinnerOverlay } from "@/components/Spinner";

type RegisterSearch = {
  coachId?: string;
};

export const Route = createFileRoute("/register-info")({
  head: () => ({
    meta: [
      { title: "Información Personal — PYROSFIT" },
      { name: "description", content: "Completa tu información personal en PYROSFIT" },
    ],
  }),
  loader: async () => {
    try {
      const countries: Country[] = await getCountries();

      return { countries };
    } catch (error) {
      console.error("Error al obtener los países:", error);
      throw error;
    }
  },
  pendingComponent: () => <SpinnerOverlay />,
  component: RegisterInfoPage,
  validateSearch: (search: Record<string, unknown>): RegisterSearch => {
    return {
      coachId: search.coachId as string | undefined,
    };
  },
});

function RegisterInfoPage() {
  const { countries } = Route.useLoaderData();
  const { coachId } = Route.useSearch();
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<City[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
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
    phoneNumber: "",
    countryId: 0,
    cityId: 0,
    address: "",
    birthdate: "",
    weight: 0,
    fitnessGoal: "muscle",
  });

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePreviousStep = () => setStep((prev) => prev - 1);

  const handleRadioOnChange = (e: Goal) => {
    setRegisterForm({ ...registerForm, fitnessGoal: e });
  };

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

    if (!registerForm.phoneNumber!.trim()) {
      notify.error("Error", `El usuario es obligatorio`);
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

    const weightValue = registerForm.weight ? Number(registerForm.weight) : NaN;
    if (isNaN(weightValue)) {
      notify.error("Error", `El peso es obligatorio`);
      return;
    }

    const MIN_WEIGHT = 30;
    const MAX_WEIGHT = 300;

    if (weightValue < MIN_WEIGHT || weightValue > MAX_WEIGHT) {
      notify.error("Error", `El peso debe estar entre ${MIN_WEIGHT} y ${MAX_WEIGHT} kg`);
      return;
    }

    const selectedGoal = registerForm.fitnessGoal || goal;

    if (!selectedGoal || !selectedGoal.toString().trim()) {
      notify.error("Error", "Debes seleccionar al menos un objetivo para continuar");
      return;
    }

    setLoading(true);

    try {
      const data = await register(registerForm);

      const studentData: Student = {
        userId: Number(data.id),
        weight: registerForm.weight,
        height: 0,
        bodyFatPercentage: 0,
        fitnessGoal: registerForm.fitnessGoal,
        activityLevel: "",
        medicalConditions: "",
        allergies: "",
        fitnessExperience: "",
        generalNotes: "",
        gymId: 1,
      };

      const clientData = await createStudent(studentData);

      const info = await associateCoach({
        coachId: Number(coachId),
        studentId: Number(clientData.id),
        status: true,
      });

      notify.created("Usuario registrado!");
      setSuccess(true);
    } catch (error) {
      console.error("Error al registrar", error);
      notify.error("Error al registrar", "Intenta de nuevo");
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
            <h2 className="text-xl font-semibold">¡Información guardada!</h2>
            <p className="text-sm text-muted-foreground">
              Gracias <span className="text-foreground font-medium">{registerForm.firstName}</span>,
              tus datos se han registrado correctamente.
            </p>
            <Link to="/login" className="text-primary font-medium hover:underline text-sm">
              Ir a iniciar sesión
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

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-md p-8 shadow-elevated space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Información Personal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cuéntanos sobre ti para personalizar tu entrenamiento
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Paso 1: Datos personales */}
            {step === 1 && (
              <>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  Paso 1 de 3: Información básica
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
                  Paso 2 de 3: Información adicional
                </p>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    placeholder="Fecha de Nacimiento"
                    value={registerForm.birthdate}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, birthdate: e.target.value })
                    }
                    required
                    className="bg-input/60 dark:[color-scheme:dark] pointer-events-auto cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pais</Label>
                  {/* <Input
                    id="country"
                    type="text"
                    placeholder="Pais"
                    value={registerForm.country}
                    onChange={(e) => setRegisterForm({ ...registerForm, country: e.target.value })}
                    required
                    className="bg-input/60"
                    /> */}
                  <Select
                    value={String(registerForm.countryId)}
                    onValueChange={(value) => {
                      handleCities(Number(value));
                    }}
                  >
                    <SelectTrigger id="country" className="bg-input/60">
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="focus:text-white">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  {/* <Input
                    id="city"
                    type="text"
                    placeholder="Ciudad"
                    value={registerForm.city}
                    onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })}
                    required
                    className="bg-input/60"
                    /> */}
                  <Select
                    value={String(registerForm.cityId)}
                    onValueChange={(value) => {
                      setRegisterForm({ ...registerForm, cityId: Number(value) });
                    }}
                  >
                    <SelectTrigger id="city" className="bg-input/60">
                      <SelectValue placeholder="Selecciona la ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)} className="focus:text-white">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    placeholder="0424-2586514"
                    value={registerForm.phoneNumber}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, phoneNumber: e.target.value })
                    }
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
                    type="button"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                    disabled={loading}
                  >
                    {"Siguiente"}
                  </Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  Paso 3 de 3: Información sobre el entrenamiento
                </p>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Peso (kg)"
                    value={registerForm.weight}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, weight: Number(e.target.value) })
                    }
                    required
                    className="bg-input/60"
                  />
                </div>
                <Label>Objetivos</Label>
                <RadioGroup
                  value={registerForm?.fitnessGoal as Goal}
                  onValueChange={(v) => {
                    setGoal(v as Goal);
                    handleRadioOnChange(v as Goal);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {(Object.keys(goalLabels) as Goal[]).map((g) => {
                    return (
                      <div
                        key={g}
                        className={`flex items-center gap-2.5 py-2 px-3.5 rounded-lg border cursor-pointer transition-all ${
                          goal === g
                            ? "bg-gradient-primary border-primary-glow shadow-glow text-primary-foreground"
                            : "bg-background/40 border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={g} id={g} className="h-4 w-4 border-current" />
                        <span className="text-sm font-medium leading-none">{goalLabels[g]}</span>
                      </div>
                    );
                  })}
                </RadioGroup>
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
