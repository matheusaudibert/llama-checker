import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api, type AccountSummary, type Equipped, type Locker } from "@/lib/api";
import { clearRenders } from "@/lib/image-store";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";

export type AccountData = {
  summary: AccountSummary;
  equipped: Equipped | null;
  locker: Locker | null;
  fetchedAt: string;
};

export type RefreshResult = { status: "ok" } | { status: "login" } | { status: "error"; error: unknown };

/** checking: validando ao abrir · alive: sessão ativa · lost: caiu, mostrando dados salvos. */
export type SessionState = "checking" | "alive" | "lost";

const SESSION_KEY = "audi-checker:session";
const DATA_KEY = "audi-checker:data";
const KEEPALIVE_MS = 10 * 60 * 1000;

async function fetchAll(sessionId: string): Promise<AccountData> {
  const [summary, equipped, locker] = await Promise.allSettled([
    api.summary(sessionId),
    api.equipped(sessionId),
    api.locker(sessionId),
  ]);
  for (const result of [summary, equipped, locker]) {
    if (result.status === "rejected" && result.reason instanceof ApiError && result.reason.sessionGone) {
      throw result.reason;
    }
  }
  if (summary.status === "rejected") throw summary.reason;
  return {
    summary: summary.value,
    equipped: equipped.status === "fulfilled" ? equipped.value : null,
    locker: locker.status === "fulfilled" ? locker.value : null,
    fetchedAt: new Date().toISOString(),
  };
}

export function useAccount() {
  const [sessionId, setSessionId] = useState<string | null>(() => readJSON<string>(SESSION_KEY));
  const [data, setData] = useState<AccountData | null>(() => readJSON<AccountData>(DATA_KEY));
  const [session, setSession] = useState<SessionState>(() => (readJSON<string>(SESSION_KEY) ? "checking" : "lost"));
  const [refreshing, setRefreshing] = useState(false);
  // Erro cru: a interface traduz na hora de mostrar.
  const [error, setError] = useState<unknown>(null);

  const sessionRef = useRef(sessionId);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const save = useCallback((id: string | null, next: AccountData | null) => {
    setSessionId(id);
    setData(next);
    if (id) writeJSON(SESSION_KEY, id);
    else removeKey(SESSION_KEY);
    if (next) writeJSON(DATA_KEY, next);
    else removeKey(DATA_KEY);
  }, []);

  const handleFailure = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.sessionGone) {
      setSession("lost");
      return true;
    }
    setError(err);
    return false;
  }, []);

  // Ao abrir: valida a sessão salva e, se ainda não houver dados, busca tudo.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await api.loginStatus(sessionId);
        if (cancelled) return;
        if (status.status !== "completed") {
          setSession("lost");
          return;
        }
        setSession("alive");
        if (!readJSON<AccountData>(DATA_KEY)) {
          setRefreshing(true);
          const next = await fetchAll(sessionId);
          if (!cancelled) save(sessionId, next);
        }
      } catch (err) {
        if (!cancelled) {
          if (!handleFailure(err)) setSession("lost");
        }
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Só na abertura e quando a sessão é trocada.
  }, [sessionId, save, handleFailure]);

  // Com a página aberta, mantém a sessão viva.
  useEffect(() => {
    if (!sessionId || session !== "alive") return;
    const id = window.setInterval(async () => {
      try {
        const status = await api.loginStatus(sessionId);
        if (status.status !== "completed") setSession("lost");
      } catch (err) {
        if (err instanceof ApiError && err.sessionGone) setSession("lost");
      }
    }, KEEPALIVE_MS);
    return () => window.clearInterval(id);
  }, [sessionId, session]);

  /** Login aprovado: busca os dados e revoga a sessão anterior, se houver. */
  const completeLogin = useCallback(
    async (newId: string) => {
      const previous = sessionRef.current;
      const next = await fetchAll(newId);
      setError(null);
      save(newId, next);
      setSession("alive");
      if (previous && previous !== newId) api.endSession(previous).catch(() => {});
    },
    [save],
  );

  /** Atualizar: com a sessão viva, busca tudo de novo. "login" quando precisa entrar de novo. */
  const refresh = useCallback(async (): Promise<RefreshResult> => {
    const id = sessionRef.current;
    if (!id || session === "lost") return { status: "login" };
    setRefreshing(true);
    setError(null);
    try {
      save(id, await fetchAll(id));
      return { status: "ok" };
    } catch (err) {
      if (err instanceof ApiError && err.sessionGone) {
        setSession("lost");
        return { status: "login" };
      }
      // Quem chamou mostra o erro (toast); não vira aviso fixo na página.
      return { status: "error", error: err };
    } finally {
      setRefreshing(false);
    }
  }, [session, save]);

  const logout = useCallback(async () => {
    const id = sessionRef.current;
    save(null, null);
    setSession("lost");
    setError(null);
    void clearRenders();
    if (id) await api.endSession(id).catch(() => {});
  }, [save]);

  return { sessionId, data, session, refreshing, error, clearError: () => setError(null), completeLogin, refresh, logout };
}
