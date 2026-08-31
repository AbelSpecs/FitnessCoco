import { useEffect, useRef, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import StorageImage from "@/components/StorageImage";

interface ProfileMenuProps {
  initial: string;
  size?: "sm" | "md";
  align?: "left" | "right";
}

export function ProfileMenu({ initial, size = "md", align = "right" }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate({ to: "/login" });
  };

  const avatarSize = size === "sm" ? "h-9 w-9 text-base" : "h-10 w-10 text-lg";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de perfil"
        className={cn(
          "rounded-full bg-card/80 backdrop-blur-md border border-border/60 flex items-center justify-center font-display shrink-0 ring-offset-2 ring-offset-background transition-all hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-primary overflow-hidden",
          avatarSize,
        )}
      >
        {user?.profilePicture || user?.profilePictureKey ? (
          <StorageImage
            src={user?.profilePictureUrl}
            storageKey={user?.profilePictureKey || user?.profilePicture}
            alt={user?.firstName || "Avatar"}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full flex items-center justify-center bg-transparent"
            fallback={
              <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-glow">
                {initial}
              </div>
            }
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-glow">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute lg:top-auto lg:bottom-full lg:mb-2 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-elevated overflow-hidden animate-in fade-in lg:slide-in-from-bottom-2 slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="px-4 py-3 bg-gradient-card border-b border-border">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Sesión activa
            </p>
            <p className="text-sm font-medium truncate">{user?.firstName}</p>
          </div>
          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg text-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
