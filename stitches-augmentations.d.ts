// stitches-augmentations.d.ts
//
// This file augments the design system's typing for Stitches utilities and the Button component
// to allow raw string/number spacing values and to extend the allowed Button variant.
// Additionally, it adjusts the DefaultThemeMap to allow raw values for spacing-related CSS properties by
// overriding their types to "any", so that values like "10px" or "1rem" are acceptable without
// requiring a theme token lookup.
// Finally, it augments the CSSProperties interface to accept string or number values directly.

import '@stitches/react';

declare module '@stitches/react' {
  // Override PropertyValue globally to allow string or number.
  export type PropertyValue<T> = string | number;

  // Augment the utility functions to directly accept string/number values.
  export namespace utils {
    export function m(value: string | number): { margin: string | number };
    export function mt(value: string | number): { marginTop: string | number };
    export function mr(value: string | number): { marginRight: string | number };
    export function mb(value: string | number): { marginBottom: string | number };
    export function ml(value: string | number): { marginLeft: string | number };
    export function mx(value: string | number): { marginLeft: string | number; marginRight: string | number };
    export function my(value: string | number): { marginTop: string | number; marginBottom: string | number };

    export function p(value: string | number): { padding: string | number };
    export function pt(value: string | number): { paddingTop: string | number };
    export function pr(value: string | number): { paddingRight: string | number };
    export function pb(value: string | number): { paddingBottom: string | number };
    export function pl(value: string | number): { paddingLeft: string | number };
    export function px(value: string | number): { paddingLeft: string | number; paddingRight: string | number };
    export function py(value: string | number): { paddingTop: string | number; paddingBottom: string | number };
  }

  // Augment CSSProperties to allow direct string or number values for spacing.
  export interface CSSProperties {
    margin?: string | number;
    marginTop?: string | number;
    marginBottom?: string | number;
    marginLeft?: string | number;
    marginRight?: string | number;
    padding?: string | number;
    paddingTop?: string | number;
    paddingBottom?: string | number;
    paddingLeft?: string | number;
    paddingRight?: string | number;
  }

  // Override the DefaultThemeMap to allow raw spacing values.
  // By setting the type to "any", we disable token lookup and allow raw values.
  export interface DefaultThemeMap {
    margin: any;
    marginTop: any;
    marginBottom: any;
    marginLeft: any;
    marginRight: any;
    padding: any;
    paddingTop: any;
    paddingBottom: any;
    paddingLeft: any;
    paddingRight: any;
  }
}

declare module '@stitches/react/types/css-util' {
  // Override the PropertyValue type used in CSS utilities.
  export type PropertyValue<T> = string | number;
}

// Augment the Button component's allowed variant values.
// This module corresponds to the design system's Button component.
declare module '@livepeer/design-system/dist/components/Button' {
  // Extend the union to include the "transparentWhite" variant.
  export type ButtonVariantUnion =
    | 'red'
    | 'crimson'
    | 'pink'
    | 'purple'
    | 'violet'
    | 'indigo'
    | 'blue'
    | 'cyan'
    | 'teal'
    | 'green'
    | 'lime'
    | 'yellow'
    | 'orange'
    | 'gray'
    | 'primary'
    | 'neutral'
    | 'tomato'
    | 'plum'
    | 'transparentWhite';

  // Merge this into the ButtonProps interface.
  export interface ButtonProps {
    variant?: ButtonVariantUnion;
  }
}
