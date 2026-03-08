declare module "path" {
  export function resolve(...paths: string[]): string;
}

interface ImportMeta {
  readonly dirname: string;
}
