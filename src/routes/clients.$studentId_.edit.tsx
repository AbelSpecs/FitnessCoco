import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/NotificationCenter";
import { ArrowLeft, Save, Shield, Flame, Trophy, FileText, UserCog } from "lucide-react";
import { getStudentById } from "@/services/student.service";
import { adjustStudentStreak, getStudentStreak } from "@/services/streak.service";
import { Goal, goalLabels } from "@/types/goals";
import { StudentStreakDto } from "@/dtos/streakDto";

export const Route = createFileRoute("/clientes/$studentId_/edit")({
  head: () => ({
    meta: [
      { title: "Panel del cliente — PyrosFit" },
      { name: "description", content: "Edita métricas y motivación del cliente." },
    ],
  }),
  beforeLoad: ({ location }) => {
    const auth = localStorage.getItem("pyrosfit_user");
    if (!auth) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  loader: async ({ params: { studentId } }) => {
    try {
      const [studentData, studentStreakData] = await Promise.all([
        getStudentById(Number(studentId)).catch((err) => {
          console.warn("Error al cargar estudiante:", err);
          return null;
        }),
        getStudentStreak(studentId).catch((err) => {
          console.warn("Error al cargar racha de estudiante:", err);
          return null as StudentStreakDto | null;
        }),
      ]);

      return {
        studentId,
        studentData,
        studentStreakData,
      };
    } catch (error) {
      console.error("Error en loader de edición de cliente:", error);
      return {
        studentId,
        studentData: null,
        studentStreakData: null as StudentStreakDto | null,
      };
    }
  },
  component: ClientEditPanelPage,
});

type ClientMetrics = {
  currentStreak: number;
  longestStreak: number;
  shields: number;
  reason: string;
};

function ClientEditPanelPage() {
  const { studentId, studentData, studentStreakData } = Route.useLoaderData();
  const navigate = useNavigate();

  const clientName = useMemo(() => {
    if (studentData?.user?.firstName) {
      return `${studentData.user.firstName} ${studentData.user.lastName || ""}`.trim();
    }
    return studentStreakData?.studentName || `Alumno #${studentId}`;
  }, [studentData, studentStreakData, studentId]);

  const clientGoal = useMemo(() => {
    if (studentData?.fitnessGoal && goalLabels[studentData.fitnessGoal as Goal]) {
      return goalLabels[studentData.fitnessGoal as Goal];
    }
    return "Entrenamiento personalizado";
  }, [studentData]);

  const [metrics, setMetrics] = useState<ClientMetrics>(() => ({
    currentStreak: studentStreakData?.currentStreak ?? 0,
    longestStreak: studentStreakData?.longestStreak ?? 0,
    shields: studentStreakData?.freezeShieldsAvailable ?? 0,
    reason: "",
  }));

  useEffect(() => {
    if (studentStreakData) {
      setMetrics((prev) => ({
        ...prev,
        currentStreak: studentStreakData.currentStreak ?? prev.currentStreak,
        longestStreak: studentStreakData.longestStreak ?? prev.longestStreak,
        shields: studentStreakData.freezeShieldsAvailable ?? prev.shields,
      }));
    }
  }, [studentStreakData]);

  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ClientMetrics>(key: K, value: ClientMetrics[K]) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!metrics.reason.trim()) {
      notify.warning("Razón requerida", "Debes ingresar el motivo o justificación del ajuste.");
      return;
    }

    try {
      setSaving(true);
      await adjustStudentStreak(studentId, {
        currentStreak: metrics.currentStreak,
        longestStreak: metrics.longestStreak,
        freezeShields: metrics.shields,
        reason: metrics.reason.trim(),
      });

      notify.success("Cliente actualizado", `Se guardaron los cambios de ${clientName}`);
      navigate({ to: "/clientes/$studentId", params: { studentId } });
    } catch (error) {
      console.error("Error al guardar ajuste de racha:", error);
      notify.error(
        "Error al guardar",
        "No se pudo guardar el ajuste de racha del alumno. Intenta nuevamente.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-60 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          to="/clientes/$studentId"
          params={{ studentId }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a rutinas
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-primary flex items-center justify-center font-display text-2xl text-primary-foreground shrink-0 shadow-glow">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary-glow mb-1">
                Panel de edición
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
                {clientName}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="uppercase text-[10px] tracking-widest">
                  Plan Activo
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">{clientGoal}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-card border border-border">
            <UserCog className="h-4 w-4 text-primary-glow" />
            <span className="text-xs font-medium">Coach / Admin</span>
          </div>
        </div>

        {/* Metrics form */}
        <Card className="bg-gradient-card border-border shadow-elevated p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <UserCog className="h-4 w-4 text-primary-glow" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl leading-none">Métricas del alumno</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ajusta rachas y escudos para gamificación.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mb-5">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary-glow" />
                Racha actual
              </Label>
              <Input
                type="number"
                min={0}
                value={metrics.currentStreak}
                onChange={(e) =>
                  update("currentStreak", Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="mt-2.5 bg-background/60 border-border focus-visible:ring-primary/40 text-lg font-display"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">Días consecutivos activos</p>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-4">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary-glow" />
                Racha máxima
              </Label>
              <Input
                type="number"
                min={0}
                value={metrics.longestStreak}
                onChange={(e) =>
                  update("longestStreak", Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className="mt-2.5 bg-background/60 border-border focus-visible:ring-primary/40 text-lg font-display"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">Mejor racha histórica</p>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-4">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary-glow" />
                Escudos
              </Label>
              <Input
                type="number"
                min={0}
                value={metrics.shields}
                onChange={(e) => update("shields", Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-2.5 bg-background/60 border-border focus-visible:ring-primary/40 text-lg font-display"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Escudos de hielo disponibles
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-4 mb-6">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary-glow" />
              Razón de ajuste <span className="text-destructive font-bold">*</span>
            </Label>
            <Textarea
              value={metrics.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="Escribe el motivo o justificación del ajuste..."
              rows={4}
              className="mt-2.5 bg-background/60 border-border focus-visible:ring-primary/40 resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Obligatorio. Quedará registrado en la auditoría de cambios del alumno.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              className="border-border cursor-pointer"
              onClick={() => navigate({ to: "/clientes/$studentId", params: { studentId } })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !metrics.reason.trim()}
              className="bg-gradient-primary hover:opacity-90 shadow-glow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" /> Guardar cambios
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <Card className="mt-5 bg-gradient-card border-border p-5">
          <h3 className="font-display text-lg mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary-glow" />
            Vista previa
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-background/40 border border-border p-3 text-center">
              <p className="font-display text-2xl text-primary">{metrics.currentStreak}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Racha actual
              </p>
            </div>
            <div className="rounded-xl bg-background/40 border border-border p-3 text-center">
              <p className="font-display text-2xl text-primary">{metrics.longestStreak}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Racha máxima
              </p>
            </div>
            <div className="rounded-xl bg-background/40 border border-border p-3 text-center">
              <p className="font-display text-2xl text-primary">{metrics.shields}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Escudos</p>
            </div>
          </div>
          {metrics.reason && (
            <div className="mt-4 rounded-lg bg-background/40 border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Razón
              </p>
              <p className="text-sm text-foreground leading-relaxed">{metrics.reason}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
