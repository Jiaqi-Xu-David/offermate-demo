import { extractPdfText } from '../../src/backend/pdf.js';
import { createResumeAndMatchRun, listStudentHistory } from '../../src/backend/database.js';
import { jsonResponse, requireUser } from '../_lib/api.js';

function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function arrayBufferToBase64(buffer) {
  return bytesToBase64(new Uint8Array(buffer));
}

function textToBase64(text) {
  return bytesToBase64(new TextEncoder().encode(text));
}

async function readResumeText(request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('resume');
    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = await file.arrayBuffer();
      const text = await extractPdfText(buffer);
      return {
        fileName: file.name || 'resume.pdf',
        rawText: text,
        fileDataBase64: arrayBufferToBase64(buffer),
        mimeType: file.type || 'application/pdf',
      };
    }
    const rawText = String(form.get('rawText') ?? '');
    return {
      fileName: 'resume.txt',
      rawText,
      fileDataBase64: textToBase64(rawText),
      mimeType: 'text/plain;charset=utf-8',
    };
  }

  const body = await request.json().catch(() => ({}));
  const rawText = String(body.rawText ?? '');
  return {
    fileName: String(body.fileName ?? 'resume.txt'),
    rawText,
    fileDataBase64: textToBase64(rawText),
    mimeType: 'text/plain;charset=utf-8',
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

  try {
    return jsonResponse(await createResumeAndMatchRun(context.env, auth.user, resume), 201);
  } catch (error) {
    return jsonResponse({ error: error.message }, 422);
  }
}
