export async function fetchJobDetails(fetchImpl, jobId, baseUrl = '/api/jobs/') {
  if (!jobId) {
    return { status: 'not-found' };
  }

  try {
    const response = await fetchImpl(`${baseUrl}${encodeURIComponent(jobId)}`, {
      credentials: 'same-origin',
    });
    if (response.status === 404) {
      return { status: 'not-found' };
    }
    if (!response.ok) {
      return { status: 'error' };
    }

    const payload = await response.json();
    if (!payload?.job) {
      return { status: 'not-found' };
    }
    return { status: 'success', job: payload.job };
  } catch {
    return { status: 'error' };
  }
}
