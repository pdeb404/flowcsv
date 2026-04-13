// Central API helper — works in both local dev and production
// In dev: uses proxy (package.json proxy → localhost:3001)
// In prod: uses REACT_APP_API_URL environment variable

const BASE = process.env.REACT_APP_API_URL || '';

export async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const res = await fetch(`${BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function fetchJob(jobId) {
  const res = await fetch(`${BASE}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function fetchAllJobs() {
  const res = await fetch(`${BASE}/api/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export function outputUrl(url) {
  // For downloading files — prepend base in production
  return `${BASE}${url}`;
}
