import { createAccountUser, deleteAccountUser, listAccountUsers } from '../../../src/backend/database.js';
import { jsonResponse, readJson, requireUser } from '../../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['admin']);
  if (auth.response) return auth.response;

  return jsonResponse(await listAccountUsers(context.env));
}

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['admin']);
  if (auth.response) return auth.response;

  try {
    const user = await createAccountUser(context.env, await readJson(context.request));
    return jsonResponse({ user }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

export async function onRequestDelete(context) {
  const auth = await requireUser(context, ['admin']);
  if (auth.response) return auth.response;

  const url = new URL(context.request.url);
  const userId = url.searchParams.get('id');
  try {
    return jsonResponse(await deleteAccountUser(context.env, auth.user, userId));
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}
