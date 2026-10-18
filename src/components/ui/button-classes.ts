import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "md" | "sm" | "icon" | "icon-sm";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border border-input bg-foreground/5 text-foreground hover:bg-foreground/[0.09]",
  ghost: "text-foreground hover:bg-foreground/[0.07]",
  destructive: "bg-destructive text-white hover:bg-destructive/85",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-12 px-5 text-sm",
  sm: "h-10 px-4 text-sm",
  icon: "size-12 [&_svg]:size-5",
  "icon-sm": "size-10 [&_svg]:size-[18px]",
};

/** Classes do botão, para usar também em links (abrir página, baixar arquivo). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
