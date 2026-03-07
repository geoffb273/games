/**
 * Cloudflare Worker: proxies all traffic to the Game Brain backend (EC2).
 * Set secret EC2_ORIGIN_URL = http://<elastic-ip>:4000 in Cloudflare dashboard or wrangler.
 */

export interface Env {
  EC2_ORIGIN_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const originUrl = env.EC2_ORIGIN_URL;
    if (!originUrl) {
      return new Response('EC2_ORIGIN_URL not configured', { status: 502 });
    }

    const url = new URL(request.url);
    const targetUrl = `${originUrl.replace(/\/$/, '')}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    // Drop host so the origin sees the request correctly (optional)
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.set('Host', new URL(originUrl).host);

    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    if (request.headers.get('Origin')) {
      responseHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin')!);
    }
    responseHeaders.set('Vary', 'Origin');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  },
};
