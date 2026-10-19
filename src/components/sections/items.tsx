import { Download, ImageIcon, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/motion/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { Switch } from "@/components/motion/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { TextShimmer } from "@/components/motion/text-shimmer";
import { ItemDialog, ItemGrid, ItemTile, type AnyCosmetic } from "@/components/cosmetics";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { PageHeader, Section, Sections } from "@/components/ui/layout";
import type { AccountData } from "@/hooks/use-account";
import { api, ApiError, type Cosmetic, type Equipped, type EquippedCosmetic, type LockerCategory, type RenderCategory } from "@/lib/api";
import { errorText, useI18n } from "@/lib/i18n";
import { loadRenders, renderKey, saveRender } from "@/lib/image-store";

type Props = { data: AccountData };

function Unavailable({ what }: { what: string }) {
  const { t } = useI18n();
  return (
    <p className="rounded-[10px] border border-input px-4 py-6 text-center text-sm text-muted-foreground">{t.errors.unavailable(what)}</p>
  );
}

const SINGLE_SLOTS: (keyof Omit<Equipped, "emotes" | "wraps">)[] = [
  "skin",
  "backpack",
  "pickaxe",
  "glider",
  "contrail",
  "shoes",
  "aura",
  "banner",
  "lobby_music",
  "loading_screen",
];

function EmptySlot({ label }: { label: string }) {
  const { t } = useI18n();
  return (
    <div className="relative flex aspect-square w-full items-center justify-center rounded-[10px] border border-dashed border-input">
      <span className="text-xs text-muted-foreground">{t.equipped.empty}</span>
      <span className="absolute inset-x-0 bottom-0 truncate px-2 py-1.5 text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function EquippedSection({ data }: Props) {
  const { t, f } = useI18n();
  const [selected, setSelected] = useState<AnyCosmetic | null>(null);
  const equipped = data.equipped;
  return (
    <>
      <PageHeader title={t.nav.equipped} description={t.equipped.description} />
      <Sections>
        {equipped ? (
          <>
            <Section title={t.equipped.look}>
              <ItemGrid>
                {SINGLE_SLOTS.map((key) => {
                  const item = equipped[key];
                  const label = t.equipped.slots[key];
                  return item ? <ItemTile key={key} item={item} caption={label} onSelect={setSelected} /> : <EmptySlot key={key} label={label} />;
                })}
              </ItemGrid>
            </Section>
            <Section title={t.equipped.emotes} description={t.equipped.emotesCount(f.number(equipped.emotes.length))}>
              <SlotList items={equipped.emotes} onSelect={setSelected} />
            </Section>
            <Section title={t.equipped.wraps} description={t.equipped.wrapsCount(f.number(equipped.wraps.length))}>
              <SlotList items={equipped.wraps} onSelect={setSelected} />
            </Section>
          </>
        ) : (
          <Unavailable what={t.equipped.what} />
        )}
      </Sections>
      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function SlotList({ items, onSelect }: { items: EquippedCosmetic[]; onSelect: (item: AnyCosmetic) => void }) {
  const { t } = useI18n();
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{t.common.none}</p>;
  return (
    <ItemGrid>
      {items.map((item, index) => (
        <ItemTile key={`${item.id}-${index}`} item={item} caption={t.equipped.slot(index + 1)} onSelect={onSelect} />
      ))}
    </ItemGrid>
  );
}

const LOCKER_CATEGORIES: LockerCategory[] = ["skins", "backpacks", "pickaxes", "emotes", "gliders", "wraps", "sprays", "others", "banners"];

const PAGE = 120;

export function LockerSection({ data }: Props) {
  const { t, f } = useI18n();
  const locker = data.locker;
  const [category, setCategory] = useState<LockerCategory>("skins");
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [specialOnly, setSpecialOnly] = useState(false);
  const [shopOnly, setShopOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<AnyCosmetic | null>(null);

  const items: Cosmetic[] = useMemo(() => locker?.[category] ?? [], [locker, category]);
  const rarities = useMemo(() => [...new Set(items.map((i) => i.rarity))], [items]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Busca nos dois idiomas: dá para achar "Renegade Raider" ou "Saqueadora Renegada".
    return items.filter(
      (item) =>
        (rarity === "all" || item.rarity === rarity) &&
        (!specialOnly || item.is_mythic || item.is_exclusive) &&
        (!shopOnly || item.from_shop) &&
        (!q || item.name.toLowerCase().includes(q) || item.name_pt?.toLowerCase().includes(q) || item.id.includes(q)),
    );
  }, [items, query, rarity, specialOnly, shopOnly]);

  const changeCategory = (next: string) => {
    setCategory(next as LockerCategory);
    setRarity("all");
    setLimit(PAGE);
  };

  const total = locker ? Object.values(locker.counts).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <>
      <PageHeader title={t.nav.locker} description={locker ? t.locker.totalDescription(f.number(total)) : t.locker.description} />
      <Sections>
        {locker ? (
          <Section title={t.locker.categories[category]} description={t.locker.shown(f.number(filtered.length), f.number(items.length))}>
            <Tabs value={category} onValueChange={changeCategory} variant="underline">
              <TabsList wrapperClassName="mb-6" className="w-full min-w-max">
                {LOCKER_CATEGORIES.map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {t.locker.categories[key]}
                    <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{f.number(locker.counts[key])}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
              <Input
                value={query}
                onChange={(v) => {
                  setQuery(v);
                  setLimit(PAGE);
                }}
                placeholder={t.locker.search}
                aria-label={t.locker.searchLabel}
                leftIcon={<Search />}
                classNames={{ field: "h-12 rounded-[10px] border-input bg-foreground/5", input: "text-sm" }}
              />
              <Select
                value={rarity}
                onValueChange={(v) => {
                  setRarity(v);
                  setLimit(PAGE);
                }}
              >
                <SelectTrigger className="h-12 rounded-[10px] border-input bg-foreground/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.locker.allRarities}</SelectItem>
                  {rarities.map((r) => (
                    <SelectItem key={r} value={r}>
                      {f.rarity(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-6 flex flex-wrap gap-x-6 gap-y-3">
              <Switch
                checked={specialOnly}
                onCheckedChange={(v) => {
                  setSpecialOnly(v);
                  setLimit(PAGE);
                }}
                label={t.locker.specialOnly}
              />
              <Switch
                checked={shopOnly}
                onCheckedChange={(v) => {
                  setShopOnly(v);
                  setLimit(PAGE);
                }}
                label={t.locker.shopOnly}
              />
            </div>

            {filtered.length > 0 ? (
              <>
                <ItemGrid>
                  {filtered.slice(0, limit).map((item) => (
                    <ItemTile key={item.id} item={item} onSelect={setSelected} />
                  ))}
                </ItemGrid>
                {filtered.length > limit ? (
                  <div className="mt-6 flex justify-center">
                    <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                      {t.locker.showMore(f.number(filtered.length - limit))}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="rounded-[10px] border border-input px-4 py-6 text-center text-sm text-muted-foreground">{t.locker.noResults}</p>
            )}
          </Section>
        ) : (
          <Unavailable what={t.locker.what} />
        )}
      </Sections>
      <ItemDialog item={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const RENDER_CATEGORIES: RenderCategory[] = ["skins", "backpacks", "pickaxes", "gliders", "emotes", "mythics"];

type RenderState = { status: "loading" } | { status: "done"; url: string; createdAt: string } | { status: "error"; error: unknown };

export function ImagesSection({ data }: Props) {
  const { t, f, lang } = useI18n();
  const locker = data.locker;
  const name = data.summary.display_name;
  const accountId = data.summary.account_id;
  // Uma imagem por categoria e idioma: os nomes nos cards mudam com o idioma.
  const [renders, setRenders] = useState<Record<string, RenderState>>({});

  // Recupera as imagens salvas no navegador e libera as URLs ao sair da seção.
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const current = urls.current;
    let cancelled = false;
    loadRenders(accountId).then((saved) => {
      if (cancelled || saved.length === 0) return;
      const restored: Record<string, RenderState> = {};
      for (const render of saved) {
        const url = URL.createObjectURL(render.blob);
        current.add(url);
        restored[render.key] = { status: "done", url, createdAt: render.createdAt };
      }
      // Não sobrescreve o que foi gerado enquanto carregava.
      setRenders((r) => ({ ...restored, ...r }));
    });
    return () => {
      cancelled = true;
      for (const url of current) URL.revokeObjectURL(url);
      current.clear();
    };
  }, [accountId]);

  const itemsFor = (category: RenderCategory) => {
    if (!locker) return [];
    const list: Cosmetic[] =
      category === "mythics" ? LOCKER_CATEGORIES.flatMap((c) => locker[c]).filter((i) => i.is_mythic) : locker[category];
    return list.map((i) => ({ id: i.id, owned_styles: i.owned_styles }));
  };

  const generate = async (category: RenderCategory) => {
    const key = renderKey(accountId, lang, category);
    setRenders((r) => ({ ...r, [key]: { status: "loading" } }));
    try {
      const blob = await api.render(category, name, itemsFor(category), lang);
      const url = URL.createObjectURL(blob);
      const createdAt = new Date().toISOString();
      urls.current.add(url);
      void saveRender({ key, accountId, blob, createdAt });
      const previous = renders[key];
      if (previous?.status === "done") {
        URL.revokeObjectURL(previous.url);
        urls.current.delete(previous.url);
      }
      setRenders((r) => ({ ...r, [key]: { status: "done", url, createdAt } }));
    } catch (err) {
      setRenders((r) => ({ ...r, [key]: { status: "error", error: err } }));
    }
  };

  const renderError = (err: unknown) =>
    err instanceof ApiError && err.status === 422 ? t.images.noItems : errorText(err, t, t.images.failed);

  return (
    <>
      <PageHeader title={t.nav.images} description={t.images.description} />
      <Sections>
        {locker ? (
          RENDER_CATEGORIES.map((category) => {
            const state = renders[renderKey(accountId, lang, category)];
            const label = t.locker.categories[category];
            const count = itemsFor(category).length;
            return (
              <Section
                key={category}
                title={label}
                description={
                  state?.status === "done"
                    ? `${t.images.items(f.number(count), count)} ${t.images.generatedAt(f.dateTime(state.createdAt))}`
                    : t.images.items(f.number(count), count)
                }
                actions={
                  <>
                    <Button variant="secondary" size="sm" onClick={() => generate(category)} disabled={state?.status === "loading" || count === 0}>
                      <ImageIcon className="size-4" />
                      {state?.status === "done" ? t.images.regenerate : t.images.generate}
                    </Button>
                    {state?.status === "done" ? (
                      <a href={state.url} download={`${name}-${category}-${lang}.png`} className={buttonClasses("primary", "sm")}>
                        <Download className="size-4" />
                        {t.images.download}
                      </a>
                    ) : null}
                  </>
                }
              >
                {state?.status === "loading" ? (
                  <div className="rounded-[10px] border border-input px-4 py-6 text-center text-sm">
                    <TextShimmer>{t.images.generating}</TextShimmer>
                  </div>
                ) : state?.status === "error" ? (
                  <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
                    {renderError(state.error)}
                  </p>
                ) : state?.status === "done" ? (
                  <a href={state.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[10px] border border-input">
                    <img src={state.url} alt={t.images.alt(label)} className="w-full" />
                  </a>
                ) : null}
              </Section>
            );
          })
        ) : (
          <Unavailable what={t.locker.what} />
        )}
      </Sections>
    </>
  );
}
