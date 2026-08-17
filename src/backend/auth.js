const SESSION_COOKIE = 'om_session';
const PASSWORD_HASH_VERSION = 'pbkdf2-sha256';
const PASSWORD_HASH_ITERATIONS = 120_000;
const MAX_PASSWORD_HASH_ITERATIONS = 1_000_000;
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MAX_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function safeDecodeCookieValue(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function splitCookieHeader(header = '') {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < header.length; index += 1) {
    const char = header[index];
    if (char === '"' && header[index - 1] !== '\\') inQuotes = !inQuotes;
    if (char === ';' && !inQuotes) {
      const part = current.trim();
      if (part) parts.push(part);
      current = '';
      continue;
    }
    current += char;
  }

  const finalPart = current.trim();
  if (finalPart) parts.push(finalPart);
  return parts;
}

function normalizeCookieValue(value) {
  const decoded = safeDecodeCookieValue(value).trim();
  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    return decoded
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  return decoded;
}

function buildCookieExpiry(maxAgeSeconds) {
  return new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
}

function normalizeCookieMaxAge(maxAgeSeconds) {
  const parsed = Number(maxAgeSeconds);
  if (!Number.isFinite(parsed)) return DEFAULT_SESSION_MAX_AGE_SECONDS;
  return Math.min(MAX_SESSION_MAX_AGE_SECONDS, Math.max(0, Math.floor(parsed)));
}

export function getSessionMaxAgeSeconds(env = {}) {
  const configured = env.SESSION_MAX_AGE_SECONDS ?? env.OFFERMATE_SESSION_MAX_AGE_SECONDS;
  const parsed = Number(configured);
  if (!Number.isFinite(parsed)) return DEFAULT_SESSION_MAX_AGE_SECONDS;
  return Math.min(MAX_SESSION_MAX_AGE_SECONDS, Math.max(60 * 60, Math.floor(parsed)));
}

function isSecureRequestUrl(requestUrl) {
  try {
    return new URL(requestUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left, right) {
  if (!left || !right) return false;
  let mismatch = left.length === right.length ? 0 : 1;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

async function hashLegacyPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

async function derivePasswordHash(password, salt, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(password ?? '')),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(String(salt ?? '')),
      iterations,
    },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export async function hashPassword(password, salt) {
  const digest = await derivePasswordHash(password, salt, PASSWORD_HASH_ITERATIONS);
  return `${PASSWORD_HASH_VERSION}$${PASSWORD_HASH_ITERATIONS}$${digest}`;
}

export async function verifyPassword(password, salt, expectedHash) {
  const storedHash = String(expectedHash ?? '');
  const versionedMatch = storedHash.match(/^pbkdf2-sha256\$(\d+)\$([a-f0-9]{64})$/i);
  if (versionedMatch) {
    const iterations = Number(versionedMatch[1]);
    if (!Number.isSafeInteger(iterations) || iterations < 10_000 || iterations > MAX_PASSWORD_HASH_ITERATIONS) {
      return false;
    }
    return safeEqual(
      await derivePasswordHash(password, salt, iterations),
      versionedMatch[2].toLowerCase(),
    );
  }
  return safeEqual(await hashLegacyPassword(password, salt), storedHash);
}

export function parseCookieHeader(header = '') {
  return splitCookieHeader(header).reduce((cookies, part) => {
      const splitAt = part.indexOf('=');
      const name = (splitAt === -1 ? part : part.slice(0, splitAt)).trim().replace(/^,\s*/, '');
      if (!name) return cookies;
      if (name in cookies) return cookies;
      cookies[name] = splitAt === -1 ? '' : normalizeCookieValue(part.slice(splitAt + 1));
      return cookies;
    }, {});
}

export function getSessionToken(request) {
  return parseCookieHeader(request.headers.get('cookie') ?? '')[SESSION_COOKIE] ?? '';
}

export function createSessionToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function createSessionCookie(token, requestUrl, maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS) {
  const normalizedMaxAge = normalizeCookieMaxAge(maxAgeSeconds);
  const secure = isSecureRequestUrl(requestUrl) ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=${normalizedMaxAge}; Expires=${buildCookieExpiry(normalizedMaxAge)}${secure}`;
}

export function clearSessionCookie(requestUrl) {
  const secure = isSecureRequestUrl(requestUrl) ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}
