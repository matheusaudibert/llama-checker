import { CircleAlert, CircleCheck, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnimatedToastStack, useAnimatedToastStack } from "@/components/motion/animated-toast-stack";
import { DeviceLogin } from "@/components/device-login";
import { LanguageSwitch } from "@/components/i18n-provider";
import { LogoMenu } from "@/components/logo-menu";
import { MobileNav, Sidebar } from "@/components/nav";
import { PoweredBy } from "@/components/powered-by";
import { AccountSection, ConnectionsSection, SecuritySection, StatsSection, VbucksSection } from "@/components/sections/account";
import { EquippedSection, ImagesSection, LockerSection } from "@/components/sections/items";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Hint } from "@/components/ui/hint";
import { Avatar, Logo } from "@/components/ui/misc";
import { useAccount, type AccountData } from "@/hooks/use-account";
import { errorText, useI18n } from "@/lib/i18n";
import { en, pt } from "@/lib/messages";
import { useSectionRoute, type SectionId } from "@/lib/sections";
import { cn } from "@/lib/utils";

export default function App() {
  const account = useAccount();
  if (!account.data) return <LoginScreen onApproved={account.completeLogin} />;
  return <Dashboard account={account} data={account.data} />;
}

function LoginScreen({ onApproved }: { onApproved: (sessionId: string) => Promise<void> }) {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo className="mb-6 size-28" />
          <h1 className="font-brand text-[40px] leading-10 tracking-wide">Llama Checker</h1>
          <p className="mt-2 text-base text-muted-foreground">{t.login.tagline}</p>
        </div>
        <DeviceLogin onApproved={onApproved} />
        <PoweredBy className="mx-auto mt-6" />
      </div>
      <LanguageSwitch className="fixed top-4 right-4" />
    </main>
  );
}

function SectionView({ section, data }: { section: SectionId; data: AccountData }) {
  switch (section) {
    case "conta":
      return <AccountSection data={data} />;
    case "seguranca":
      return <SecuritySection data={data} />;
    case "conexoes":
      return <ConnectionsSection data={data} />;
    case "vbucks":
      return <VbucksSection data={data} />;
    case "estatisticas":
      return <StatsSection data={data} />;
    case "equipados":
      return <EquippedSection data={data} />;
    case "armario":
      return <LockerSection data={data} />;
    case "imagens":
      return <ImagesSection data={data} />;
  }
}

