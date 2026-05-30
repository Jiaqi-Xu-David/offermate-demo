export function buildJobDetailUrl(jobId, basePath = './job.html') {
  const params = new URLSearchParams({ id: jobId });
  return `${basePath}?${params.toString()}`;
}
