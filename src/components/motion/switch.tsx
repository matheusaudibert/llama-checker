"use client";
// beui.dev/components/motion/switch

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  ariaLabel,
  className,
}: SwitchProps) {
  const id = useId();

  return (
    // Visual do toggle da Epic: trilho 40x20 com borda, bolinha de 16px, sem animação; o hover vale também em cima do texto.
    <span className={cn("group inline-flex items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border p-px outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "justify-end border-primary bg-primary group-hover:bg-[#7cd6ff]"
            : "justify-start border-white/35 bg-white/5 group-hover:border-white/65",
        )}
      >
        <span
          className={cn(
            "pointer-events-none block size-4 rounded-full",
            checked ? "bg-black" : "bg-[#ababad] group-hover:bg-white",
          )}
        />
      </button>
      {label ? (
        <label htmlFor={id} className="cursor-pointer text-sm text-foreground">
          {label}
        </label>
      ) : null}
    </span>
  );
}
