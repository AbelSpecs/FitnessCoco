import { useMemo, useRef, useEffect } from "react";
import {
  addDays,
  addWeeks,
  startOfWeek,
  format,
  isSameDay,
  getWeek,
  differenceInCalendarWeeks,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface WeekSliderProps {
  value?: Date;
  onChange?: (date: Date) => void;
  weeksBefore?: number;
  weeksAfter?: number;
  className?: string;
}
const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
/**
 * Returns which week of the month a given date belongs to (1-based),
 * using Monday as the first day of the week.
 */
function getWeekOfMonth(date: Date) {
  const firstDay = startOfMonth(date);
  const firstWeekStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const currentWeekStart = startOfWeek(date, { weekStartsOn: 1 });
  return differenceInCalendarWeeks(currentWeekStart, firstWeekStart, { weekStartsOn: 1 }) + 1;
}
export function WeekSlider({
  value,
  onChange,
  weeksBefore = 8,
  weeksAfter = 8,
  className,
}: WeekSliderProps) {
  const today = useMemo(() => new Date(), []);
  const selected = value ?? today;
  const selectedWeekStart = useMemo(() => startOfWeek(selected, { weekStartsOn: 1 }), [selected]);
  const weeks = useMemo(() => {
    const baseWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    console.log(baseWeekStart);
    const list: Date[] = [];
    for (let i = -weeksBefore; i <= weeksAfter; i++) {
      list.push(addWeeks(baseWeekStart, i));
    }
    return list;
  }, [today, weeksBefore, weeksAfter]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(selectedWeekStart, i)),
    [selectedWeekStart],
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedBadgeRef = useRef<HTMLButtonElement>(null);
  // Center the selected badge on mount / when week changes.
  useEffect(() => {
    const node = selectedBadgeRef.current;
    const scroller = scrollerRef.current;
    if (!node || !scroller) return;
    const left = node.offsetLeft - scroller.clientWidth / 2 + node.clientWidth / 2;
    scroller.scrollTo({ left, behavior: "smooth" });
  }, [selectedWeekStart]);
  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };
  const selectWeek = (weekStart: Date) => {
    // Preserve the same weekday offset when changing weeks.
    const offset = (selected.getDay() + 6) % 7; // 0 = Monday
    console.log(weekStart);
    onChange?.(weekStart);
  };
  const monthLabel = format(selected, "LLLL yyyy", { locale: es });
  const weekOfMonth = getWeekOfMonth(selected);
  return (
    <Card className={cn("bg-gradient-card border-border p-4 sm:p-5", className)}>
      {/* <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <CalendarIcon className="h-4 w-4 text-primary-glow" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary-glow leading-tight">
              {monthLabel}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Semana {weekOfMonth} del mes · Semana {getWeek(selected, { weekStartsOn: 1 })} del año
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border/60"
            onClick={() => scrollBy(-200)}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border/60"
            onClick={() => scrollBy(200)}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div> */}
      <div
        ref={scrollerRef}
        className="flex justify-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {weeks.map((weekStart) => {
          const isSelected = isSameDay(weekStart, selectedWeekStart);
          const isCurrent = isSameDay(weekStart, startOfWeek(today, { weekStartsOn: 1 }));
          const weekEnd = addDays(weekStart, 6);
          const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
          const monthShort = sameMonth
            ? format(weekStart, "LLL", { locale: es })
            : `${format(weekStart, "LLL", { locale: es })}/${format(weekEnd, "LLL", { locale: es })}`;
          const wom = getWeekOfMonth(weekStart);
          return (
            <button
              key={weekStart.toISOString()}
              ref={isSelected ? selectedBadgeRef : undefined}
              type="button"
              onClick={() => selectWeek(weekStart)}
              className={cn(
                "snap-center shrink-0 flex flex-col items-center justify-center rounded-full h-16 w-16 border transition-all",
                "text-[10px] font-medium",
                isSelected
                  ? "bg-gradient-primary border-primary text-primary-foreground shadow-glow scale-105"
                  : "bg-background/40 border-border/60 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                !isSelected && isCurrent && "border-primary/60 text-primary-glow",
              )}
              aria-pressed={isSelected}
              aria-label={`Semana ${wom} de ${monthShort}`}
            >
              <span className="uppercase tracking-wider leading-none">{monthShort}</span>
              <span className="text-base font-display leading-tight mt-0.5">S{wom}</span>
              <span className="leading-none opacity-70">
                {format(weekStart, "d")}–{format(weekEnd, "d")}
              </span>
            </button>
          );
        })}
      </div>
      {/* <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onChange?.(day)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-2 border transition-all",
                isSelected
                  ? "bg-primary/15 border-primary text-foreground shadow-glow"
                  : "bg-background/30 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                !isSelected && isToday && "border-primary/50 text-primary-glow",
              )}
              aria-pressed={isSelected}
            >
              <span className="text-[10px] uppercase tracking-widest">{DAY_LABELS[i]}</span>
              <span className="font-display text-lg leading-tight">{format(day, "d")}</span>
              <span className="text-[9px] uppercase opacity-70">
                {format(day, "LLL", { locale: es })}
              </span>
            </button>
          );
        })}
      </div> */}
    </Card>
  );
}
export default WeekSlider;
