/// <reference types="vite/client" />

// Type declaration for styled-jsx
declare namespace JSX {
  interface IntrinsicElements {
    style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement> & {
      jsx?: boolean;
      global?: boolean;
    };
  }
}
