import { getResumeFileForHr } from '../../../src/backend/database.js';
import { jsonResponse, requireUser } from '../../_lib/api.js';

function normalizeDownloadFileName(fileName) {
  return (
    String(fileName ?? 'resume.pdf')
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .replace(/[/\\]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'resume.pdf'
  );
}

function buildAsciiFallbackFileName(fileName) {
  const cleaned = normalizeDownloadFileName(fileName)
    .replace(/[?%*:|"<>]/g, '-')
    .replace(/[^\x20-\x7E]/g, '_')
    .trim();
  return (cleaned || 'resume.pdf').replace(/"/g, "'");
}

function encodeFileName(fileName) {
  return encodeURIComponent(normalizeDownloadFileName(fileName)).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function buildDownloadContentDisposition(fileName) {
  const normalizedFileName = normalizeDownloadFileName(fileName);
  return `attachment; filename="${buildAsciiFallbackFileName(normalizedFileName)}"; filename*=UTF-8''${encodeFileName(normalizedFileName)}`;
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
      'Content-Disposition': buildDownloadContentDisposition(file.fileName),
    },
  });
}
