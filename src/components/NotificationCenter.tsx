import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Trash2, RefreshCw, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationKind =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "created"
  | "updated"
  | "deleted";
export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  duration?: number;
}
type Listener = (items: NotificationItem[]) => void;
const listeners = new Set<Listener>();
let items: NotificationItem[] = [];
function emit() {
  for (const l of listeners) l(items);
}
function push(n: Omit<NotificationItem, "id"> & { id?: string }) {
  const id = n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: NotificationItem = { duration: 4000, ...n, id };
  items = [item, ...items].slice(0, 6);
  emit();
  if (item.duration && item.duration > 0) {
    setTimeout(() => dismiss(id), item.duration);
  }
  return id;
}
function dismiss(id: string) {
  items = items.filter((i) => i.id !== id);
  emit();
}
export const notify = {
  show: (kind: NotificationKind, title: string, description?: string, duration?: number) =>
    push({ kind, title, description, duration }),
  success: (title: string, description?: string) => push({ kind: "success", title, description }),
  error: (title: string, description?: string) =>
    push({ kind: "error", title, description, duration: 6000 }),
  info: (title: string, description?: string) => push({ kind: "info", title, description }),
  warning: (title: string, description?: string) => push({ kind: "warning", title, description }),
  created: (title = "Registro creado", description?: string) =>
    push({ kind: "created", title, description }),
  updated: (title = "Registro actualizado", description?: string) =>
    push({ kind: "updated", title, description }),
  deleted: (title = "Registro eliminado", description?: string) =>
    push({ kind: "deleted", title, description }),
  dismiss,
};
const KIND_META: Record<
  NotificationKind,
  { icon: typeof CheckCircle2; ring: string; iconColor: string; label: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: "ring-success/40",
    iconColor: "text-success",
    label: "Éxito",
  },
  created: { icon: Plus, ring: "ring-primary/40", iconColor: "text-primary-glow", label: "Creado" },
  updated: {
    icon: RefreshCw,
    ring: "ring-primary/40",
    iconColor: "text-primary-glow",
    label: "Actualizado",
  },
  deleted: {
    icon: Trash2,
    ring: "ring-destructive/40",
    iconColor: "text-destructive",
    label: "Eliminado",
  },
  error: {
    icon: AlertTriangle,
    ring: "ring-destructive/40",
    iconColor: "text-destructive",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    ring: "ring-warning/40",
    iconColor: "text-warning",
    label: "Aviso",
  },
  info: { icon: Info, ring: "ring-primary/30", iconColor: "text-primary-glow", label: "Info" },
};
export function NotificationCenter() {
  const [list, setList] = useState<NotificationItem[]>(items);
  useEffect(() => {
    const l: Listener = (next) => setList([...next]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  if (list.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-label="Notificaciones"
      className="fixed z-[100] top-8 right-4 sm:top-6 sm:right-6 flex flex-col gap-3 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
    >
      {list.map((n) => {
        const meta = KIND_META[n.kind];
        const Icon = meta.icon;
        return (
          <div
            key={n.id}
            role="status"
            className={cn(
              "pointer-events-auto group relative overflow-hidden rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-elevated ring-1",
              meta.ring,
              "animate-in slide-in-from-right-4 fade-in duration-300",
            )}
          >
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-primary" />
            <div className="flex items-start gap-3 p-4 pl-5">
              <div
                className={cn(
                  "h-9 w-9 shrink-0 rounded-lg bg-card border border-border flex items-center justify-center",
                  meta.iconColor,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {meta.label}
                </p>
                <p className="font-display text-lg leading-tight text-foreground truncate">
                  {n.title}
                </p>
                {n.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{n.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Cerrar notificación"
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
