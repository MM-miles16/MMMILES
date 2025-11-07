import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    extends: ["plugin:@next/next/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-undef": "off", // disable process/env warnings
    },
  },
]);
