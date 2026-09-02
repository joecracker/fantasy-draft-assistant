// Minimal ambient types for Cloudflare Pages Functions so `tsc` understands them
// without pulling in @cloudflare/workers-types. Cloudflare's own build tooling
// provides these at deploy time; this just keeps local type-checking happy.

declare global {
  interface PagesFunction<E = Record<string, unknown>> {
    (context: {
      request: Request;
      env: E;
      params: Record<string, string | string[] | undefined>;
      data: Record<string, unknown>;
      next: () => Promise<Response>;
      functionPath: string;
      waitUntil: (promise: Promise<unknown>) => void;
      cf: unknown;
    }): Promise<Response> | Response;
  }
}

export {};