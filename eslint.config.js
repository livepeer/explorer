import js from "@eslint/js";
import eslintPluginTypescript from "@typescript-eslint/eslint-plugin";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginImport from "eslint-plugin-import";
import eslintConfigAirbnbTypescript from "eslint-config-airbnb-typescript";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import * as parser from "@typescript-eslint/parser"

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": eslintPluginTypescript,
      "jsx-a11y": eslintPluginJsxA11y,
      "import": eslintPluginImport,
      "react": eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
    },
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        NodeJS: "readonly",
        process: "readonly",
        document: "readonly",
        window: "readonly",
        fetch: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        require: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintConfigAirbnbTypescript.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "warn",
      "react/display-name": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal"],
          "newlines-between": "always",
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
