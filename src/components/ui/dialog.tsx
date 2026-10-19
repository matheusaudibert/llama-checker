import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Modal simples: só um fade curto ao abrir e fechar. */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  const duration = reduce ? 0 : 0.15;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog"
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: reduce ? 0 : 8 }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : 8 }}
            transition={{ duration }}
            className={cn(
              "relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground outline-none",
              className,
            )}
          >
            {/* Quem rola é esta área, recuada da borda: a barra fica dentro do card, longe dos cantos arredondados. */}
            <div className="my-2 mr-2 overflow-y-auto py-4 pr-4 pl-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 id={titleId} className="font-display text-xl leading-7 font-bold">
                    {title}
                  </h2>
                  {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.common.close}
                  className="-mt-1 -mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.07] hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
