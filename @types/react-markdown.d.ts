declare module 'react-markdown' {
    import { ReactNode, ComponentType } from 'react';
    import { ElementType } from 'react';
  
    export interface NormalComponents {
      [key: string]: ElementType;
    }
  
    export interface SpecialComponents {
      text?: ElementType<{ children: string }>;
    }
  
    export interface Components extends NormalComponents, SpecialComponents {}
  
    export interface Options {
      children: string;
      components?: Partial<Components>;
      [key: string]: any;
    }
  
    declare const ReactMarkdown: ComponentType<Options>;
    export default ReactMarkdown;
  }
  