import React, { useState, useEffect, useMemo } from "react";
import { parseRestTimeToSeconds, formatRestTimeDisplay } from "@/utils/timeFormat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RestTimeInputProps {
  value: string | number;
  onChange: (totalSecondsStr: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
}

const PRESET_OPTIONS = [
  { label: "30 seg", seconds: 30, unit: "s" as const, display: "30" },
  { label: "45 seg", seconds: 45, unit: "s" as const, display: "45" },
  { label: "1 min (60s)", seconds: 60, unit: "min" as const, display: "1" },
  { label: "1:30 min (90s)", seconds: 90, unit: "min" as const, display: "1.5" },
  { label: "2 min (120s)", seconds: 120, unit: "min" as const, display: "2" },
  { label: "2:30 min (150s)", seconds: 150, unit: "min" as const, display: "2.5" },
  { label: "3 min (180s)", seconds: 180, unit: "min" as const, display: "3" },
  { label: "5 min (300s)", seconds: 300, unit: "min" as const, display: "5" },
];

export function RestTimeInput({
  value,
  onChange,
  disabled = false,
  className,
  compact = false,
  name,
  id,
  placeholder,
}: RestTimeInputProps) {
  const initialSeconds = useMemo(() => parseRestTimeToSeconds(value), [value]);

  // Si son múltiplos limpios de 60 segundos y >= 60, iniciamos en minutos por comodidad
  const [unit, setUnit] = useState<"s" | "min">(() => {
    if (initialSeconds >= 60 && initialSeconds % 60 === 0) {
      return "min";
    }
    return "s";
  });

  // Texto visual en el input
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value && value !== 0) return "";
    if (unit === "min") {
      const mins = initialSeconds / 60;
      return String(Number(mins.toFixed(2)));
    }
    return String(initialSeconds);
  });

  const [popoverOpen, setPopoverOpen] = useState(false);

  // Sincronizar input si `value` cambia externamente
  useEffect(() => {
    const sec = parseRestTimeToSeconds(value);
    if (!value && value !== 0 && value !== "0") {
      setInputValue("");
      return;
    }

    if (unit === "min") {
      const mins = sec / 60;
      setInputValue(String(Number(mins.toFixed(2))));
    } else {
      setInputValue(String(sec));
    }
  }, [value, unit]);

  // Cambio de texto manual por el usuario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputValue(rawVal);

    if (rawVal.trim() === "") {
      onChange("");
      return;
    }

    // Soporta escribir formato MM:SS directamente (ej: 1:30)
    if (rawVal.includes(":")) {
      const totalSec = parseRestTimeToSeconds(rawVal);
      onChange(String(totalSec));
      return;
    }

    const numeric = parseFloat(rawVal);
    if (isNaN(numeric) || numeric < 0) {
      return;
    }

    if (unit === "min") {
      const totalSec = Math.round(numeric * 60);
      onChange(String(totalSec));
    } else {
      onChange(String(Math.round(numeric)));
    }
  };

  // Alternar unidad entre Segundos y Minutos
  const handleUnitToggle = (newUnit: "s" | "min") => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    const currentSec = parseRestTimeToSeconds(value || (unit === "min" ? (parseFloat(inputValue) || 0) * 60 : inputValue));
    if (newUnit === "min") {
      const mins = currentSec / 60;
      setInputValue(currentSec > 0 ? String(Number(mins.toFixed(2))) : "");
    } else {
      setInputValue(currentSec > 0 ? String(currentSec) : "");
    }
  };

  // Seleccionar preset rápido
  const handleSelectPreset = (preset: typeof PRESET_OPTIONS[number]) => {
    setUnit(preset.unit);
    setInputValue(preset.display);
    onChange(String(preset.seconds));
    setPopoverOpen(false);
  };

  const currentSeconds = parseRestTimeToSeconds(value);
  const secondaryEquivalent = useMemo(() => {
    if (!currentSeconds || currentSeconds <= 0) return null;
    if (unit === "min") {
      return `${currentSeconds}s`;
    }
    const mins = currentSeconds / 60;
    return `${Number(mins.toFixed(1))} min`;
  }, [currentSeconds, unit]);

  return (
    <div className={cn("relative flex flex-col gap-1 w-full", className)}>
      <div className="relative flex items-center w-full">
        <Input
          id={id}
          name={name}
          type="number"
          step={unit === "min" ? "0.25" : "5"}
          min={0}
          max={unit === "min" ? 30 : 1800}
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            placeholder ?? (unit === "min" ? "Ej. 1.5" : "Ej. 90")
          }
          className={cn(
            "pr-20 bg-background/60 border-border focus-visible:ring-primary/40 text-foreground transition-all",
            compact ? "h-8 text-xs pl-2.5" : "h-9 sm:h-10 text-sm pl-3",
          )}
        />

        {/* Controles a la derecha del input: selector de unidad y menú de presets */}
        <div className="absolute right-1 flex items-center gap-0.5">
          {/* Selector de Unidad Segmentado (s / min) */}
          <div className="flex items-center rounded-md bg-muted/60 p-0.5 border border-border/40">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleUnitToggle("s")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase transition-all",
                unit === "s"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Medir en segundos"
            >
              s
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleUnitToggle("min")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase transition-all",
                unit === "min"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Medir en minutos"
            >
              min
            </button>
          </div>

          {/* Menú de selección rápida (Presets) */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                className={cn(
                  "hover:bg-primary/10 hover:text-primary-glow text-muted-foreground transition-colors",
                  compact ? "h-6 w-6" : "h-7 w-7",
                )}
                title="Elegir descanso sugerido"
              >
                <Clock className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-48 p-2 bg-popover/95 backdrop-blur-xl border-primary/30 shadow-elevated"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1 font-semibold">
                Descansos comunes
              </p>
              <div className="grid grid-cols-1 gap-0.5 mt-1">
                {PRESET_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => handleSelectPreset(opt)}
                    className={cn(
                      "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      currentSeconds === opt.seconds
                        ? "bg-primary/20 text-primary-glow font-medium"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-60">
                      {opt.unit === "min" ? `${opt.display}m` : `${opt.display}s`}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Leyenda sutil de equivalencia para que el usuario siempre sepa ambas medidas */}
      {secondaryEquivalent && (
        <span className="text-[10px] text-muted-foreground/80 px-1 truncate flex items-center gap-1">
          <span>Equivale a:</span>
          <strong className="text-primary-glow font-mono font-medium">
            {secondaryEquivalent}
          </strong>
        </span>
      )}
    </div>
  );
}
