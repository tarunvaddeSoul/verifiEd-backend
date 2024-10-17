declare module "turl" {
    export function shorten(url: string): Promise<string>;
    export function expand(shortUrl: string): Promise<string>;
  }
  