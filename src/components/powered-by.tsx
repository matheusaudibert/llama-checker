import { ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Crédito "Desenvolvido por llamaapi", com link para a documentação da API. */
export function PoweredBy({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <a
      href="https://llamaapi.mintlify.site/guides/introduction"
      target="_blank"
      rel="noopener noreferrer"
      className={cn("flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      {t.login.poweredBy} <span className="text-[#B3ADD8]">llamaapi</span>
      <ArrowUpRight aria-hidden="true" className="size-3.5" />
    </a>
  );
}
