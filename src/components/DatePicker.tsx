import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
type Mode = "single" | "range" | "multiple";
type ValueByMode = {
  single: Date | undefined;
  range: DateRange | undefined;
  multiple: Date[] | undefined;
};
export type DatePickerProps<M extends Mode = "single"> = {
  /** Selection mode */
  mode?: M;
  /** Controlled value */
  value?: ValueByMode[M];
  /** Default value (uncontrolled) */
  defaultValue?: ValueByMode[M];
  /** Change handler */
  onChange?: (value: ValueByMode[M]) => void;
  /** Trigger label when nothing selected */
  placeholder?: string;
  /** Date format passed to date-fns/format. Defaults vary by mode. */
  dateFormat?: string;
  /** Locale for formatting & calendar (defaults to Spanish) */
  locale?: typeof es;
  /** Disable specific dates */
  disabled?: React.ComponentProps<typeof DayPicker>["disabled"];
  /** Show two months side by side */
  numberOfMonths?: number;
  /** Allow clearing the selection */
  clearable?: boolean;
  /** Disable the trigger entirely */
  triggerDisabled?: boolean;
  /** Trigger button variant */
  variant?: "outline" | "ghost" | "secondary" | "default";
  /** Size of the trigger */
  size?: "sm" | "default" | "lg";
  /** Extra className for the trigger button */
  className?: string;
  /** Extra className for the popover content */
  popoverClassName?: string;
  /** Extra className for the calendar itself */
  calendarClassName?: string;
  /** Align of popover */
  align?: "start" | "center" | "end";
  /** Hide the leading icon */
  hideIcon?: boolean;
  startMonth?: Date;
  endMonth?: Date;
  /** Custom render of the displayed label */
  renderLabel?: (value: ValueByMode[M]) => React.ReactNode;
};
function isRange(v: unknown): v is DateRange {
  return !!v && typeof v === "object" && ("from" in (v as object) || "to" in (v as object));
}
function defaultLabel<M extends Mode>(
  mode: M,
  value: ValueByMode[M],
  fmt: string,
  locale: typeof es,
): string | null {
  if (mode === "single") {
    const d = value as Date | undefined;
    return d ? format(d, fmt, { locale }) : null;
  }
  if (mode === "range") {
    const r = value as DateRange | undefined;
    if (!r?.from) return null;
    if (!r.to) return format(r.from, fmt, { locale });
    return `${format(r.from, fmt, { locale })} — ${format(r.to, fmt, { locale })}`;
  }
  const arr = value as Date[] | undefined;
  if (!arr || arr.length === 0) return null;
  if (arr.length === 1) return format(arr[0], fmt, { locale });
  return `${arr.length} fechas seleccionadas`;
}
export function DatePicker<M extends Mode = "single">({
  mode = "single" as M,
  value,
  defaultValue,
  onChange,
  placeholder = "Selecciona una fecha",
  dateFormat,
  locale = es,
  disabled,
  numberOfMonths = 1,
  clearable = true,
  triggerDisabled = false,
  variant = "outline",
  size = "default",
  className,
  popoverClassName,
  calendarClassName,
  align = "start",
  hideIcon = false,
  startMonth,
  endMonth,
  renderLabel,
}: DatePickerProps<M>) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<ValueByMode[M] | undefined>(defaultValue);
  const current = (isControlled ? value : internal) as ValueByMode[M];
  const fmt = dateFormat ?? (mode === "range" ? "d MMM yyyy" : "PPP");
  const handleChange = (next: ValueByMode[M]) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };
  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleChange(undefined as ValueByMode[M]);
  };
  const label = renderLabel ? renderLabel(current) : defaultLabel(mode, current, fmt, locale);
  const hasValue =
    mode === "single"
      ? !!current
      : mode === "range"
        ? !!(current as DateRange | undefined)?.from
        : !!(current as Date[] | undefined)?.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={triggerDisabled}
          className={cn(
            "justify-start text-left font-normal min-w-[200px]",
            "bg-background/60 border-border hover:bg-background/80 hover:border-primary/40 hover:text-white",
            "transition-colors",
            !hasValue && "text-muted-foreground",
            className,
          )}
        >
          {!hideIcon && <CalendarIcon className="mr-2 h-4 w-4 text-primary-glow" />}
          <span className="flex-1 truncate">{label ?? placeholder}</span>
          {clearable && hasValue && (
            <span
              role="button"
              aria-label="Limpiar fecha"
              onClick={clear}
              className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-auto p-0 border-border bg-popover/95 backdrop-blur-xl shadow-elevated",
          popoverClassName,
        )}
      >
        {mode === "single" && (
          <Calendar
            mode="single"
            locale={locale}
            selected={current as Date | undefined}
            onSelect={(d) => handleChange(d as ValueByMode[M])}
            disabled={disabled}
            numberOfMonths={numberOfMonths}
            initialFocus
            className={cn("p-3 pointer-events-auto", calendarClassName)}
            captionLayout={startMonth && "dropdown"}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            locale={locale}
            selected={current as DateRange | undefined}
            onSelect={(r) => handleChange(r as ValueByMode[M])}
            disabled={disabled}
            numberOfMonths={numberOfMonths}
            initialFocus
            className={cn("p-3 pointer-events-auto", calendarClassName)}
            captionLayout={startMonth && "dropdown"}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            locale={locale}
            selected={current as Date[] | undefined}
            onSelect={(d) => handleChange(d as ValueByMode[M])}
            disabled={disabled}
            numberOfMonths={numberOfMonths}
            initialFocus
            className={cn("p-3 pointer-events-auto", calendarClassName)}
            captionLayout={startMonth && "dropdown"}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
export default DatePicker;
