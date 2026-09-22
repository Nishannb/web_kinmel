import {NextRequest, NextResponse} from 'next/server';

/**
 * TikTok Developer Portal redirect is locked to:
 *   https://kinmel.shop/auth/tiktok/callback
 * while the Flask OAuth handler lives on the API host.
 *
 * This route proxies the browser callback (code + state) to the API so we do
 * not need a new TikTok portal review. Token exchange stays server-side.
 *
 * Override target with TIKTOK_OAUTH_CALLBACK_PROXY_TARGET if needed.
 */
export const dynamic = 'force-dynamic';

const HOP_BY_HOP = new Set(
  'connection keep-alive proxy-authenticate proxy-authorization te trailers upgrade host transfer-encoding content-length'.split(
    ' ',
  ),
);

function upstreamCallbackUrl(): string {
  const raw =
    process.env.TIKTOK_OAUTH_CALLBACK_PROXY_TARGET?.trim() ||
    'https://api.kinmel.shop/auth/tiktok/callback';
  return raw.replace(/\/+$/, '');
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  const url = `${upstreamCallbackUrl()}${incoming.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) {
      return;
    }
    headers.set(key, value);
  });

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(
      `<!doctype html><html><body><p>TikTok connect failed (proxy unreachable). ${msg}</p></body></html>`,
      {
        status: 502,
        headers: {'Content-Type': 'text/html; charset=utf-8'},
      },
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) {
      return;
    }
    out.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
