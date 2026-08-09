const ENCRYPTED_PREFIX = 'enc:v1:';

function getCrypto() {
  if (globalThis.crypto?.subtle) return globalThis.crypto;
  throw new Error('Web Crypto is not available in this runtime');
}

function getSecret(env = {}) {
  const configured = env.OFFERMATE_ENCRYPTION_KEY ?? env.APP_ENCRYPTION_KEY ?? env.PII_ENCRYPTION_KEY;
  const environment = String(env.OFFERMATE_ENV ?? env.ENVIRONMENT ?? '').trim().toLowerCase();
  if (environment === 'production' && (!configured || String(configured).length < 32)) {
    throw new Error('Production requires OFFERMATE_ENCRYPTION_KEY with at least 32 characters');
  }
  return String(configured ?? 'offermate-local-development-encryption-key');
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(value) {
  if (typeof atob === 'function') {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(value, 'base64'));
}

async function deriveAesKey(env) {
  const cryptoImpl = getCrypto();
  const material = new TextEncoder().encode(getSecret(env));
  const digest = await cryptoImpl.subtle.digest('SHA-256', material);
  return cryptoImpl.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export function normalizeLookup(value) {
  return String(value ?? '').trim().toLowerCase();
}

export async function hashLookup(value) {
  const digest = await getCrypto().subtle.digest('SHA-256', new TextEncoder().encode(normalizeLookup(value)));
  return bytesToHex(new Uint8Array(digest));
}

export function isEncryptedText(value) {
  return String(value ?? '').startsWith(ENCRYPTED_PREFIX);
}

export async function encryptText(env, value) {
  const text = String(value ?? '');
  const cryptoImpl = getCrypto();
  const iv = new Uint8Array(12);
  cryptoImpl.getRandomValues(iv);
  const key = await deriveAesKey(env);
  const encrypted = await cryptoImpl.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return `${ENCRYPTED_PREFIX}${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`;
}

export async function decryptText(env, value, fallback = '') {
  const text = String(value ?? '');
  if (!isEncryptedText(text)) return text || fallback;
  const [, ivPart, cipherPart] = text.match(/^enc:v1:([^:]+):(.+)$/) ?? [];
  if (!ivPart || !cipherPart) return fallback;

  try {
    const key = await deriveAesKey(env);
    const decrypted = await getCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(ivPart) },
      key,
      base64ToBytes(cipherPart),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return fallback;
  }
}
