import {
  listStudentApplications,
  submitApplication,
  withdrawApplication,
} from '../../src/backend/database.js';
import { jsonResponse, readJson, requireUser } from '../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['student']);
  if (auth.response) return auth.response;

  return jsonResponse(await listStudentApplications(context.env, auth.user));
}

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['student']);
  if (auth.response) return auth.response;

  try {
    const result = await submitApplication(context.env, auth.user, (await readJson(context.request)).jobId);
    return jsonResponse(result, result.created ? 201 : 200);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

export async function onRequestDelete(context) {
  const auth = await requireUser(context, ['student']);
  if (auth.response) return auth.response;

  try {
    const jobId = new URL(context.request.url).searchParams.get('jobId');
    return jsonResponse(await withdrawApplication(context.env, auth.user, jobId));
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}
