import { extractPdfText } from '../../src/backend/pdf.js';
import { createResumeAndMatchRun, listStudentHistory } from '../../src/backend/database.js';
import { jsonResponse, requireUser } from '../_lib/api.js';

async function readResumeText(request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('resume');
    if (file && typeof file.arrayBuffer === 'function') {
      const text = await extractPdfText(await file.arrayBuffer());
      return { fileName: file.name || 'resume.pdf', rawText: text };
    }
    return { fileName: 'resume.txt', rawText: String(form.get('rawText') ?? '') };
  }

  const body = await request.json().catch(() => ({}));
  return {
    fileName: String(body.fileName ?? 'resume.txt'),
    rawText: String(body.rawText ?? ''),
  };
}

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['student']);
  if (auth.response) return auth.response;

  return jsonResponse(await listStudentHistory(context.env, auth.user));
}

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['student']);
  if (auth.response) return auth.response;

  const resume = await readResumeText(context.request);
  if (!resume.rawText.trim()) {
    return jsonResponse({ error: '没有从 PDF 中提取到文字。请上传文本型 PDF，扫描版图片 PDF 需要 OCR。' }, 400);
  }

  return jsonResponse(await createResumeAndMatchRun(context.env, auth.user, resume), 201);
}
