import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { useCopy } from "@/hooks/use-copy";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Título da página, como "Configurações" na página de conta da Epic. */
export function PageHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <header>
      <h1 className="font-display text-[32px] leading-10 font-bold tracking-normal sm:text-[40px] sm:leading-[50px]">
        {title}
      </h1>
      {description ? <p className="mt-2 text-base leading-[22px] text-muted-foreground">{description}</p> : null}
    </header>
  );
}

/** Bloco de seção: título, descrição curta e conteúdo. Separados por uma linha. */
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-border pt-12 first:border-t-0 first:pt-0", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl leading-[30px] font-bold tracking-normal">{title}</h2>
          {description ? <p className="mt-2 text-base leading-[22px] text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

/** Conteúdo da página: seções empilhadas com o respiro da Epic. */
export function Sections({ children }: { children: ReactNode }) {
  return <div className="mt-12 flex flex-col gap-12 sm:mt-16">{children}</div>;
}

export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2", className)}>{children}</div>;
}

/**
 * Campo somente leitura no estilo da Epic: label pequena em cima, "caixa" com
 * borda e, opcionalmente, ícones dentro e botões de ação ao lado.
 */
export function Field({
  label,
  children,
  trailing,
  actions,
  className,
  mono,
}: {
  label: ReactNode;
  children: ReactNode;
  /** Ícones dentro da caixa, à direita. */
  trailing?: ReactNode;
  /** Botões 48×48 ao lado da caixa. */
  actions?: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-2 text-xs leading-[17px] text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-input bg-foreground/5 pr-2 pl-3.5">
          <div className={cn("flex min-w-0 flex-1 items-center gap-2 truncate text-sm", mono && "font-mono text-[13px]")}>
            {children}
          </div>
          {trailing}
        </div>
        {actions}
      </div>
    </div>
  );
}

/** Ícone clicável dentro da caixa do campo. */
export function FieldIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Hint label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-foreground/[0.07] hover:text-foreground [&_svg]:size-5"
      >
        {children}
      </button>
    </Hint>
  );
}

/** Botão de ação ao lado do campo, no lugar do "editar" da Epic. */
export function CopyAction({ value, label }: { value: string; label?: string }) {
  const { t } = useI18n();
  const { copied, copy } = useCopy();
  label ??= t.common.copy;
  return (
    <Hint label={copied ? t.common.copied : label}>
      <Button size="icon" aria-label={label} onClick={() => copy(value)}>
        {copied ? <Check /> : <Copy />}
      </Button>
    </Hint>
  );
}

/** Linha de status com bolinha, para sim/não. */
export function Status({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 shrink-0 rounded-full", ok ? "bg-emerald-500" : "bg-foreground/30")} />
      {children}
    </span>
  );
}

/** Tabela simples no estilo da página (lista de temporadas, conexões). */
export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: { key: string; label: ReactNode; align?: "left" | "right" }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  empty?: ReactNode;
}) {
  const { t } = useI18n();
  if (rows.length === 0) {
    return (
      <div className="rounded-[10px] border border-input px-4 py-6 text-center text-sm text-muted-foreground">
        {empty ?? t.common.nothing}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[10px] border border-input">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="bg-foreground/5 text-left text-xs text-muted-foreground">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 font-medium", col.align === "right" && "text-right")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 tabular-nums", col.align === "right" && "text-right")}>
                  {row.cells[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
