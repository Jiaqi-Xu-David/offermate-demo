import { listHrCandidates } from '../../../src/backend/database.js';
import { jsonResponse, requireUser } from '../../_lib/api.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['hr']);
  if (auth.response) return auth.response;

  return jsonResponse(await listHrCandidates(context.env));
}
