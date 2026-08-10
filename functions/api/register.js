import { createSessionCookie, createSessionToken, getSessionMaxAgeSeconds } from '../../src/backend/auth.js';
import { createSession, createStudentRegistration } from '../../src/backend/database.js';
import { jsonResponse, readJson } from '../_lib/api.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const user = await createStudentRegistration(env, await readJson(request));
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
      201,
      { 'Set-Cookie': createSessionCookie(token, request.url, getSessionMaxAgeSeconds(env)) },
    );
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}
