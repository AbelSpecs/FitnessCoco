import { useEffect, useRef, useState } from "react";
import { X, Pause, Play, RotateCcw } from "lucide-react";
interface RestTimerProps {
  seconds: number;
  label?: string;
  onClose: () => void;
}
export function RestTimer({ seconds, label, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const [pos, setPos] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 140 : 200,
    y: typeof window !== "undefined" ? window.innerHeight - 200 : 200,
  }));
  const dragRef = useRef<{ dx: number; dy: number; dragging: boolean; moved: boolean }>({
    dx: 0,
    dy: 0,
    dragging: false,
    moved: false,
  });
  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [paused, remaining]);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      dragRef.current.moved = true;
      const size = 120;
      const x = Math.min(Math.max(0, e.clientX - dragRef.current.dx), window.innerWidth - size);
      const y = Math.min(Math.max(0, e.clientY - dragRef.current.dy), window.innerHeight - size);
      setPos({ x, y });
    };
    const onUp = () => {
      dragRef.current.dragging = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);
  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const finished = remaining === 0;
  const size = 120;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  return (
    <div
      className="fixed z-[9999] touch-none select-none"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        dragRef.current = {
          dx: e.clientX - pos.x,
          dy: e.clientY - pos.y,
          dragging: true,
          moved: false,
        };
      }}
    >
      <div
        className={`relative rounded-full bg-gradient-card border border-primary/40 shadow-glow backdrop-blur-xl flex items-center justify-center cursor-grab active:cursor-grabbing ${
          finished ? "animate-pulse" : ""
        }`}
        style={{ width: size, height: size }}
      >
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
            fill="none"
            opacity={0.4}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: "stroke-dasharray 0.5s linear" }}
          />
        </svg>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!dragRef.current.moved) onClose();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition"
          aria-label="Cerrar"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="flex flex-col items-center pointer-events-none">
          {label && (
            <span className="text-[9px] uppercase tracking-widest text-primary-glow mb-0.5">
              {label}
            </span>
          )}
          <span className="font-display text-2xl leading-none">
            {mm}:{ss.toString().padStart(2, "0")}
          </span>
          <span className="text-[9px] text-muted-foreground mt-0.5">
            {finished ? "¡Listo!" : "Descanso"}
          </span>
        </div>
        <div className="absolute -bottom-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!dragRef.current.moved) {
                if (finished) {
                  setRemaining(seconds);
                  setPaused(false);
                } else {
                  setPaused((p) => !p);
                }
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-7 w-7 rounded-full bg-primary text-primary-foreground border border-primary/60 flex items-center justify-center shadow-glow"
            aria-label={finished ? "Reiniciar" : paused ? "Reanudar" : "Pausar"}
          >
            {finished ? (
              <RotateCcw className="h-3.5 w-3.5" />
            ) : paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
