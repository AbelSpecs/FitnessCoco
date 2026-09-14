import { AlertTriangle, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDisclaimerCardProps {
  className?: string;
  compact?: boolean;
}

export function MedicalDisclaimerCard({ className, compact = false }: MedicalDisclaimerCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-left shadow-sm transition-all relative overflow-hidden",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-amber-400 text-sm tracking-wide">
              1.3 Exención de Responsabilidad Médica
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Importante
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">No somos profesionales médicos:</strong> El
              contenido, rutinas y herramientas de PYROSFIT tienen fines informativos y
              motivacionales. No constituyen asesoramiento médico, diagnóstico o tratamiento.
            </p>
            {!compact && (
              <>
                <p>
                  <strong className="text-foreground">Consulta previa:</strong> Debes consultar a un
                  médico antes de iniciar programas de entrenamiento o cambios en tu dieta,
                  especialmente si tienes condiciones preexistentes.
                </p>
                <p>
                  <strong className="text-foreground">Riesgo del usuario:</strong> La práctica de
                  las rutinas se realiza bajo tu propia cuenta y riesgo. PYROSFIT no asume
                  responsabilidad por lesiones derivadas de los ejercicios.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
