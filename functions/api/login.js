import { createSessionCookie, createSessionToken, getSessionMaxAgeSeconds, verifyPassword } from '../../src/backend/auth.js';
import { createSession, findUserByEmail } from '../../src/backend/database.js';
import { jsonResponse, readJson } from '../_lib/api.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await readJson(request);
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const user = await findUserByEmail(env, email);

  if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
    return jsonResponse({ error: '邮箱或密码不正确。' }, 401);
  }

  const token = createSessionToken();
  await createSession(env, user.id, token);

  return jsonResponse(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    200,
    { 'Set-Cookie': createSessionCookie(token, request.url, getSessionMaxAgeSeconds(env)) },
  );
}
