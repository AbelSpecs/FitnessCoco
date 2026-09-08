import React, { useMemo, useState } from "react";
import { Student } from "@/types/user";
import {
  calculateBMI,
  formatActivityLevel,
  formatClinicalText,
  formatFitnessExperience,
  formatMetric,
} from "@/utils/studentMetricsFormatters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  Ruler,
  Percent,
  ChevronDown,
  AlertTriangle,
  HeartPulse,
  FileText,
  Activity,
  Dumbbell,
  ShieldAlert,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentClinicalOverviewProps {
  student?: Student | null;
  className?: string;
  defaultOpen?: boolean;
}

export const StudentClinicalOverview: React.FC<StudentClinicalOverviewProps> = ({
  student,
  className,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Cálculos y formateos memoizados para evitar re-renders innecesarios
  const weight = useMemo(() => formatMetric(student?.weight, "kg"), [student?.weight]);
  const height = useMemo(() => formatMetric(student?.height, "cm"), [student?.height]);
  const bodyFat = useMemo(
    () => formatMetric(student?.bodyFatPercentage, "%"),
    [student?.bodyFatPercentage],
  );
  const bmiData = useMemo(
    () => calculateBMI(student?.weight, student?.height),
    [student?.weight, student?.height],
  );

  const activityData = useMemo(
    () => formatActivityLevel(student?.activityLevel),
    [student?.activityLevel],
  );
  const experienceData = useMemo(
    () => formatFitnessExperience(student?.fitnessExperience),
    [student?.fitnessExperience],
  );

  const medicalConditions = useMemo(
    () => formatClinicalText(student?.medicalConditions, "Ninguna"),
    [student?.medicalConditions],
  );
  const allergies = useMemo(
    () => formatClinicalText(student?.allergies, "Ninguna"),
    [student?.allergies],
  );
  const generalNotes = useMemo(
    () => formatClinicalText(student?.generalNotes, "Sin observaciones adicionales"),
    [student?.generalNotes],
  );

  // Detección de banderas rojas clínicas para alerta preventiva en el entrenador
  const hasHealthAlert = medicalConditions.hasValue || allergies.hasValue;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-gradient-card shadow-card overflow-hidden transition-all duration-300",
        hasHealthAlert && "border-amber-500/30",
        className,
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Cabecera / Trigger colapsable interactivo */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer group select-none"
            aria-expanded={isOpen}
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap min-w-0">
              <div
                className={cn(
                  "p-2 rounded-xl border flex items-center justify-center shrink-0 transition-colors",
                  hasHealthAlert
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-primary/10 border-primary/20 text-primary-glow",
                )}
              >
                {hasHealthAlert ? (
                  <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-primary-glow">
                    Ficha del Cliente
                  </span>
                  {hasHealthAlert && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] font-medium py-0 px-2 flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Atención clínica
                    </Badge>
                  )}
                </div>
                <h3 className="font-display text-sm sm:text-base font-semibold text-foreground tracking-tight">
                  Datos Antropométricos y Clínicos
                </h3>
              </div>
            </div>

            {/* Micro-resumen en estado colapsado para máxima ergonomía */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {!isOpen && (
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <strong
                      className={
                        weight.hasValue ? "text-foreground" : "text-muted-foreground/60 font-normal"
                      }
                    >
                      {weight.formatted}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <strong
                      className={
                        height.hasValue ? "text-foreground" : "text-muted-foreground/60 font-normal"
                      }
                    >
                      {height.formatted}
                    </strong>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground/80" />
                    <strong
                      className={
                        bodyFat.hasValue
                          ? "text-foreground"
                          : "text-muted-foreground/60 font-normal"
                      }
                    >
                      {bodyFat.formatted}
                    </strong>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                <span className="hidden sm:inline">
                  {isOpen ? "Ocultar detalles" : "Ver detalles"}
                </span>
                <div className="p-1 rounded-lg bg-secondary/50 border border-border/60">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-180 text-primary-glow",
                    )}
                  />
                </div>
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Contenido expandible detallado */}
        <CollapsibleContent className="animate-in fade-in-50 duration-200">
          <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3">
              {/* Tarjeta 1: Antropometría (AC1) */}
              <div className="rounded-xl border border-border/70 bg-card/40 p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-sky-400" />
                      Antropometría
                    </span>
                    {bmiData && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] tracking-wide font-medium py-0 px-1.5",
                          bmiData.variant === "success" &&
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
                          bmiData.variant === "warning" &&
                            "border-amber-500/40 bg-amber-500/10 text-amber-300",
                          bmiData.variant === "destructive" &&
                            "border-rose-500/40 bg-rose-500/10 text-rose-300",
                        )}
                      >
                        IMC {bmiData.bmi} · {bmiData.category}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* Peso */}
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        Peso
                      </span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold",
                          weight.hasValue
                            ? "text-foreground font-display"
                            : "text-muted-foreground/60 italic font-normal text-[11px]",
                        )}
                      >
                        {weight.formatted}
                      </span>
                    </div>

                    {/* Altura */}
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        Altura
                      </span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold",
                          height.hasValue
                            ? "text-foreground font-display"
                            : "text-muted-foreground/60 italic font-normal text-[11px]",
                        )}
                      >
                        {height.formatted}
                      </span>
                    </div>

                    {/* % Grasa */}
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                        Grasa
                      </span>
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold",
                          bodyFat.hasValue
                            ? "text-foreground font-display"
                            : "text-muted-foreground/60 italic font-normal text-[11px]",
                        )}
                      >
                        {bodyFat.formatted}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30 flex items-center gap-1">
                  <Info className="h-3 w-3 shrink-0" />
                  Métricas para calibración de volumen y sobrecarga.
                </p>
              </div>

              {/* Tarjeta 2: Estilo de Vida y Fitness (AC2) */}
              <div className="rounded-xl border border-border/70 bg-card/40 p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Activity className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Estilo de Vida & Fitness
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Nivel de actividad */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                        Nivel de Actividad
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-medium py-0.5 px-2",
                            activityData.hasValue
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground/60 bg-secondary/40 font-normal italic",
                          )}
                        >
                          {activityData.label}
                        </Badge>
                        {activityData.detail && (
                          <span className="text-[11px] text-muted-foreground">
                            ({activityData.detail})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Experiencia en Fitness */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                        Experiencia en Entrenamiento
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-medium py-0.5 px-2 flex items-center gap-1",
                            experienceData.hasValue
                              ? "bg-primary/15 text-primary-glow border border-primary/20"
                              : "text-muted-foreground/60 bg-secondary/40 font-normal italic",
                          )}
                        >
                          <Dumbbell className="h-3 w-3" />
                          {experienceData.label}
                        </Badge>
                        {experienceData.detail && (
                          <span className="text-[11px] text-muted-foreground">
                            ({experienceData.detail})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30">
                  Referencia de progresión técnica y adaptación neuromuscular.
                </p>
              </div>

              {/* Tarjeta 3: Salud y Antecedentes (AC3) */}
              <div
                className={cn(
                  "rounded-xl border bg-card/40 p-4 flex flex-col justify-between transition-colors",
                  hasHealthAlert
                    ? "border-amber-500/40 bg-amber-500/[0.02]"
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-3">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                      <HeartPulse
                        className={cn(
                          "h-3.5 w-3.5",
                          hasHealthAlert ? "text-amber-400" : "text-rose-400",
                        )}
                      />
                      Salud & Antecedentes
                    </span>
                    {hasHealthAlert && (
                      <span className="text-[10px] text-amber-400/90 font-medium">Preventivo</span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* Condiciones Médicas */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                        Condiciones Médicas
                      </span>
                      {medicalConditions.hasValue ? (
                        <p className="text-foreground font-medium bg-background/50 border border-border/50 rounded-md p-1.5 text-[11px]">
                          {medicalConditions.text}
                        </p>
                      ) : (
                        <p className="text-muted-foreground/60 italic text-[11px]">
                          {medicalConditions.text}
                        </p>
                      )}
                    </div>

                    {/* Alergias */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                        Alergias
                      </span>
                      {allergies.hasValue ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {allergies.items.map((item, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="border-rose-500/40 bg-rose-500/10 text-rose-300 text-[10px] py-0 px-1.5"
                            >
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground/60 italic text-[11px]">
                          {allergies.text}
                        </p>
                      )}
                    </div>

                    {/* Notas Generales */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground/80" />
                        Notas Generales
                      </span>
                      <p
                        className={cn(
                          "text-[11px] line-clamp-2",
                          generalNotes.hasValue
                            ? "text-foreground/90 font-normal"
                            : "text-muted-foreground/60 italic",
                        )}
                        title={generalNotes.text}
                      >
                        {generalNotes.text}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30">
                  Antecedentes clínicos a considerar antes de cargar peso.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
