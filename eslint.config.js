import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/dist", "**/eslint.config.js"],
  },

  ...tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
  ),
  // reactHooks.configs['recommended-latest'],

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parser: tsParser,
      parserOptions: {
        project: true,
        // tsconfigRootDir: __dirname,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      "react-refresh": reactRefresh,
    },

    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        }
      ],
    },
  }
];
