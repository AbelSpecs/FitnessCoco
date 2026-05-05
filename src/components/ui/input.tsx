import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const {
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      name,
      id,
      placeholder,
      disabled,
      required,
      autoComplete,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = props as any;

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        name={name}
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
