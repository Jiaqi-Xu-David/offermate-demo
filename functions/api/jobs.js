import { addJob, listJobs } from '../../src/backend/database.js';
import { jsonResponse, readJson, requireUser } from '../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context);
  if (auth.response) return auth.response;

  return jsonResponse({ jobs: await listJobs(context.env) });
}

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['hr']);
  if (auth.response) return auth.response;

  const body = await readJson(context.request);
  const title = String(body.title ?? '').trim();
  const city = String(body.city ?? '').trim();
  const description = String(body.description ?? '').trim();

  if (!title || !city || description.length < 20) {
    return jsonResponse({ error: '请填写岗位名称、地点和完整 JD。' }, 400);
  }

  const job = await addJob(context.env, auth.user, { title, city, description });
  return jsonResponse({ job }, 201);
}
