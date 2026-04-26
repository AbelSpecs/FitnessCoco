import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { DayPlan } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { weekPlan, type Exercise } from "@/lib/mock-data";
import {
  ArrowLeft,
  History,
  PlayCircle,
  Clock,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/rutina/$dayId")({
  loader: ({ params }) => {
    const day = weekPlan.find((d) => d.id === params.dayId);
    if (!day) throw notFound();
    return { day };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.day.day} — Rutina` },
      { name: "description", content: `${loaderData?.day.focus} — ${loaderData?.day.day}` },
    ],
  }),
  component: DayDetail,
  notFoundComponent: () => (
    <AppShell>
      <p>Día no encontrado.</p>
    </AppShell>
  ),
});

function DayDetail() {
  const { day } = Route.useLoaderData() as { day: DayPlan };

  return (
    <AppShell>
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link to="/rutina">
          <ArrowLeft className="h-4 w-4" /> Volver a la semana
        </Link>
      </Button>

      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-hero border border-border p-5 sm:p-6 lg:p-10 mb-5 sm:mb-6">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />
        <div className="relative">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
            {day.day}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-none">
            {day.focus}
          </h1>
          {!day.rest && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-5 text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-glow" /> {day.durationMin} min
              </span>
              <span className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary-glow" /> ~{day.durationMin * 8} kcal
              </span>
              <Badge variant="secondary">{day.exercises.length} ejercicios</Badge>
            </div>
          )}
        </div>
      </div>

      {day.rest ? (
        <Card className="bg-gradient-card border-border p-12 text-center">
          <div className="text-7xl mb-4">🌿</div>
          <h2 className="font-display text-4xl mb-2">Descanso</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Recuperarse es parte del entrenamiento. Hidrátate, duerme bien y mueve el cuerpo
            con calma.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {day.exercises.map((ex, i) => (
            <ExerciseRow key={ex.id} ex={ex} index={i + 1} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ExerciseRow({ ex, index }: { ex: Exercise; index: number }) {
  const [done, setDone] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card className="bg-gradient-card border-border p-4 sm:p-5 lg:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-display text-lg sm:text-xl shrink-0 ${
            done
              ? "bg-success text-success-foreground"
              : "bg-gradient-primary text-primary-foreground"
          }`}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : index}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-1">
            <div className="min-w-0">
              <h3 className="font-display text-xl sm:text-2xl leading-tight break-words">
                {ex.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {ex.muscle} · {ex.sets} series × {ex.reps} · descanso {ex.restSec}s
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <HistoryDialog ex={ex} />
              <VideoDialog ex={ex} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 sm:mt-4">
            <Input
              placeholder="Peso (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              type="number"
              inputMode="decimal"
              className="bg-background/50"
            />
            <Input
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              type="number"
              inputMode="numeric"
              className="bg-background/50"
            />
            <Input
              placeholder="RPE 1-10"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              type="number"
              inputMode="numeric"
              className="bg-background/50"
            />
            <Button
              variant={done ? "secondary" : "hero"}
              onClick={() => setDone((d) => !d)}
              className="w-full"
            >
              {done ? "Completado" : "Marcar"}
            </Button>
          </div>

          <Textarea
            placeholder="Comentarios: sensación, asistencia, dolor, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 bg-background/50 min-h-[60px]"
          />
        </div>
      </div>
    </Card>
  );
}

function HistoryDialog({ ex }: { ex: Exercise }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="glass" size="icon" title="Historial">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl sm:text-3xl pr-8 break-words">
            Historial · {ex.name}
          </DialogTitle>
        </DialogHeader>
        <div className="h-56 sm:h-64 mt-2 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ex.history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.26 0.015 60)" vertical={false} />
              <XAxis dataKey="date" stroke="oklch(0.7 0.02 70)" fontSize={10} />
              <YAxis stroke="oklch(0.7 0.02 70)" fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.008 60)",
                  border: "1px solid oklch(0.26 0.015 60)",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="oklch(0.82 0.17 65)"
                strokeWidth={3}
                dot={{ fill: "oklch(0.72 0.19 50)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs mt-2">
          <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Mejor peso</p>
            <p className="font-display text-xl sm:text-2xl">
              {Math.max(...ex.history.map((h) => h.weight))} kg
            </p>
          </div>
          <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">RPE promedio</p>
            <p className="font-display text-xl sm:text-2xl">
              {(ex.history.reduce((s, h) => s + h.rpe, 0) / ex.history.length).toFixed(1)}
            </p>
          </div>
          <div className="bg-background/40 rounded-lg p-2.5 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Sesiones</p>
            <p className="font-display text-xl sm:text-2xl">{ex.history.length}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VideoDialog({ ex }: { ex: Exercise }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="glass" size="icon" title="Ver técnica">
          <PlayCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl sm:text-3xl pr-8 break-words">
            Técnica · {ex.name}
          </DialogTitle>
        </DialogHeader>
        <div className="aspect-video rounded-xl bg-gradient-hero border border-border flex flex-col items-center justify-center text-center p-4 sm:p-6">
          <PlayCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary-glow mb-3" />
          <p className="font-display text-xl sm:text-2xl">Vídeo demostración</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-sm">
            Aquí se mostrará el clip corto con la ejecución correcta del ejercicio (3-8s en
            loop).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
