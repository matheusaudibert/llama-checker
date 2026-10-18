import type { VercelRequest, VercelResponse } from "@vercel/node";

const LLAMA_API_URL = "https://llamaapi.audibert.dev";

// Repassa /api/* para a Llama API com a chave do servidor. A API não tem CORS,
// então o front só fala com esta função. O vercel.json reescreve /api/<rota>
// para /api/proxy?path=<rota>: nome de arquivo catch-all ([...path]) só
// funciona na Vercel em projetos Next.js.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.LLAMA_API_KEY;
  if (!apiKey) {
    res.status(500).json({ detail: "LLAMA_API_KEY não configurada no servidor." });
    return;
  }

  const raw = req.query.path;
  const path = (Array.isArray(raw) ? raw.join("/") : (raw ?? "")).split("/").filter(Boolean);
  if (path.length === 0) {
    res.status(404).json({ detail: "Not Found" });
    return;
  }
  // Repassa os outros parâmetros da query, sem o "path" da reescrita.
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    for (const v of Array.isArray(value) ? value : [value]) search.append(key, v);
  }
  const query = search.toString();
  const target = `${LLAMA_API_URL}/${path.map(encodeURIComponent).join("/")}${query ? `?${query}` : ""}`;

  const hasBody = req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined;
  // Os corpos que o front manda são sempre JSON (texto). Buffer vira string,
  // porque o tipo BodyInit do fetch (lib DOM, usada pela Vercel) não aceita Buffer.
  const body: string | undefined = !hasBody
    ? undefined
    : typeof req.body === "string"
      ? req.body
      : Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : JSON.stringify(req.body);

  const upstream = await fetch(target, {
    method: req.method,
    headers: {
      "X-API-Key": apiKey,
      ...(hasBody ? { "Content-Type": req.headers["content-type"] ?? "application/json" } : {}),
    },
    body,
  });

  res.status(upstream.status);
  const contentType = upstream.headers.get("content-type");
  if (contentType) res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  if (upstream.status === 204) {
    res.end();
    return;
  }
  res.send(Buffer.from(await upstream.arrayBuffer()));
}
