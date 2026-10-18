import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "src/lib/llama-api.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
  },
  {
    // Componentes copiados do beUI: não mexemos na estrutura interna deles.
    files: ["src/components/motion/**"],
    rules: { "react-refresh/only-export-components": "off", "react-hooks/exhaustive-deps": "off", "@typescript-eslint/no-empty-object-type": "off", "@typescript-eslint/no-unused-vars": "off", "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off", "react-hooks/immutability": "off" },
  },
]);
