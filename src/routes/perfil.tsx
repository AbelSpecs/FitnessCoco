import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { goalLabels, userProfile, type Goal } from "@/lib/mock-data";
import { useState } from "react";
import { CheckCircle2, HeartPulse, Pencil } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — FITYEI Training" },
      { name: "description", content: "Gestiona tus datos, objetivos y salud." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const [goal, setGoal] = useState<Goal>(userProfile.goal);

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Tu cuenta
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Identity */}
        <Card className="lg:col-span-1 bg-gradient-hero border-border p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-gradient-primary mx-auto flex items-center justify-center font-display text-5xl shadow-glow">
              {userProfile.name.charAt(0)}
            </div>
            <h2 className="font-display text-3xl mt-4">{userProfile.name}</h2>
            <p className="text-sm text-muted-foreground">Cliente · Plan Pro</p>
            <div className="grid grid-cols-3 gap-2 mt-6 text-center">
              <Stat label="Edad" value={`${userProfile.age}`} />
              <Stat label="Peso" value={`${userProfile.weight} kg`} />
              <Stat label="Racha" value={`${userProfile.streak}d`} />
            </div>
            <Button variant="glass" className="mt-6 w-full">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </div>
        </Card>

        {/* Basic data */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <h3 className="font-display text-2xl mb-5">Datos básicos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre" defaultValue={userProfile.name} />
            <Field label="Edad" defaultValue={`${userProfile.age}`} type="number" />
            <Field label="Peso (kg)" defaultValue={`${userProfile.weight}`} type="number" />
            <Field label="Género" defaultValue={userProfile.gender} />
          </div>
        </Card>

        {/* Goals */}
        <Card className="lg:col-span-2 bg-gradient-card border-border p-6">
          <h3 className="font-display text-2xl mb-5">Objetivos</h3>
          <RadioGroup
            value={goal}
            onValueChange={(v) => setGoal(v as Goal)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {(Object.keys(goalLabels) as Goal[]).map((g) => (
              <Label
                key={g}
                htmlFor={g}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  goal === g
                    ? "bg-gradient-primary border-primary-glow shadow-glow text-primary-foreground"
                    : "bg-background/40 border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={g} id={g} className="border-current" />
                <span className="font-medium">{goalLabels[g]}</span>
              </Label>
            ))}
          </RadioGroup>
        </Card>

        {/* Health */}
        <Card className="lg:col-span-1 bg-gradient-card border-border p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-2xl">Salud · PAR-Q</h3>
            <HeartPulse className="h-5 w-5 text-success" />
          </div>
          {userProfile.parqCompleted ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium">Completado</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Vigente hasta {userProfile.parqValidUntil}.
              </p>
              <Badge variant="secondary" className="mt-3 bg-success/15 text-success border-success/30">
                Apto para entrenar
              </Badge>
              <Button variant="glass" className="w-full mt-4" asChild>
                <Link to="/par-q">Revisar cuestionario</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Aún no has completado el cuestionario de salud previo.
              </p>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/par-q">Completar PAR-Q</Link>
              </Button>
            </>
          )}
        </Card>

        <div className="lg:col-span-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variant="ghost" className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="hero" size="lg" className="w-full sm:w-auto">
            Guardar cambios
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  defaultValue,
  type = "text",
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <Input defaultValue={defaultValue} type={type} className="mt-1.5 bg-background/50" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/30 rounded-lg p-2 backdrop-blur-md border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
}
