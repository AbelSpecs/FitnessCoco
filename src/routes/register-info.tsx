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
  const [form, setForm] = useState({
    name: "",
    age: "",
    weight: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const ageNum = Number(form.age);
    if (!ageNum || ageNum < 10 || ageNum > 120) {
      setError("Ingresa una edad válida");
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
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 600);
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
              Gracias <span className="text-foreground font-medium">{form.name}</span>, tus datos
              se han registrado correctamente.
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
                placeholder="Tu nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-input/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={120}
                placeholder="25"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
                className="bg-input/60"
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

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar información"}
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
