import type { Language } from "@/lib/api";

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email.replace(/.(?=.)/g, "*");
  const visible = user.length <= 2 ? user.slice(0, 1) : `${user[0]}***${user[user.length - 1]}`;
  return `${visible}@${domain}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PLATFORM_NAMES: Record<string, string> = {
  psn: "PlayStation Network",
  xbl: "Xbox Network",
  nintendo: "Nintendo",
  steam: "Steam",
  github: "GitHub",
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  twitch: "Twitch",
  twitter: "X (Twitter)",
  lego: "LEGO",
  vk: "VK",
  epicgames: "Epic Games",
  EpicPC: "Epic Games (PC)",
  EpicAndroid: "Epic Games (Android)",
  PSN: "PlayStation",
  Live: "Xbox",
  Nintendo: "Nintendo",
  IOSAppStore: "App Store",
  GooglePlay: "Google Play",
  Samsung: "Samsung",
};

const PT_PLATFORMS: Record<string, string> = {
  EpicPCKorea: "Epic Games (PC Coreia)",
  Shared: "Compartilhado",
};

const EN_PLATFORMS: Record<string, string> = {
  EpicPCKorea: "Epic Games (PC Korea)",
  Shared: "Shared",
};

const PT_RARITIES: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
  exotic: "Exótico",
  transcendent: "Transcendente",
};

const PT_SERIES: Record<string, string> = {
  icon: "Ídolos",
  marvel: "MARVEL",
  dc: "DC",
  "star wars": "Star Wars",
  "gaming legends": "Lendas dos Games",
  dark: "Sombria",
  shadow: "Sombra",
  frozen: "Congelada",
  lava: "Lava",
  slurp: "Slurp",
  platform: "Plataforma",
};

// Tipos do fortnite-api (`outfit`, `backpack`…), traduzidos para a página.
const TYPES: Record<string, [pt: string, en: string]> = {
  outfit: ["Traje", "Outfit"],
  backpack: ["Mochila", "Back bling"],
  pickaxe: ["Picareta", "Pickaxe"],
  emote: ["Gesto", "Emote"],
  glider: ["Asa-delta", "Glider"],
  wrap: ["Envelopamento", "Wrap"],
  spray: ["Spray", "Spray"],
  banner: ["Estandarte", "Banner"],
  contrail: ["Rastro", "Contrail"],
  music: ["Música", "Music"],
  loadingscreen: ["Tela de carregamento", "Loading screen"],
  shoe: ["Calçados", "Kicks"],
  shoes: ["Calçados", "Kicks"],
  aura: ["Aura", "Aura"],
  emoji: ["Emoticon", "Emoticon"],
  toy: ["Brinquedo", "Toy"],
  pet: ["Mascote", "Pet"],
  petcarrier: ["Mascote", "Pet"],
};

/** Formatadores no idioma escolhido. */
export function createFormat(lang: Language) {
  const locale = lang === "pt-BR" ? "pt-BR" : "en-US";
  const pt = lang === "pt-BR";
  const numberFormat = new Intl.NumberFormat(locale);
  const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const timeFormat = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  let regionNames: Intl.DisplayNames | null = null;
  try {
    regionNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    regionNames = null;
  }
  const parse = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  return {
    /** Arredonda antes: contadores animados passam por valores fracionados. */
    number: (value: number | null | undefined) =>
      value == null || Number.isNaN(value) ? "—" : numberFormat.format(Math.round(value)),
    dateTime: (iso: string | null | undefined) => {
      if (!iso) return "—";
      const date = parse(iso);
      return date ? dateTimeFormat.format(date) : iso;
    },
    date: (iso: string | null | undefined) => {
      if (!iso) return "—";
      const date = parse(iso);
      return date ? dateFormat.format(date) : iso;
    },
    time: (date: Date = new Date()) => timeFormat.format(date),
    country: (code: string) => {
      try {
        return regionNames?.of(code.toUpperCase()) ?? code;
      } catch {
        return code;
      }
    },
    platform: (code: string | null | undefined) => {
      if (!code) return "—";
      const local = pt ? PT_PLATFORMS : EN_PLATFORMS;
      return local[code] ?? PLATFORM_NAMES[code] ?? PLATFORM_NAMES[code.toLowerCase()] ?? code;
    },
    /** A API manda raridade e série em inglês ("Epic", "Icon Series"). */
    rarity: (rarity: string) => {
      if (!pt) return rarity;
      const known = PT_RARITIES[rarity.toLowerCase()];
      if (known) return known;
      const series = rarity.match(/^(.+?)\s+series$/i);
      if (series) return `Série ${PT_SERIES[series[1].toLowerCase()] ?? series[1]}`;
      return rarity;
    },
    type: (type: string | null | undefined) => {
      if (!type) return "—";
      const entry = TYPES[type.toLowerCase()];
      return entry ? entry[pt ? 0 : 1] : type;
    },
    /** Nome do item no idioma; dados salvos antes do `name_pt` caem no inglês. */
    itemName: (item: { name: string; name_pt?: string }) => (pt ? item.name_pt || item.name : item.name),
  };
}

export type Format = ReturnType<typeof createFormat>;
