import { getSessionToken } from '../../src/backend/auth.js';
import { findSessionUser } from '../../src/backend/database.js';

export function jsonResponse(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function requireUser(context, allowedRoles = []) {
  const token = getSessionToken(context.request);
  const user = await findSessionUser(context.env, token);
  if (!user) {
    return { response: jsonResponse({ error: '请先登录。' }, 401) };
  }
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return { response: jsonResponse({ error: '当前账号没有权限访问该功能。' }, 403) };
  }
  return { user, token };
}
