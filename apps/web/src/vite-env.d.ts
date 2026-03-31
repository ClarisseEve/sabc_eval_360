/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: Record<string, string>;
  readonly glob: (pattern: string) => Record<string, () => Promise<any>>;
}
