/// <reference types="vite/client" />

declare module 'papaparse' {
  export interface ParseConfig {
    download?: boolean;
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: any) => void;
    error?: (error: any) => void;
  }

  export function parse(input: string | File, config?: ParseConfig): void;
}
