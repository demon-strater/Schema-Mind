import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "client/**", "server/**", "shared/**", "script/**", "phase0-scaffold/**", "drizzle.config.ts", "vite.config.ts", "tailwind.config.ts", "test-openai.ts", "next-env.d.ts"]),
]);
