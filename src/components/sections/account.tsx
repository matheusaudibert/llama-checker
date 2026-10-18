import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { CopyAction, DataTable, Field, FieldGrid, FieldIconButton, PageHeader, Section, Sections, Status } from "@/components/ui/layout";
import { Avatar, Flag } from "@/components/ui/misc";
import type { AccountData } from "@/hooks/use-account";
import { maskEmail } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Props = { data: AccountData };

export function AccountSection({ data }: Props) {
  const { t, f } = useI18n();
  const { summary } = data;
  const [showEmail, setShowEmail] = useState(false);
  const skin = data.equipped?.skin;
  const fullName = [summary.name, summary.last_name].filter(Boolean).join(" ");
  const yesNo = (value: boolean) => (value ? t.common.yes : t.common.no);

  return (
    <>
      <PageHeader title={t.nav.conta} description={t.account.description} />
      <Sections>
        <Section title={t.account.profile}>
          <div className="mb-6 flex items-center gap-4">
            <Avatar src={skin?.images.icon} name={summary.display_name} className="size-16 text-xl" />
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-bold">{summary.display_name}</div>
              <div className="text-sm text-muted-foreground">{skin ? t.account.wearing(f.itemName(skin)) : t.account.noSkin}</div>
            </div>
          </div>
          <div className="mb-6 text-sm">
            <span className="font-bold">ID:</span> <span className="break-all">{summary.account_id}</span>
          </div>
          <FieldGrid>
            <Field label={t.account.displayName} actions={<CopyAction value={summary.display_name} label={t.account.copyName} />}>
              {summary.display_name}
            </Field>
            <Field
              label={t.account.email}
              trailing={
                summary.email ? (
                  <FieldIconButton label={showEmail ? t.account.hideEmail : t.account.showEmail} onClick={() => setShowEmail((v) => !v)}>
                    {showEmail ? <EyeOff /> : <Eye />}
                  </FieldIconButton>
                ) : null
              }
              actions={summary.email ? <CopyAction value={summary.email} label={t.account.copyEmail} /> : null}
            >
              {summary.email ? (showEmail ? summary.email : maskEmail(summary.email)) : "—"}
            </Field>
            <Field label={t.account.accountId} mono actions={<CopyAction value={summary.account_id} label={t.account.copyId} />}>
              {summary.account_id}
            </Field>
          </FieldGrid>
        </Section>

        <Section title={t.account.personal} description={t.account.personalDescription}>
          <FieldGrid>
            <Field label={t.account.firstName}>{summary.name || "—"}</Field>
            <Field label={t.account.lastName}>{summary.last_name || "—"}</Field>
            <Field label={t.account.country}>
              {summary.country ? (
                <>
                  <Flag code={summary.country} />
                  <span className="truncate">
                    {f.country(summary.country)} ({summary.country.toUpperCase()})
                  </span>
                </>
              ) : (
                "—"
              )}
            </Field>
            {fullName ? <Field label={t.account.fullName}>{fullName}</Field> : null}
          </FieldGrid>
        </Section>

        <Section title={t.account.dates} description={t.account.datesDescription}>
          <FieldGrid>
            <Field label={t.account.created}>{f.date(summary.account_created)}</Field>
            <Field label={t.account.profileCreated}>{f.date(summary.profile_created)}</Field>
            <Field label={t.account.lastLogin}>{f.dateTime(summary.last_login)}</Field>
            <Field label={t.account.lastMatch}>{f.dateTime(summary.last_match_end)}</Field>
          </FieldGrid>
        </Section>

        <Section title={t.account.displayName} description={t.account.nameHistory}>
          <FieldGrid>
            <Field label={t.account.nameChanges}>{f.number(summary.display_name_changes)}</Field>
            <Field label={t.account.lastNameChange}>{f.dateTime(summary.last_display_name_change)}</Field>
            <Field label={t.account.canChange}>
              <Status ok={summary.can_change_display_name}>{yesNo(summary.can_change_display_name)}</Status>
            </Field>
          </FieldGrid>
        </Section>
      </Sections>
    </>
  );
}

export function SecuritySection({ data }: Props) {
  const { t } = useI18n();
  const { summary } = data;
  return (
    <>
      <PageHeader title={t.nav.seguranca} description={t.security.description} />
      <Sections>
        <Section title={t.security.tfa} description={t.security.tfaDescription}>
          <FieldGrid>
            <Field label={t.security.tfaField}>
              <Status ok={summary.tfa_enabled}>{summary.tfa_enabled ? t.security.enabled : t.security.disabled}</Status>
            </Field>
          </FieldGrid>
        </Section>
        <Section title={t.security.emailControls} description={t.security.emailControlsDescription}>
          <FieldGrid>
            <Field label={t.security.emailVerified}>
              <Status ok={summary.email_verified}>{summary.email_verified ? t.common.yes : t.common.no}</Status>
            </Field>
            <Field label={t.security.minor}>
              <Status ok={!summary.minor_verified}>{summary.minor_verified ? t.common.yes : t.common.no}</Status>
            </Field>
          </FieldGrid>
        </Section>
      </Sections>
    </>
  );
}