function Dashboard({ account, data }: { account: ReturnType<typeof useAccount>; data: AccountData }) {
  const [section, navigate] = useSectionRoute();
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { summary } = data;
  const { t, f } = useI18n();

  const { toasts, showToast, updateToast, dismissToast } = useAnimatedToastStack({ defaultDuration: 3500, limit: 3 });

  const refresh = async () => {
    const id = showToast({ title: t.toast.refreshing, description: t.toast.refreshingDescription, status: "loading", duration: 0, dismissible: false });
    const result = await account.refresh();
    if (result.status === "ok") {
      updateToast(id, { title: t.toast.updated, description: t.toast.updatedAt(f.time()), status: "success", duration: 3500, dismissible: true });
    } else if (result.status === "error") {
      updateToast(id, { title: t.toast.failed, description: errorText(result.error, t), status: "error", duration: 5000, dismissible: true });
    } else {
      dismissToast(id);
      setLoginOpen(true);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 bg-background">
        <div className="mx-auto flex h-16 max-w-[1132px] items-center gap-3 px-4">
          <LogoMenu>
            <a href="#/conta" className="flex min-w-0 items-center gap-2.5" onClick={(e) => (e.preventDefault(), navigate("conta"))}>
              <Logo />
              <span className="truncate font-brand text-xl leading-none tracking-wide">Llama Checker</span>
            </a>
          </LogoMenu>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitch />
            <Hint label={t.header.refreshHint} side="bottom">
              <Button variant="ghost" size="sm" className="px-2.5 sm:px-3" onClick={refresh} disabled={account.refreshing} aria-label={t.header.refresh}>
                <RefreshCw className={cn("size-[18px]", account.refreshing && "opacity-50")} />
                <StableLabel
                current={account.refreshing ? t.header.refreshing : t.header.refresh}
                labels={[pt.header.refresh, en.header.refresh, pt.header.refreshing, en.header.refreshing]}
              />
              </Button>
            </Hint>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <span className="hidden items-center gap-2 md:flex">
              <Avatar src={data.equipped?.skin?.images.icon} name={summary.display_name} className="size-8 text-xs" />
              <span className="max-w-[160px] truncate text-sm font-medium">{summary.display_name}</span>
            </span>
            <Button variant="ghost" size="sm" className="px-2.5 sm:px-3" onClick={() => setLogoutOpen(true)} aria-label={t.header.logout}>
              <LogOut className="size-[18px]" />
              <StableLabel current={t.header.logout} labels={[pt.header.logout, en.header.logout]} />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1132px] gap-10 px-4 pt-8 pb-24 lg:pt-14">
        <Sidebar active={section} onSelect={navigate} />
        <main className="min-w-0 flex-1 lg:w-[740px] lg:flex-none">
          <MobileNav active={section} onSelect={navigate} />
          {account.session === "lost" ? (
            <Notice>
              {t.session.expired(f.dateTime(data.fetchedAt))}{" "}
              <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => setLoginOpen(true)}>
                {t.session.signInAgain}
              </button>
            </Notice>
          ) : null}
          {account.error != null ? (
            <Notice tone="error" onDismiss={account.clearError}>
              {errorText(account.error, t)}
            </Notice>
          ) : null}
          <SectionView section={section} data={data} />
        </main>
      </div>

      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        dismissLabel={t.toast.dismiss}
        position="bottom-right"
        fixed
        // Ícones de contorno, como os do menu lateral, sem o círculo colorido de fundo.
        classNames={{ iconWrap: "rounded-none bg-transparent" }}
        icons={TOAST_ICONS}
      />

      <Dialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        title={t.session.reloginTitle}
        description={t.session.reloginDescription}
      >
        <DeviceLogin
          onApproved={async (id) => {
            await account.completeLogin(id);
            setLoginOpen(false);
            showToast({ title: t.toast.updated, description: t.toast.reloggedAt(f.time()), status: "success" });
          }}
          onCancel={() => setLoginOpen(false)}
        />
      </Dialog>

      <Dialog open={logoutOpen} onClose={() => setLogoutOpen(false)} title={t.session.logoutTitle} description={t.session.logoutDescription}>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={() => {
              setLogoutOpen(false);
              void account.logout();
            }}
          >
            {t.header.logout}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

const TOAST_ICONS = {
  loading: <LoaderCircle className="size-5 text-primary" strokeWidth={1.5} />,
  success: <CircleCheck className="size-5 text-primary" strokeWidth={1.5} />,
  error: <CircleAlert className="size-5 text-destructive" strokeWidth={1.5} />,
};

function Notice({ children, tone = "info", onDismiss }: { children: ReactNode; tone?: "info" | "error"; onDismiss?: () => void }) {
  const { t } = useI18n();
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-8 flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm",
        tone === "error" ? "border-destructive/40 bg-destructive/10" : "border-input bg-foreground/5 text-muted-foreground",
      )}
    >
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", tone === "error" ? "bg-destructive" : "bg-amber-500")} />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={onDismiss}>
          {t.common.close}
        </button>
      ) : null}
    </div>
  );
}

// Todos os rótulos ocupam a mesma célula e só o atual aparece: o botão fica com a largura do maior,
// então a nav não se mexe ao trocar o idioma.
function StableLabel({ current, labels }: { current: string; labels: string[] }) {
  return (
    <span className="hidden sm:inline-grid">
      {[...new Set(labels)].map((label) => (
        <span key={label} className={cn("col-start-1 row-start-1", label !== current && "invisible")} aria-hidden={label !== current}>
          {label}
        </span>
      ))}
    </span>
  );
}
