import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleIndicator, CollapsibleTrigger } from "@/components/motion/collapsible";
import { PoweredBy } from "@/components/powered-by";
import { useI18n } from "@/lib/i18n";
import { ALL_ITEMS, NAV_GROUPS, type SectionId } from "@/lib/sections";
import { cn } from "@/lib/utils";

function NavList({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  const { t } = useI18n();
  return (
    <>
      {NAV_GROUPS.map((group, index) => (
        <div key={group.group} className={cn("px-4 py-4", index > 0 && "border-t border-border")}>
          <div className="px-4 py-2 text-base font-medium">{t.nav[group.group]}</div>
          <ul>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    href={`#/${item.id}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      onSelect(item.id);
                    }}
                    className={cn(
                      "flex h-10 items-center rounded-lg px-4 py-1 text-sm transition-colors",
                      isActive ? "bg-foreground/[0.08]" : "hover:bg-foreground/[0.05]",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center">
                      <Icon className={cn("size-6", item.iconClass ?? "text-primary")} strokeWidth={1.5} />
                    </span>
                    <span className="truncate leading-7">{t.nav[item.id]}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-border px-8 py-4">
        <PoweredBy />
      </div>
    </>
  );
}

/** Barra lateral da página de conta da Epic. */
export function Sidebar({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t.nav.label} className="sticky top-[121px] hidden w-[320px] shrink-0 self-start rounded-2xl bg-card lg:block">
      <NavList active={active} onSelect={onSelect} />
    </nav>
  );
}

/** No celular a barra lateral vira um menu que abre por cima do conteúdo. */
export function MobileNav({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = ALL_ITEMS.find((i) => i.id === active) ?? ALL_ITEMS[0];
  const Icon = current.icon;
  return (
    <nav aria-label={t.nav.label} className="mb-8 lg:hidden">
      <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl bg-card">
        <CollapsibleTrigger className="h-14 rounded-2xl px-4 hover:bg-transparent">
          <span className="flex size-8 shrink-0 items-center">
            <Icon className={cn("size-6", current.iconClass ?? "text-primary")} strokeWidth={1.5} />
          </span>
          <span className="truncate text-sm font-medium">{t.nav[current.id]}</span>
          <CollapsibleIndicator />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border">
            <NavList
              active={active}
              onSelect={(id) => {
                setOpen(false);
                onSelect(id);
              }}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </nav>
  );
}
