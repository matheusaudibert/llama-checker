import {
  BarChart3,
  Coins,
  Image as ImageIcon,
  Link2,
  Package,
  Shirt,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

export type SectionId = "account" | "security" | "connections" | "vbucks" | "stats" | "equipped" | "locker" | "images";

type NavItem = { id: SectionId; icon: LucideIcon; iconClass?: string };

const FORTNITE_ICON = "text-[#7371FF]";

// Rótulos ficam em messages.ts (t.nav[id] e t.nav[group]).
export const NAV_GROUPS: { group: "groupAccount" | "groupFortnite"; items: NavItem[] }[] = [
  {
    group: "groupAccount",
    items: [
      { id: "account", icon: User },
      { id: "security", icon: ShieldCheck },
      { id: "connections", icon: Link2 },
    ],
  },
  {
    group: "groupFortnite",
    items: [
      { id: "vbucks", icon: Coins, iconClass: FORTNITE_ICON },
      { id: "stats", icon: BarChart3, iconClass: FORTNITE_ICON },
      { id: "equipped", icon: Shirt, iconClass: FORTNITE_ICON },
      { id: "locker", icon: Package, iconClass: FORTNITE_ICON },
      { id: "images", icon: ImageIcon, iconClass: FORTNITE_ICON },
    ],
  },
];

export const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function readHash(): SectionId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return ALL_ITEMS.some((i) => i.id === hash) ? (hash as SectionId) : "account";
}

/** Seção ativa guardada no hash, para sobreviver ao recarregar. */
export function useSectionRoute() {
  const [section, setSection] = useState<SectionId>(readHash);
  useEffect(() => {
    const onHash = () => setSection(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (id: SectionId) => {
    if (id !== section) window.location.hash = `/${id}`;
    window.scrollTo({ top: 0 });
  };
  return [section, navigate] as const;
}
