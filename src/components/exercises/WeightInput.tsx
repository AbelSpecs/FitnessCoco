import React, { useState, useEffect, useMemo } from "react";
import { kgToLbs, lbsToKg, parseWeightToKg } from "@/utils/weightFormat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dumbbell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeightInputProps {
  value: string | number;
  onChange: (kgValueStr: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
}

const PRESET_WEIGHTS = [
  { label: "5 kg", kg: 5, lbs: 11 },
  { label: "10 kg", kg: 10, lbs: 22 },
  { label: "15 kg", kg: 15, lbs: 33 },
  { label: "20 kg", kg: 20, lbs: 44.1 },
  { label: "25 kg", kg: 25, lbs: 55.1 },
  { label: "30 kg", kg: 30, lbs: 66.1 },
  { label: "40 kg", kg: 40, lbs: 88.2 },
  { label: "50 kg", kg: 50, lbs: 110.2 },
  { label: "60 kg", kg: 60, lbs: 132.3 },
  { label: "80 kg", kg: 80, lbs: 176.4 },
  { label: "100 kg", kg: 100, lbs: 220.5 },
];

export function WeightInput({
  value,
  onChange,
  disabled = false,
  className,
  compact = false,
  name,
  id,
  placeholder,
}: WeightInputProps) {
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");

  const initialKg = useMemo(() => {
    if (!value && value !== 0 && value !== "0") return 0;
    const n = typeof value === "number" ? value : parseFloat(String(value));
    return isNaN(n) ? 0 : n;
  }, [value]);

  // Texto visual en el input
  const [inputValue, setInputValue] = useState<string>(() => {
    if (!value && value !== 0 && value !== "0") return "";
    return String(initialKg);
  });

  const [popoverOpen, setPopoverOpen] = useState(false);

  // Sincronizar input si `value` cambia externamente
  useEffect(() => {
    if (!value && value !== 0 && value !== "0") {
      setInputValue("");
      return;
    }

    const currentKg = typeof value === "number" ? value : parseFloat(String(value)) || 0;
    if (unit === "lbs") {
      setInputValue(currentKg > 0 ? String(kgToLbs(currentKg)) : "");
    } else {
      setInputValue(currentKg > 0 ? String(currentKg) : "");
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

    const numeric = parseFloat(rawVal);
    if (isNaN(numeric) || numeric < 0) {
      return;
    }

    if (unit === "lbs") {
      const convertedKg = lbsToKg(numeric);
      onChange(String(convertedKg));
    } else {
      onChange(String(numeric));
    }
  };

  // Alternar unidad entre Kilos y Libras
  const handleUnitToggle = (newUnit: "kg" | "lbs") => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    const currentNumeric = parseFloat(inputValue) || 0;
    if (currentNumeric <= 0) {
      setInputValue("");
      return;
    }

    if (newUnit === "lbs") {
      // De kg a lbs
      const inLbs = kgToLbs(currentNumeric);
      setInputValue(String(inLbs));
    } else {
      // De lbs a kg
      const inKg = lbsToKg(currentNumeric);
      setInputValue(String(inKg));
    }
  };

  // Seleccionar preset rápido
  const handleSelectPreset = (preset: typeof PRESET_WEIGHTS[number]) => {
    if (unit === "lbs") {
      setInputValue(String(preset.lbs));
      onChange(String(preset.kg));
    } else {
      setInputValue(String(preset.kg));
      onChange(String(preset.kg));
    }
    setPopoverOpen(false);
  };

  const currentKg = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const secondaryEquivalent = useMemo(() => {
    if (!currentKg || currentKg <= 0) return null;
    if (unit === "kg") {
      return `${kgToLbs(currentKg)} lbs`;
    }
    return `${currentKg} kg`;
  }, [currentKg, unit]);

  return (
    <div className={cn("relative flex flex-col gap-1 w-full", className)}>
      <div className="relative flex items-center w-full">
        <Input
          id={id}
          name={name}
          type="number"
          step={unit === "lbs" ? "0.5" : "0.5"}
          min={0}
          max={unit === "lbs" ? 1200 : 600}
          disabled={disabled}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            placeholder ?? (unit === "lbs" ? "Ej. 45" : "Ej. 20")
          }
          className={cn(
            "pr-22 bg-background/60 border-border focus-visible:ring-primary/40 text-foreground transition-all",
            compact ? "h-8 text-xs pl-2.5" : "h-9 sm:h-10 text-sm pl-3",
          )}
        />

        {/* Controles a la derecha del input: selector de unidad y menú de presets */}
        <div className="absolute right-1 flex items-center gap-0.5">
          {/* Selector de Unidad Segmentado (kg / lbs) */}
          <div className="flex items-center rounded-md bg-muted/60 p-0.5 border border-border/40">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleUnitToggle("kg")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase transition-all",
                unit === "kg"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Medir en kilogramos"
            >
              kg
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleUnitToggle("lbs")}
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase transition-all",
                unit === "lbs"
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Medir en libras"
            >
              lbs
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
                title="Elegir peso sugerido"
              >
                <Dumbbell className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-48 p-2 bg-popover/95 backdrop-blur-xl border-primary/30 shadow-elevated"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1 font-semibold">
                Pesos comunes
              </p>
              <div className="grid grid-cols-1 gap-0.5 mt-1 max-h-48 overflow-y-auto">
                {PRESET_WEIGHTS.map((opt) => (
                  <button
                    key={opt.kg}
                    type="button"
                    onClick={() => handleSelectPreset(opt)}
                    className={cn(
                      "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-colors text-left",
                      currentKg === opt.kg
                        ? "bg-primary/20 text-primary-glow font-medium"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-60">
                      {opt.lbs} lbs
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Leyenda de equivalencia en vivo */}
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