export function ConnectionsSection({ data }: Props) {
  const { t, f } = useI18n();
  const { summary } = data;
  const linked = summary.external_auths.length;
  return (
    <>
      <PageHeader title={t.nav.conexoes} description={t.connections.description} />
      <Sections>
        <Section title={t.connections.linked} description={t.connections.linkedCount(f.number(linked), linked)}>
          <DataTable
            empty={t.connections.noneLinked}
            columns={[
              { key: "platform", label: t.connections.platform },
              { key: "name", label: t.connections.nameOnPlatform },
              { key: "date", label: t.connections.connectedAt, align: "right" },
            ]}
            rows={summary.external_auths.map((auth, index) => ({
              key: `${auth.type}-${index}`,
              cells: {
                platform: <span className="font-medium">{f.platform(auth.type)}</span>,
                name: auth.display_name || "—",
                date: f.date(auth.date_added),
              },
            }))}
          />
        </Section>
        <Section title={t.connections.linkable} description={t.connections.linkableDescription}>
          {summary.linkable_platforms.length > 0 ? (
            <FieldGrid>
              {summary.linkable_platforms.map((platform) => (
                <Field key={platform} label={t.connections.platform}>
                  <Status ok>{f.platform(platform)}</Status>
                </Field>
              ))}
            </FieldGrid>
          ) : (
            <p className="text-sm text-muted-foreground">{t.connections.allLinked}</p>
          )}
        </Section>
      </Sections>
    </>
  );
}

export function VbucksSection({ data }: Props) {
  const { t, f } = useI18n();
  const { summary } = data;
  const platforms = Object.entries(summary.vbucks_by_platform).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHeader title={t.nav.vbucks} description={t.vbucks.description} />
      <Sections>
        <Section title={t.vbucks.balance}>
          <FieldGrid>
            <Field label={t.vbucks.total}>
              <span className="font-semibold tabular-nums">{f.number(summary.vbucks)}</span>
            </Field>
            <Field label={t.vbucks.purchasePlatform}>{f.platform(summary.mtx_platform)}</Field>
          </FieldGrid>
        </Section>
        <Section title={t.vbucks.byPlatform} description={t.vbucks.byPlatformDescription}>
          <DataTable
            empty={t.vbucks.empty}
            columns={[
              { key: "platform", label: t.connections.platform },
              { key: "amount", label: t.vbucks.amount, align: "right" },
            ]}
            rows={platforms.map(([platform, amount]) => ({
              key: platform,
              cells: { platform: f.platform(platform), amount: f.number(amount) },
            }))}
          />
        </Section>
        <Section title={t.vbucks.refunds} description={t.vbucks.refundsDescription}>
          <FieldGrid>
            <Field label={t.vbucks.refundCredits}>{f.number(summary.refund_credits)}</Field>
            <Field label={t.vbucks.refundsUsed}>{f.number(summary.refunds_used)}</Field>
          </FieldGrid>
        </Section>
      </Sections>
    </>
  );
}

export function StatsSection({ data }: Props) {
  const { t, f } = useI18n();
  const { summary } = data;
  const season = summary.current_season;
  const seasons = [...summary.past_seasons].sort((a, b) => (b.season ?? 0) - (a.season ?? 0));
  return (
    <>
      <PageHeader title={t.nav.estatisticas} description={t.stats.description} />
      <Sections>
        <Section title={t.stats.general}>
          <FieldGrid>
            <Field label={t.stats.level}>{f.number(summary.account_level)}</Field>
            <Field label={t.stats.lifetimeWins}>{f.number(summary.lifetime_wins)}</Field>
            <Field label={t.stats.totalWins}>{f.number(summary.total_wins)}</Field>
            <Field label={t.stats.totalMatches}>{f.number(summary.total_matches)}</Field>
            <Field label={t.account.lastMatch}>{f.dateTime(summary.last_match_end)}</Field>
          </FieldGrid>
        </Section>
        <Section title={t.stats.current}>
          <FieldGrid>
            <Field label={t.stats.season}>{season.season != null ? t.stats.seasonN(season.season) : "—"}</Field>
            <Field label={t.stats.seasonLevel}>{f.number(season.level)}</Field>
            <Field label={t.stats.battlePass}>
              <Status ok={season.battle_pass_purchased ?? false}>
                {season.battle_pass_purchased ? t.stats.purchased : t.stats.notPurchased}
              </Status>
            </Field>
            <Field label={t.stats.wins}>{f.number(season.wins)}</Field>
          </FieldGrid>
        </Section>
        <Section title={t.stats.past} description={t.stats.pastCount(f.number(seasons.length))}>
          <DataTable
            empty={t.stats.noHistory}
            columns={[
              { key: "season", label: t.stats.season },
              { key: "level", label: t.stats.seasonLevel, align: "right" },
              { key: "bp", label: t.stats.battlePass },
              { key: "wins", label: t.stats.wins, align: "right" },
            ]}
            rows={seasons.map((s, index) => ({
              key: `${s.season ?? "x"}-${index}`,
              cells: {
                season: s.season != null ? t.stats.seasonN(s.season) : "—",
                level: f.number(s.level),
                bp: <Status ok={s.battle_pass_purchased ?? false}>{s.battle_pass_purchased ? t.common.yes : t.common.no}</Status>,
                wins: f.number(s.wins),
              },
            }))}
          />
        </Section>
      </Sections>
    </>
  );
}
