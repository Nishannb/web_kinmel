import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendBase(): string {
  return (
    process.env.KINMEL_BACKEND_PROXY_TARGET?.replace(/\/+$/, "") ||
    "http://127.0.0.1:8080"
  );
}

const HOP_BY_HOP = new Set(
  "connection keep-alive proxy-authenticate proxy-authorization te trailers upgrade host transfer-encoding content-length".split(
    " "
  )
);

function targetUrl(path: string[] | undefined, search: string): string {
  const base = backendBase().replace(/\/+$/, "");
  const segments = path?.filter(Boolean) ?? [];
  const pathPart = segments.length ? `/${segments.join("/")}` : "";
  return `${base}${pathPart}${search}`;
}

async function proxy(request: NextRequest, path: string[] | undefined) {
  const incoming = new URL(request.url);
  const url = targetUrl(path, incoming.search);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: `Cannot reach Kinmel API at ${backendBase()}. Start Flask (e.g. python main.py) or set KINMEL_BACKEND_PROXY_TARGET. (${msg})`,
        code: "backend_unreachable",
      },
      { status: 502 }
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function HEAD(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
