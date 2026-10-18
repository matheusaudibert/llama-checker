import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TextShimmer } from "@/components/motion/text-shimmer";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { Hint } from "@/components/ui/hint";
import { useCopy } from "@/hooks/use-copy";
import { EpicIcon } from "@/components/ui/misc";
import { api } from "@/lib/api";
import { formatCountdown } from "@/lib/format";
import { errorText, useI18n } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "waiting"; sessionId: string; url: string; expiresAt: number }
  | { kind: "loading" }
  // A mensagem é montada na hora de mostrar, para seguir o idioma atual.
  | { kind: "failed"; message: (t: Messages) => string };

const POLL_MS = 3000;

/**
 * Fluxo de login da Epic (device code): gera o link, espera a aprovação
 * consultando a cada 3 s e entrega o session_id aprovado.
 */
export function DeviceLogin({
  onApproved,
  onCancel,
}: {
  /** Recebe a sessão aprovada e busca os dados da conta. */
  onApproved: (sessionId: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());
  const { copied, copy } = useCopy();
  const approvedRef = useRef(onApproved);
  useEffect(() => {
    approvedRef.current = onApproved;
  });

  const waitingId = phase.kind === "waiting" ? phase.sessionId : null;
  const expiresAt = phase.kind === "waiting" ? phase.expiresAt : 0;

  // Consulta o status até sair de "pending".
  useEffect(() => {
    if (!waitingId) return;
    let cancelled = false;
    let timer = 0;
    const poll = async () => {
      try {
        const status = await api.loginStatus(waitingId);
        if (cancelled) return;
        if (status.status === "pending") {
          timer = window.setTimeout(poll, POLL_MS);
          return;
        }
        if (status.status === "completed") {
          setPhase({ kind: "loading" });
          try {
            await approvedRef.current(waitingId);
          } catch (err) {
            if (!cancelled) setPhase({ kind: "failed", message: (tr) => errorText(err, tr, tr.errors.loadAccount) });
          }
          return;
        }
        setPhase({
          kind: "failed",
          message: (tr) => (status.status === "expired" ? tr.errors.linkExpired : (status.error ?? tr.errors.loginRefused)),
        });
      } catch (err) {
        if (cancelled) return;
        setPhase({ kind: "failed", message: (tr) => errorText(err, tr, tr.errors.pollLogin) });
      }
    };
    timer = window.setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [waitingId]);

  // Relógio do tempo restante; ao zerar, o link expirou.
  useEffect(() => {
    if (!waitingId) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= expiresAt) setPhase({ kind: "failed", message: (tr) => tr.errors.linkExpired });
    }, 1000);
    return () => window.clearInterval(id);
  }, [waitingId, expiresAt]);

  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  const start = async () => {
    setPhase({ kind: "starting" });
    try {
      const login = await api.startLogin();
      setNow(Date.now());
      setPhase({
        kind: "waiting",
        sessionId: login.session_id,
        url: login.verification_url,
        expiresAt: Date.now() + login.expires_in * 1000,
      });
    } catch (err) {
      setPhase({ kind: "failed", message: (tr) => errorText(err, tr, tr.errors.startLogin) });
    }
  };

  const cancel = () => {
    if (waitingId) api.endSession(waitingId).catch(() => {});
    setPhase({ kind: "idle" });
    onCancel?.();
  };

  if (phase.kind === "idle" || phase.kind === "starting") {
    return (
      <Button className="w-full" onClick={start} disabled={phase.kind === "starting"}>
        <EpicIcon />
        {phase.kind === "starting" ? t.login.generating : t.login.signIn}
      </Button>
    );
  }

  if (phase.kind === "loading") {
    return (
      <div className="flex h-12 items-center justify-center text-sm">
        <TextShimmer>{t.login.approvedLoading}</TextShimmer>
      </div>
    );
  }

  if (phase.kind === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3.5 py-3 text-sm">
          {phase.message(t)}
        </p>
        <Button className="w-full" onClick={start}>
          <EpicIcon />
          {t.login.retry}
        </Button>
        {onCancel ? (
          <Button variant="ghost" className="w-full" onClick={cancel}>
            {t.common.cancel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <a href={phase.url} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "md", "w-full")}>
        <EpicIcon />
        {t.login.openEpic}
        <ExternalLink className="size-4" />
      </a>

      <div>
        <div className="mb-2 text-xs text-muted-foreground">{t.login.orCopy}</div>
        <div className="flex items-center gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-[10px] border border-input bg-foreground/5 px-3.5">
            <span className="truncate text-sm">{phase.url}</span>
          </div>
          <Hint label={copied ? t.common.copied : t.login.copyLink}>
            <Button size="icon" variant="secondary" aria-label={t.login.copyLink} onClick={() => copy(phase.url)}>
              {copied ? <Check /> : <Copy />}
            </Button>
          </Hint>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <TextShimmer>{t.login.waiting}</TextShimmer>
        <span>
          {t.login.expiresIn} <span className="font-medium text-foreground tabular-nums">{formatCountdown(remaining)}</span>
        </span>
      </div>

      <Button variant="ghost" className="w-full" onClick={cancel}>
        {t.common.cancel}
      </Button>
    </div>
  );
}
