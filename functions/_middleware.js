import { encryptText } from '../src/backend/secure-data.js';

const STATIC_ASSET_PATTERN =
  /\.(?:avif|css|gif|ico|jpeg|jpg|js|json|map|mjs|png|svg|txt|webmanifest|webp|woff2?)$/i;
const PRIVATE_FILE_PATTERN = /^\/(?:db|functions|tests|src\/backend)\//i;
const PRIVATE_ROOT_FILES = new Set(['/package.json', '/README.md', '/wrangler.toml']);
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
].join('; ');

function withBrowserSecurityHeaders(response) {
  const securedResponse = new Response(response.body, response);
  securedResponse.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  securedResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  securedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  securedResponse.headers.set('X-Content-Type-Options', 'nosniff');
  securedResponse.headers.set('X-Frame-Options', 'DENY');
  return securedResponse;
}

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

let visitLogSchemaReady = false;

async function ensureVisitLogEncryptionColumn(env) {
  const columns = await env.VISITS_DB.prepare('PRAGMA table_info(visit_logs)').all();
  const names = new Set((columns.results ?? []).map((column) => column.name));
  if (!names.has('visitor_cipher')) {
    await env.VISITS_DB.prepare('ALTER TABLE visit_logs ADD COLUMN visitor_cipher TEXT').run();
  }
}

async function migratePlainVisitLogs(env) {
  const rows = await env.VISITS_DB.prepare(`
    SELECT id, ip, visitor_cipher, country, region, city, timezone, colo, as_organization, user_agent, referer
    FROM visit_logs
    WHERE visitor_cipher IS NULL OR visitor_cipher = ''
    LIMIT 100
  `).all();

  for (const row of rows.results ?? []) {
    const payload = {
      ip: row.ip === '[encrypted]' ? '' : row.ip,
      country: row.country,
      region: row.region,
      city: row.city,
      timezone: row.timezone,
      colo: row.colo,
      asOrganization: row.as_organization,
      userAgent: row.user_agent === '[encrypted]' ? '' : row.user_agent,
      referer: row.referer,
    };
    await env.VISITS_DB.prepare(`
      UPDATE visit_logs
      SET ip = '[encrypted]',
          visitor_cipher = ?,
          country = NULL,
          region = NULL,
          city = NULL,
          timezone = NULL,
          colo = NULL,
          as_organization = NULL,
          user_agent = '[encrypted]',
          referer = NULL
      WHERE id = ?
    `)
      .bind(await encryptText(env, JSON.stringify(payload)), row.id)
      .run();
  }
}

async function ensureVisitLogSchema(env) {
  if (visitLogSchemaReady || !env.VISITS_DB) return;

  await env.VISITS_DB.prepare(`
    CREATE TABLE IF NOT EXISTS visit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visited_at TEXT NOT NULL,
      method TEXT NOT NULL,
      host TEXT NOT NULL,
      path TEXT NOT NULL,
      query_present INTEGER NOT NULL DEFAULT 0,
      ip TEXT NOT NULL,
      visitor_cipher TEXT,
      country TEXT,
      region TEXT,
      city TEXT,
      timezone TEXT,
      colo TEXT,
      as_organization TEXT,
      device_type TEXT,
      browser_family TEXT,
      os_family TEXT,
      user_agent TEXT,
      referer TEXT,
      status INTEGER
    )
  `).run();
  await ensureVisitLogEncryptionColumn(env);
  await migratePlainVisitLogs(env);
  await env.VISITS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_at ON visit_logs (visited_at DESC)').run();
  await env.VISITS_DB.prepare('CREATE INDEX IF NOT EXISTS idx_visit_logs_path ON visit_logs (path)').run();
  visitLogSchemaReady = true;
}

async function recordVisit(context, response) {
  const { request, env } = context;
  if (!env.VISITS_DB) return;

  const url = new URL(request.url);
  if (!shouldLogVisit(request, url)) return;

  const userAgent = cleanHeader(request.headers.get('user-agent'), 700);
  const cf = request.cf ?? {};
  const visitorPayload = {
    ip: getClientIp(request),
    country: cleanHeader(cf.country, 12),
    region: cleanHeader(cf.region, 120),
    city: cleanHeader(cf.city, 120),
    timezone: cleanHeader(cf.timezone, 120),
    colo: cleanHeader(cf.colo, 12),
    asOrganization: cleanHeader(cf.asOrganization, 180),
    userAgent,
    referer: cleanHeader(request.headers.get('referer'), 500),
  };

  await ensureVisitLogSchema(env);
  await env.VISITS_DB.prepare(`
    INSERT INTO visit_logs (
      visited_at,
      method,
      host,
      path,
      query_present,
      ip,
      visitor_cipher,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      new Date().toISOString(),
      request.method,
      cleanHeader(url.host, 140),
      cleanHeader(url.pathname, 240),
      url.search ? 1 : 0,
      '[encrypted]',
      await encryptText(env, JSON.stringify(visitorPayload)),
      null,
      null,
      null,
      null,
      null,
      null,
      detectDevice(userAgent),
      detectBrowser(userAgent),
      detectOS(userAgent),
      '[encrypted]',
      null,
      response.status,
    )
    .run();
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (PRIVATE_FILE_PATTERN.test(url.pathname) || PRIVATE_ROOT_FILES.has(url.pathname)) {
    return withBrowserSecurityHeaders(new Response('Not found', { status: 404 }));
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

  return withBrowserSecurityHeaders(response);
}
