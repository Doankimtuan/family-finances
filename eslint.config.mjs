import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-console": ["error", { allow: ["error"] }],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // BR-24 / AC-HLT-01 — Health leaf context must stay compute-on-read.
    files: ["modules/health/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/modules/platform/supabase/server",
              message:
                "Health-RO (BR-24): do not open a Supabase client from Health. Read via ledger/plan/inbox queries.",
            },
            {
              name: "@/modules/platform/supabase/browser",
              message:
                "Health-RO (BR-24): do not open a browser Supabase client from Health.",
            },
            {
              name: "@/modules/platform/supabase/admin",
              message:
                "Health-RO (BR-24): admin client is forbidden in Health.",
            },
            {
              name: "@/modules/platform/supabase/route-handler",
              message:
                "Health-RO (BR-24): route-handler client is forbidden in Health.",
            },
          ],
          patterns: [
            {
              group: ["**/modules/ledger/application/commands/**"],
              message:
                "Health-RO (BR-24): do not import ledger commands from Health.",
            },
            {
              group: ["**/modules/plan/application/commands/**"],
              message:
                "Health-RO (BR-24): do not import plan commands from Health.",
            },
            {
              group: ["**/modules/inbox/application/commands/**"],
              message:
                "Health-RO (BR-24): do not import inbox commands from Health.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(insert|update|upsert|delete|rpc)$/]",
          message:
            "Health-RO (BR-24): write/RPC calls are forbidden in modules/health (AC-HLT-01).",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "artifacts/**",
    "node_modules/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
