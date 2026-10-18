import type { components } from "@/lib/llama-api";

type Schemas = components["schemas"];

export type DeviceLogin = Schemas["DeviceLoginResponse"];
export type LoginStatus = Schemas["LoginStatusResponse"];
export type AccountSummary = Schemas["AccountSummary"];
export type ExternalAuth = Schemas["ExternalAuth"];
export type Season = Schemas["PastSeason"];
export type Locker = Schemas["Locker"];
export type LockerCounts = Schemas["LockerCounts"];
export type Cosmetic = Schemas["Cosmetic"];
export type CosmeticImages = Schemas["CosmeticImages"];

export type Equipped = Schemas["Equipped"];
export type EquippedCosmetic = Schemas["EquippedCosmetic"];
export type Language = Schemas["RenderRequest"]["language"];

export type LockerCategory = keyof LockerCounts;
export type RenderCategory = "skins" | "backpacks" | "pickaxes" | "gliders" | "emotes" | "mythics";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  /** A sessão sumiu (404) ou o token da Epic venceu (410). */
  get sessionGone() {
    return this.status === 404 || this.status === 410;
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    // status 0: sem conexão; a interface traduz a mensagem.
    throw new ApiError(0, "network");
  }
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // corpo vazio ou não JSON
    }
    throw new ApiError(res.status, detail);
  }
  return res;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request(path, init)).json() as Promise<T>;
}

const enc = encodeURIComponent;

export const api = {
  startLogin: () => json<DeviceLogin>("/auth/device", { method: "POST" }),
  loginStatus: (id: string) => json<LoginStatus>(`/auth/${enc(id)}`),
  endSession: async (id: string) => {
    await request(`/auth/${enc(id)}`, { method: "DELETE" });
  },
  summary: (id: string) => json<AccountSummary>(`/accounts/${enc(id)}/summary`),
  locker: (id: string) => json<Locker>(`/accounts/${enc(id)}/locker`),
  equipped: (id: string) => json<Equipped>(`/accounts/${enc(id)}/equipped`),
  render: async (
    category: RenderCategory,
    displayName: string,
    items: { id: string; owned_styles: string[] }[],
    language: Language,
  ) => {
    const res = await request(`/render/${category}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName.slice(0, 64), language, items: items.slice(0, 5000) }),
    });
    return res.blob();
  },
};
