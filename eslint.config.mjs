import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "dist/**"],
  },
  ...nextCoreWebVitals,
];
