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

export type SectionId = "conta" | "seguranca" | "conexoes" | "vbucks" | "estatisticas" | "equipados" | "armario" | "imagens";

type NavItem = { id: SectionId; icon: LucideIcon };

// Rótulos ficam em messages.ts (t.nav[id] e t.nav[group]).
export const NAV_GROUPS: { group: "groupAccount" | "groupFortnite"; items: NavItem[] }[] = [
  {
    group: "groupAccount",
    items: [
      { id: "conta", icon: User },
      { id: "seguranca", icon: ShieldCheck },
      { id: "conexoes", icon: Link2 },
    ],
  },
  {
    group: "groupFortnite",
    items: [
      { id: "vbucks", icon: Coins },
      { id: "estatisticas", icon: BarChart3 },
      { id: "equipados", icon: Shirt },
      { id: "armario", icon: Package },
      { id: "imagens", icon: ImageIcon },
    ],
  },
];

export const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function readHash(): SectionId {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return ALL_ITEMS.some((i) => i.id === hash) ? (hash as SectionId) : "conta";
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
