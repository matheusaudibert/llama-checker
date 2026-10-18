import type { ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/motion/tooltip";

/**
 * Tooltip sem o atalho `content`: o atalho envolve o filho num <button> e,
 * com um botão como filho, gera botão dentro de botão.
 */
export function Hint({
  label,
  children,
  side = "top",
}: {
  label: ReactNode;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="bg-popover text-popover-foreground shadow-none">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
