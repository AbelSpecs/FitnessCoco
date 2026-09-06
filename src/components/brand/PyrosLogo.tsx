import React from "react";
import { cn } from "@/lib/utils";
import pyrosFlame from "@/assets/pyros-flame.png";
import pyrosSquare from "@/assets/pyros-square.png";
import pyrosCircle from "@/assets/pyros-circle.png";

export interface PyrosLogoProps {
  variant?: "icon" | "full" | "square" | "circle";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showSubtitle?: boolean;
}

const sizeConfig = {
  sm: { icon: "h-7 w-7", text: "text-lg", sub: "text-[9px]" },
  md: { icon: "h-10 w-10", text: "text-2xl", sub: "text-[10px]" },
  lg: { icon: "h-14 w-14", text: "text-3xl", sub: "text-xs" },
  xl: { icon: "h-20 w-20", text: "text-4xl", sub: "text-sm" },
};

export const PyrosLogo: React.FC<PyrosLogoProps> = ({
  variant = "full",
  size = "md",
  className,
  iconClassName,
  textClassName,
  showSubtitle = true,
}) => {
  const currentSize = sizeConfig[size] || sizeConfig.md;

  let imageSrc = pyrosFlame;
  if (variant === "square") imageSrc = pyrosSquare;
  if (variant === "circle") imageSrc = pyrosCircle;

  const iconElement = (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]",
        currentSize.icon,
        iconClassName,
      )}
    >
      <img
        src={imageSrc}
        alt="PyrosFit Logo"
        className="max-h-full max-w-full w-auto h-auto object-contain select-none mx-auto my-auto"
      />
    </div>
  );

  if (variant === "icon" || variant === "square" || variant === "circle") {
    return <div className={cn("inline-flex items-center justify-center", className)}>{iconElement}</div>;
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {iconElement}
      <div className={cn("min-w-0 flex flex-col", textClassName)}>
        <span className={cn("font-display leading-none tracking-wider text-foreground", currentSize.text)}>
          PYROSFIT
        </span>
        {showSubtitle && (
          <span
            className={cn(
              "text-muted-foreground uppercase tracking-[0.2em] font-medium mt-0.5",
              currentSize.sub,
            )}
          >
            by GeekSolutions
          </span>
        )}
      </div>
    </div>
  );
};

export default PyrosLogo;
