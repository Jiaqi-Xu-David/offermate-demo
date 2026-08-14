import { getJobById } from '../../../src/backend/database.js';
import { jsonResponse } from '../../_lib/api.js';

export async function onRequestGet(context) {
  const jobId = String(context.params?.id ?? '').trim();
  if (!jobId) {
    return jsonResponse({ error: '缺少岗位 ID。' }, 400);
  }

  const job = await getJobById(context.env, jobId);
  if (!job) {
    return jsonResponse({ error: '没有找到这个岗位。' }, 404);
  }

  const { createdBy, ...publicJob } = job;
  return jsonResponse({ job: publicJob });
}
