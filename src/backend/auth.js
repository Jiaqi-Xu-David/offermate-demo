const SESSION_COOKIE = 'om_session';

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
  if (!Number.isFinite(parsed)) return 60 * 60 * 24 * 7;
  return Math.max(0, Math.floor(parsed));
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

export async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function verifyPassword(password, salt, expectedHash) {
  return safeEqual(await hashPassword(password, salt), expectedHash);
}

export function parseCookieHeader(header = '') {
  return splitCookieHeader(header).reduce((cookies, part) => {
      const splitAt = part.indexOf('=');
      const name = (splitAt === -1 ? part : part.slice(0, splitAt)).trim();
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

export function createSessionCookie(token, requestUrl, maxAgeSeconds = 60 * 60 * 24 * 7) {
  const normalizedMaxAge = normalizeCookieMaxAge(maxAgeSeconds);
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=${normalizedMaxAge}; Expires=${buildCookieExpiry(normalizedMaxAge)}${secure}`;
}

export function clearSessionCookie(requestUrl) {
  const secure = new URL(requestUrl).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Priority=High; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}
