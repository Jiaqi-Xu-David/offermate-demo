import { listHrCandidates } from '../../../src/backend/database.js';
import { jsonResponse, requireUser } from '../../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['hr']);
  if (auth.response) return auth.response;

  const url = new URL(context.request.url);
  const query = url.searchParams.get('query') ?? '';
  const stage = url.searchParams.get('stage') ?? 'all';

  return jsonResponse(await listHrCandidates(context.env, { query, stage }));
}
