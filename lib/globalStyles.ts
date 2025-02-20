import { globalCss } from "@livepeer/design-system";

export const globalStyles = globalCss({
  "*, *::before, *::after": {
    boxSizing: "border-box",
  },

  body: {
    backgroundColor: "$loContrast",
    margin: 0,
    color: "$hiContrast",
    fontFamily: "$body",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    WebkitTextSizeAdjust: "100%",
  },

  svg: {
    display: "block",
    verticalAlign: "middle",
  },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },
});
