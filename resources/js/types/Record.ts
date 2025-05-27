export interface Record<K extends string | number | symbol = string, T = any> {
  [key: string]: T;
}
