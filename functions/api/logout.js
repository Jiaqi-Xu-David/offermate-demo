import { clearSessionCookie, getSessionToken } from '../../src/backend/auth.js';
import { deleteSession } from '../../src/backend/database.js';
import { jsonResponse } from '../_lib/api.js';

export async function onRequestPost(context) {
  const token = getSessionToken(context.request);
  await deleteSession(context.env, token);
  return jsonResponse({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(context.request.url) });
}
