import { Languages } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Hint } from "@/components/ui/hint";
import type { Language } from "@/lib/api";
import { I18nContext, LANG_KEY, makeI18n, useI18n } from "@/lib/i18n";
import { readJSON, writeJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";

function initialLang(): Language {
  const saved = readJSON<Language>(LANG_KEY);
  if (saved === "pt-BR" || saved === "en") return saved;
  return "pt-BR";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(initialLang);
  const value = useMemo(() => makeI18n(lang, setLang), [lang]);
  useEffect(() => {
    document.documentElement.lang = lang;
    writeJSON(LANG_KEY, lang);
  }, [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const OPTIONS: { value: Language; short: string; label: string }[] = [
  { value: "pt-BR", short: "PT", label: "Português (Brasil)" },
  { value: "en", short: "EN", label: "English" },
];

/** Troca de idioma: dois botões lado a lado, o ativo destacado. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div role="group" aria-label={t.common.language} className={cn("flex items-center gap-0.5", className)}>
      <Languages aria-hidden="true" className="mr-1 hidden size-[18px] text-muted-foreground sm:block" />
      {OPTIONS.map((option) => (
        <Hint key={option.value} label={option.label} side="bottom">
          <button
            type="button"
            lang={option.value}
            aria-label={option.label}
            aria-pressed={lang === option.value}
            onClick={() => setLang(option.value)}
            className={cn(
              "inline-flex h-8 items-center rounded-lg px-2 text-xs font-semibold tracking-wide transition-colors",
              lang === option.value ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.short}
          </button>
        </Hint>
      ))}
    </div>
  );
}
