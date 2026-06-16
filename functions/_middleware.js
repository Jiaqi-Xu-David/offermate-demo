const STATIC_ASSET_PATTERN =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|mjs|png|svg|txt|webmanifest|webp|woff2?)$/i;
const PRIVATE_FILE_PATTERN = /^\/(?:db|functions|tests|src\/backend)\//i;
const PRIVATE_ROOT_FILES = new Set(['/package.json', '/README.md', '/wrangler.toml']);

function cleanHeader(value, maxLength = 500) {
  return (value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0];
  return cleanHeader(request.headers.get('cf-connecting-ip') ?? forwarded ?? '', 80);
}

function detectDevice(userAgent) {
  const source = userAgent.toLowerCase();
  if (/ipad|tablet/.test(source)) return 'tablet';
  if (/mobile|iphone|android/.test(source)) return 'mobile';
  if (/bot|crawler|spider|preview/.test(source)) return 'bot';
  return 'desktop';
}

function detectBrowser(userAgent) {
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/chrome|crios/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return 'Safari';
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
  if (/bot|crawler|spider|preview/i.test(userAgent)) return 'Bot';
  return 'Other';
}

function detectOS(userAgent) {
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Other';
}

function shouldLogVisit(request, url) {
  if (request.method !== 'GET') return false;
  if (url.pathname.startsWith('/admin/')) return false;
  if (STATIC_ASSET_PATTERN.test(url.pathname)) return false;

  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html');
}

async function recordVisit(context, response) {
  const { request, env } = context;
  if (!env.VISITS_DB) return;

  const url = new URL(request.url);
  if (!shouldLogVisit(request, url)) return;

  const userAgent = cleanHeader(request.headers.get('user-agent'), 700);
  const cf = request.cf ?? {};

  await env.VISITS_DB.prepare(`
    INSERT INTO visit_logs (
      visited_at,
      method,
      host,
      path,
      query_present,
      ip,
      country,
      region,
      city,
      timezone,
      colo,
      as_organization,
      device_type,
      browser_family,
      os_family,
      user_agent,
      referer,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      new Date().toISOString(),
      request.method,
      cleanHeader(url.host, 140),
      cleanHeader(url.pathname, 240),
      url.search ? 1 : 0,
      getClientIp(request),
      cleanHeader(cf.country, 12),
      cleanHeader(cf.region, 120),
      cleanHeader(cf.city, 120),
      cleanHeader(cf.timezone, 120),
      cleanHeader(cf.colo, 12),
      cleanHeader(cf.asOrganization, 180),
      detectDevice(userAgent),
      detectBrowser(userAgent),
      detectOS(userAgent),
      userAgent,
      cleanHeader(request.headers.get('referer'), 500),
      response.status,
    )
    .run();
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (PRIVATE_FILE_PATTERN.test(url.pathname) || PRIVATE_ROOT_FILES.has(url.pathname)) {
    return new Response('Not found', { status: 404 });
  }

  const response = await context.next();
  const logging = recordVisit(context, response).catch((error) => {
    console.error('visit log failed', error);
  });

  if (typeof context.waitUntil === 'function') {
    context.waitUntil(logging);
  } else {
    await logging;
  }

  return response;
}
