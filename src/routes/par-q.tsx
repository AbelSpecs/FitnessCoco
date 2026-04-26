import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parqQuestions } from "@/lib/mock-data";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/par-q")({
  head: () => ({
    meta: [
      { title: "PAR-Q & YOU — Forja Training" },
      {
        name: "description",
        content:
          "Cuestionario de aptitud física previo al entrenamiento (PAR-Q & YOU).",
      },
    ],
  }),
  component: ParQ,
});

function ParQ() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(
    parqQuestions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");

  const anyYes = answers.some((a) => a === true);
  const allAnswered = answers.every((a) => a !== null);

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8 max-w-3xl">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-2">
          Salud previa
        </p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl">PAR-Q &amp; YOU</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-3">
          Cuestionario para personas de 15 a 69 años. La actividad física regular es saludable;
          este formulario te ayudará a saber si necesitas consultar a tu médico antes de
          comenzar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          {parqQuestions.map((q, i) => (
            <Card key={i} className="bg-gradient-card border-border p-5">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center font-display text-lg shrink-0 text-primary-foreground">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{q}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant={answers[i] === true ? "hero" : "glass"}
                      size="sm"
                      onClick={() => {
                        const next = [...answers];
                        next[i] = true;
                        setAnswers(next);
                      }}
                    >
                      Sí
                    </Button>
                    <Button
                      type="button"
                      variant={answers[i] === false ? "hero" : "glass"}
                      size="sm"
                      onClick={() => {
                        const next = [...answers];
                        next[i] = false;
                        setAnswers(next);
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Card className="bg-gradient-card border-border p-5">
            <h3 className="font-display text-2xl mb-3">Firma</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Nombre completo
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 bg-background/50"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Fecha
                </Label>
                <Input
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-1.5 bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              He leído, entendido y completado el cuestionario. Todas las preguntas fueron
              respondidas a mi entera satisfacción.
            </p>
          </Card>
        </div>

        {/* Result panel */}
        <Card
          className={`p-6 border lg:sticky lg:top-24 self-start ${
            submitted && anyYes
              ? "bg-warning/10 border-warning/40"
              : submitted
              ? "bg-success/10 border-success/40"
              : "bg-gradient-card border-border"
          }`}
        >
          {!submitted ? (
            <>
              <HeartPulse className="h-8 w-8 text-primary-glow mb-3" />
              <h3 className="font-display text-2xl mb-2">Resumen</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {answers.filter((a) => a !== null).length} de {parqQuestions.length} preguntas
                respondidas.
              </p>
              <Button
                variant="hero"
                className="w-full"
                size="lg"
                disabled={!allAnswered || !name}
                onClick={() => setSubmitted(true)}
              >
                Enviar cuestionario
              </Button>
              {(!allAnswered || !name) && (
                <p className="text-xs text-muted-foreground mt-3">
                  Completa todas las preguntas y firma para continuar.
                </p>
              )}
            </>
          ) : anyYes ? (
            <>
              <AlertTriangle className="h-8 w-8 text-warning mb-3" />
              <h3 className="font-display text-2xl mb-2">Consulta médica recomendada</h3>
              <p className="text-sm text-muted-foreground">
                Has respondido <strong>SÍ</strong> a una o más preguntas. Habla con tu médico
                ANTES de empezar a estar más activo físicamente y comenta qué preguntas
                respondiste afirmativamente.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-8 w-8 text-success mb-3" />
              <h3 className="font-display text-2xl mb-2">Apto para entrenar</h3>
              <p className="text-sm text-muted-foreground">
                Puedes comenzar a estar más activo de forma gradual. Tu cuestionario es válido
                por 12 meses.
              </p>
            </>
          )}
          <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed">
            Fuente: Canadian Society for Exercise Physiology — PAR-Q &amp; YOU. Si un cambio en
            tu salud te obliga a responder SÍ a alguna pregunta, infórmalo a tu entrenador.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
