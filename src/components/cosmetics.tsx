import { useState, type CSSProperties, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Field, FieldGrid, Status } from "@/components/ui/layout";
import type { Cosmetic, EquippedCosmetic } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type AnyCosmetic = Cosmetic | EquippedCosmetic;

/**
 * Fundo da raridade: a imagem pronta que a API manda em `images.background`
 * (já com o fundo mítico quando é o caso). O ícone transparente vai por cima.
 */
function backgroundOf(item: AnyCosmetic): CSSProperties | undefined {
  const url = item.images.background;
  return url ? { backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined;
}

function stylesOf(item: AnyCosmetic): string[] {
  return "owned_styles" in item ? item.owned_styles : item.styles;
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded bg-black/55 px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide text-white uppercase">
      {children}
    </span>
  );
}

/** Quadrado do item com a cor sólida da raridade. */
export function ItemTile({ item, onSelect, caption }: { item: AnyCosmetic; onSelect: (item: AnyCosmetic) => void; caption?: string }) {
  const { t, f } = useI18n();
  const [broken, setBroken] = useState(false);
  const image = item.images.small_icon ?? item.images.icon;
  const name = f.itemName(item);
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={name}
      className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-[10px] bg-foreground/5 text-left text-white ring-2 ring-transparent transition-colors outline-none hover:ring-foreground/70 focus-visible:ring-ring"
      style={backgroundOf(item)}
    >
      {image && !broken ? (
        <img src={image} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} className="absolute inset-0 size-full object-contain" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-[11px] break-all opacity-80">{item.id}</span>
      )}
      <span className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
        {item.is_mythic ? <Badge>{t.item.mythic}</Badge> : null}
        {"is_exclusive" in item && item.is_exclusive ? <Badge>{t.item.exclusive}</Badge> : null}
      </span>
      <span className="relative mt-auto block bg-black/60 px-2 py-1.5">
        {caption ? <span className="block truncate text-[10px] leading-3 text-white/70">{caption}</span> : null}
        <span className="block truncate text-xs leading-4 font-semibold">{name}</span>
      </span>
    </button>
  );
}

export function ItemGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5", className)}>{children}</div>;
}

/** Detalhes do item; mostra só a imagem `icon`. */
export function ItemDialog({ item, onClose }: { item: AnyCosmetic | null; onClose: () => void }) {
  const { f } = useI18n();
  return (
    <Dialog
      open={item !== null}
      onClose={onClose}
      title={item ? f.itemName(item) : ""}
      description={item ? f.rarity(item.rarity) : undefined}
      className="max-w-lg"
    >
      {item ? <ItemDetails item={item} /> : null}
    </Dialog>
  );
}

function ItemDetails({ item }: { item: AnyCosmetic }) {
  const { t, f, lang } = useI18n();
  const styles = stylesOf(item);
  const isEquipped = "styles" in item;
  const yesNo = (value: boolean) => (value ? t.common.yes : t.common.no);
  // Com a página em português, o nome original em inglês também aparece.
  const otherName = lang === "pt-BR" && item.name_pt && item.name_pt !== item.name ? item.name : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-[10px] bg-foreground/5" style={backgroundOf(item)}>
        {item.images.icon ? (
          <img src={item.images.icon} alt={f.itemName(item)} className="size-full object-contain" />
        ) : (
          <div className="flex size-full items-center justify-center p-4 text-center text-sm text-white/80">{t.item.noImage}</div>
        )}
      </div>
      <FieldGrid className="md:grid-cols-2">
        <Field label={t.item.id} mono className="md:col-span-2">
          {item.id}
        </Field>
        {otherName ? (
          <Field label={t.item.englishName} className="md:col-span-2">
            {otherName}
          </Field>
        ) : null}
        <Field label={t.item.rarity}>{f.rarity(item.rarity)}</Field>
        <Field label={t.item.series}>{item.series ? f.rarity(item.series) : t.item.noSeries}</Field>
        <Field label={t.item.type}>{f.type(item.type)}</Field>
        <Field label={t.item.mythic}>
          <Status ok={item.is_mythic}>{yesNo(item.is_mythic)}</Status>
        </Field>
        {"is_exclusive" in item ? (
          <Field label={t.item.exclusive}>
            <Status ok={item.is_exclusive}>{yesNo(item.is_exclusive)}</Status>
          </Field>
        ) : null}
        {/* Preço só quando a API estima; item fora da loja diz isso. Dados salvos antes não têm os campos. */}
        {item.estimated_price != null ? (
          <Field label={t.item.shopPrice}>
            <img src="/vbucks.png" alt="" className="size-5 shrink-0" />
            <span className="tabular-nums">{f.number(item.estimated_price)}</span>
          </Field>
        ) : item.from_shop === false ? (
          <Field label={t.item.shopPrice}>{t.item.notInShop}</Field>
        ) : null}
        <Field label={t.item.inCatalog}>
          <Status ok={item.in_catalog}>{yesNo(item.in_catalog)}</Status>
        </Field>
      </FieldGrid>
      <div>
        <div className="mb-2 text-xs text-muted-foreground">{isEquipped ? t.item.selectedStyles : t.item.ownedStyles}</div>
        {styles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {styles.map((style) => (
              <span key={style} className="rounded-md border border-input bg-foreground/5 px-2 py-1 font-mono text-xs">
                {style}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.none}</p>
        )}
      </div>
    </div>
  );
}
