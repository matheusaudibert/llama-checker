import { createContext, useContext } from "react";
import { ApiError, type Language } from "@/lib/api";
import { createFormat, type Format } from "@/lib/format";
import { en, pt, type Messages } from "@/lib/messages";

export type I18n = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Messages;
  f: Format;
};

export const LANG_KEY = "audi-checker:lang";

export const MESSAGES: Record<Language, Messages> = { "pt-BR": pt, en };

export function makeI18n(lang: Language, setLang: (lang: Language) => void): I18n {
  return { lang, setLang, t: MESSAGES[lang], f: createFormat(lang) };
}

export const I18nContext = createContext<I18n>(makeI18n("pt-BR", () => {}));

export function useI18n() {
  return useContext(I18nContext);
}

/** Mensagem de erro no idioma: erros de rede são nossos; o resto vem da API. */
export function errorText(err: unknown, t: Messages, fallback = t.errors.generic): string {
  if (err instanceof ApiError) return err.status === 0 ? t.errors.network : err.message;
  return err instanceof Error && err.message ? err.message : fallback;
}
