import { Button as BaseButton, styled } from "@jjasonn.stone/design-system";
import type { ComponentProps } from "react";

// Export button styles for reuse
export const buttonStyles = {
  green: {
    bc: "$green3",
    color: "$green11",
    br: "$3",
    fontSize: "$3",
    "&:hover": { 
      bc: "$green4", 
      color: "$green11",
      opacity: 0.85,
      cursor: " pointer"
    }
  },
  danger: {
    bc: "$red4",
    color: "$red9",
    width: "100%",
    br: "$4",
    fontSize: "$4",
    "&:hover": {
      bc: "$red4",
      opacity: 0.85,
      color: "$red9",
      cursor: " pointer"
    },
  },
  gray: {
    bc: "$gray4",
    br: "$4",
    color: "$gray11",
    opacity: 0.50,
    "&:hover": {
      opacity: 0.60,
      color: "$gray11",
      bc: "$gray4",
      cursor: " pointer"
    },
  },  
} as const;

// Create a styled wrapper of the base button
const StyledButton = styled(BaseButton, {
  // Add any default styles that should apply to all buttons
  boxSizing: "border-box",
  fontWeight: 700,

  // Define variants
  variants: {
    color: {
      primary: {
        color: "$primary",
        bg: "$primary4",
        transition: "background-color .3s",
        "&:hover": {
          bg: "$primary5",
          transition: "background-color .3s",
        },
        "&:focus": {
          bg: "$primary5",
          boxShadow: "0 0 0 1px $primary5, inset 0 0 0 1px $primary5",
        },
      },
      secondary: {
        color: "$gray11",
        bg: "$gray4",
        "&:hover": {
          bg: "$gray5",
          transition: "background-color .3s",
        },
        "&:focus": {
          bg: "$gray5",
          boxShadow: "0 0 0 1px $colors$gray200, inset 0 0 0 1px $colors$gray200",
        },
      },
      green: buttonStyles.green,
      danger: buttonStyles.danger,
      gray: buttonStyles.gray
    },
    size: {
      1: { py: "$1" },
      2: { py: "$2" },
      3: { py: "$3" },
      4: { py: "$4" },
    },
    ghost: {
      true: {}
    },
    outline: {
      true: {
        color: "$primary",
        bg: "transparent",
        border: "1px solid",
        borderColor: "$primary",
      },
    },
    fullWidth: {
      true: {
        width: "100%",
      },
    },
  },
  
  // Compound variants for size-based styles
  compoundVariants: [
    {
      size: "1",
      css: {
        fontSize: "$1",
        br: "$1"
      }
    },
    {
      size: "2",
      css: {
        fontSize: "$2",
        br: "$2"
      }
    },
    {
      size: "3",
      css: {
        fontSize: "$3",
        br: "$3"
      }
    },
    {
      size: "4",
      css: {
        fontSize: "$4",
        br: "$4"
      }
    },
    {
      color: 'danger',
      ghost: 'true',
      css: {
        bc: 'transparent',
        color: '$red9',
        fontWeight: 600,
        '&:hover': {
          bc: '$red5',
          opacity: 0.75,
          boxShadow: 'none',
          cursor: 'pointer',
        },
        '&:active': {
          opacity: 0.95,
          bc: '$red5',
        }
      }
    },
    {
      color: 'primary',
      ghost: 'true',
      css: {
        bc: 'transparent',
        color: '$primary9',
        fontWeight: 600,
        '&:hover': {
          bc: '$primary3',
          boxShadow: 'none',
        },
        '&:active': {
          bc: '$primary4',
        }
      }
    },
    {
      color: 'secondary',
      ghost: 'true',
      css: {
        bc: 'transparent',
        color: '$gray11',
        fontWeight: 600,
        '&:hover': {
          bc: '$gray4',
          opacity: 0.60,
          boxShadow: 'none',
        },
        '&:active': {
          bc: '$gray5',
        }
      }
    }
  ],
  defaultVariants: {
    size: "1",
  },
});

// Export a type that includes both base props and our custom props
export type ButtonProps = ComponentProps<typeof StyledButton>;

// Export the final button component
export const Button = StyledButton;

export default Button;
