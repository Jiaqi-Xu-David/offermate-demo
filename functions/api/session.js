import { jsonResponse, requireUser } from '../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context);
  if (auth.response) return auth.response;

  return jsonResponse({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.name,
      role: auth.user.role,
    },
  });
}
