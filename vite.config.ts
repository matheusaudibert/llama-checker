import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

const LLAMA_API_URL = "https://llamaapi.audibert.dev";

export default defineConfig(({ mode }) => {
  // Sem prefixo VITE_: a chave só existe no servidor de dev e nunca entra no bundle.
  const env = loadEnv(mode, process.cwd(), "");

  const proxy: Record<string, ProxyOptions> = {
    "/api": {
      target: LLAMA_API_URL,
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/api/, ""),
      headers: { "X-API-Key": env.LLAMA_API_KEY ?? "" },
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
    server: { proxy },
    preview: { proxy },
  };
});
