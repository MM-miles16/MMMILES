import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      js,
      "@next/next": nextPlugin,
    },
    extends: [
      "eslint:recommended",
      "plugin:@next/next/recommended",
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    rules: {
      // Add any custom rules here if needed
    },
  },
]);
