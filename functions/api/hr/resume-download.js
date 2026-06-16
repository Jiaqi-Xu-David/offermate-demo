import { getResumeFileForHr } from '../../../src/backend/database.js';
import { jsonResponse, requireUser } from '../../_lib/api.js';

function encodeFileName(fileName) {
  return encodeURIComponent(fileName).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['hr']);
  if (auth.response) return auth.response;

  const url = new URL(context.request.url);
  const resumeId = url.searchParams.get('id');
  if (!resumeId) return jsonResponse({ error: '缺少简历 ID。' }, 400);

  const file = await getResumeFileForHr(context.env, resumeId);
  if (!file) return jsonResponse({ error: '没有找到这份简历。' }, 404);

  return new Response(file.bytes, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeFileName(file.fileName)}`,
    },
  });
}
