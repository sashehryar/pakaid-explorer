import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Downgrade react-compiler rules from error to warn.
  // The React Compiler is experimental in Next.js 16; its purity checks
  // (e.g. Date.now() calls flagged as impure) are optimization hints, not
  // correctness issues. Leaving them as errors silently breaks Vercel builds
  // while the local Turbopack build skips ESLint entirely.
  {
    rules: {
      "react-compiler/react-compiler": "warn",
    },
  },
]);

export default eslintConfig;
