import { styled } from "@livepeer/design-system";

const AppBar = styled("div", {
  boxSizing: "border-box",
  zIndex: "1",

  variants: {
    size: {
      1: {
        py: "$1",
      },
      2: {
        py: "$2",
      },
      3: {
        py: "$3",
      },
    },
    sticky: {
      true: {
        position: "sticky",
        width: "100%",
        top: 0,
        left: 0,
      },
    },
    glass: {
      true: {
        backdropFilter: "blur(12px) saturate(160%)",
      },
    },
    border: {
      true: {
        borderBottom: "1px solid",
      },
    },
    color: {
      loContrast: {
        backgroundColor: "$loContrast",
      },
      neutral: {
        backgroundColor: "$neutral2",
      },
      primary: {
        backgroundColor: "$primary9",
      },
    },
  },
  compoundVariants: [
    {
      glass: "true",
      color: "neutral",
      css: {
        opacity: ".9",
      },
    },
    {
      glass: "true",
      color: "primary",
      css: {
        opacity: ".9",
      },
    },
    {
      glass: "true",
      color: "loContrast",
      css: {
        opacity: ".9",
      },
    },
    {
      border: "true",
      color: "neutral",
      css: {
        borderColor: "$neutral4",
      },
    },
    {
      border: "true",
      color: "primary",
      css: {
        borderColor: "$primary11",
      },
    },
    {
      border: "true",
      color: "loContrast",
      css: {
        borderColor: "$neutral4",
      },
    },
  ],
  defaultVariants: {
    size: "1",
    color: "loContrast",
  },
});

export default AppBar;
