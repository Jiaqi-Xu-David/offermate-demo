import { extractResumeTextFromPdf } from '../../src/backend/ocr.js';
import { createResumeAndMatchRun, listStudentHistory } from '../../src/backend/database.js';
import { jsonResponse, requireUser } from '../_lib/api.js';

const MAX_STORED_RESUME_FILE_BYTES = 700_000;
const PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf', 'application/acrobat']);
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46];

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

function looksLikePdfBuffer(bytes) {
  return PDF_MAGIC_BYTES.every((byte, index) => bytes?.[index] === byte);
}

export function ensureSupportedResumeUpload(file, fileBytes = null) {
  const fileName = String(file?.name ?? '');
  const mimeType = normalizeResumeMimeType(fileName, file?.type, fileBytes);
  const looksLikePdf = mimeType === 'application/pdf';
  if (!looksLikePdf) {
    throw new Error('仅支持 PDF 简历上传，请重新选择 .pdf 文件。');
  }
  if (Number(file?.size ?? 0) === 0) {
    throw new Error('上传的 PDF 为空，请重新导出后再试。');
  }
}

function normalizeResumeMimeType(fileName = '', mimeType = '', fileBytes = null) {
  const normalizedMimeType = String(mimeType ?? '').toLowerCase().trim();
  if (PDF_MIME_TYPES.has(normalizedMimeType)) return 'application/pdf';
  if (looksLikePdfBuffer(fileBytes)) return 'application/pdf';
  return String(fileName ?? '').toLowerCase().endsWith('.pdf') ? 'application/pdf' : normalizedMimeType;
}

function createStoredResumeFilePayload(buffer, mimeType) {
  if (buffer.byteLength > MAX_STORED_RESUME_FILE_BYTES) {
    return {
      storedFileDataBase64: null,
      storedMimeType: null,
    };
  }

  return {
    storedFileDataBase64: arrayBufferToBase64(buffer),
    storedMimeType: normalizeResumeMimeType('', mimeType) || 'application/pdf',
  };
}

async function readResumeText(request, env) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('resume');
    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = await file.arrayBuffer();
      const bufferBytes = new Uint8Array(buffer);
      ensureSupportedResumeUpload(file, bufferBytes);
      if (buffer.byteLength === 0) {
        throw new Error('上传的 PDF 为空，请重新导出后再试。');
      }
      const normalizedMimeType = normalizeResumeMimeType(file.name, file.type, bufferBytes);
      const extraction = await extractResumeTextFromPdf(env, buffer, {
        fileName: file.name || 'resume.pdf',
        mimeType: normalizedMimeType,
      });
      const { storedFileDataBase64, storedMimeType } = createStoredResumeFilePayload(buffer, normalizedMimeType);
      return {
        fileName: file.name || 'resume.pdf',
        rawText: extraction.text,
        fileDataBase64: storedFileDataBase64,
        mimeType: storedMimeType,
        textSource: extraction.source,
        extractionWarning: extraction.warning,
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

  let resume;
  try {
    resume = await readResumeText(context.request, context.env);
  } catch (error) {
    return jsonResponse({ error: `PDF OCR 解析失败：${error.message}` }, 422);
  }
  if (!resume.rawText.trim()) {
    return jsonResponse({ error: '没有从简历中提取到文字。请确认 PDF 内容清晰，或配置 OPENAI_API_KEY 启用 OCR。' }, 400);
  }

  try {
    const payload = await createResumeAndMatchRun(context.env, auth.user, resume);
    return jsonResponse(
      {
        ...payload,
        resume: {
          ...payload.resume,
          extractionWarning: resume.extractionWarning,
        },
      },
      201,
    );
  } catch (error) {
    return jsonResponse({ error: error.message }, 422);
  }
}
