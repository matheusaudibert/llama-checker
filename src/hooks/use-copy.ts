import { useEffect, useState } from "react";

/** Copia para a área de transferência e marca "copiado" por um instante. */
export function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), timeout);
    return () => window.clearTimeout(id);
  }, [copied, timeout]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return { copied, copy };
}
