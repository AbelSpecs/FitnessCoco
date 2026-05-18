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
import { age } from "@/utils/age";
import { register } from "@/services/auth.service";
import { RegisterCredentials } from "@/types/auth";

export const Route = createFileRoute("/register-info")({
  head: () => ({
    meta: [
      { title: "Información Personal — PYROSFIT" },
      { name: "description", content: "Completa tu información personal en PYROSFIT" },
    ],
  }),
  component: RegisterInfoPage,
});

function RegisterInfoPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    birthdate: "",
    weight: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const ageNum = age(form.birthdate);
    if (!ageNum || ageNum < 10 || ageNum > 120) {
      setError("Ingresa una fecha de nacimiento válida");
      return;
    }
    const weightNum = Number(form.weight);
    if (!weightNum || weightNum < 20 || weightNum > 400) {
      setError("Ingresa un peso válido (kg)");
      return;
    }
    if (!form.gender) {
      setError("Selecciona tu género");
      return;
    }

    setLoading(true);

    const completeForm: RegisterCredentials = {
      firstName: form.name,
      lastName: "",
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      countryId: 0,
      cityId: 0,
      address: "",
      birthdate: form.birthdate,
    };

    try {
      // const data = await register(form);

      setLoading(false);
      navigate({ to: "/login" });
    } catch (error) {
      setLoading(false);
      setError("Error al registrar. Intenta nuevamente.");
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
              Gracias <span className="text-foreground font-medium">{form.name}</span>, tus datos se
              han registrado correctamente.
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

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-input/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
              <Input
                id="birthdate"
                type="date"
                placeholder="Fecha de Nacimiento"
                value={form.birthdate}
                onChange={(e) => {
                  setForm({ ...form, birthdate: e.target.value });
                }}
                required
                className="bg-input/60 dark:[color-scheme:dark] pointer-events-auto cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={20}
                max={400}
                step="0.1"
                placeholder="70"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                required
                className="bg-input/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select
                value={form.gender}
                onValueChange={(value) => setForm({ ...form, gender: value })}
              >
                <SelectTrigger id="gender" className="bg-input/60">
                  <SelectValue placeholder="Selecciona tu género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefiero no decirlo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
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
