declare module "culori" {
  export function converter(targetMode: string): (color: string | object) => any;
  export function formatHex(color: string | object): string;
  export function formatHex8(color: string | object): string;
  export function parse(color: string): any;
}
