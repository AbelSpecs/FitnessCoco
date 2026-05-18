import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
const SIZE_MAP: Record<SpinnerSize, { box: string; ring: string; dot: string }> = {
  xs: { box: "h-4 w-4", ring: "border-2", dot: "h-1 w-1" },
  sm: { box: "h-6 w-6", ring: "border-2", dot: "h-1.5 w-1.5" },
  md: { box: "h-10 w-10", ring: "border-[3px]", dot: "h-2 w-2" },
  lg: { box: "h-16 w-16", ring: "border-4", dot: "h-2.5 w-2.5" },
  xl: { box: "h-24 w-24", ring: "border-[5px]", dot: "h-3 w-3" },
};
export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
  centered?: boolean;
}
export function Spinner({ size = "md", label, className, centered }: SpinnerProps) {
  const s = SIZE_MAP[size];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("flex items-center gap-3", centered && "justify-center w-full", className)}
    >
      <div className={cn("relative", s.box)}>
        {/* outer track */}
        <div className={cn("absolute inset-0 rounded-full border-border/40", s.ring)} />
        {/* spinning arc */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-transparent border-t-primary border-r-primary-glow animate-spin",
            s.ring,
          )}
          style={{ animationDuration: "0.9s" }}
        />
        {/* glow dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("rounded-full bg-gradient-primary shadow-glow", s.dot)} />
        </div>
      </div>
      {label && (
        <span className="text-sm text-muted-foreground tracking-wide uppercase font-display">
          {label}
        </span>
      )}
      <span className="sr-only">Cargando</span>
    </div>
  );
}
export function SpinnerInline({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        "inline-block h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin align-[-2px]",
        className,
      )}
      style={{ animationDuration: "0.8s" }}
    />
  );
}
export function SpinnerOverlay({
  label = "Cargando",
  blur = true,
}: {
  label?: string;
  blur?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="assertive"
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center bg-background/70",
        blur && "backdrop-blur-md",
        "animate-in fade-in duration-200",
      )}
    >
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-popover/90 px-8 py-7 shadow-elevated ring-1 ring-primary/20">
        <Spinner size="lg" />
        {label && (
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-display">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
export default Spinner;
