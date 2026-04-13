// In-memory job store using a JavaScript Map
// For production scale: replace with PostgreSQL or Redis
const jobs = new Map();

function createJob(id, files) {
  const job = {
    id,
    status: 'queued',
    files: files.map(f => f.originalname),
    steps: [
      { name: 'Initialize', status: 'pending', log: '' },
      { name: 'Read',       status: 'pending', log: '' },
      { name: 'Clean',      status: 'pending', log: '' },
      { name: 'Organize',   status: 'pending', log: '' },
      { name: 'Generate',   status: 'pending', log: '' },
      { name: 'Archive',    status: 'pending', log: '' },
      { name: 'Report',     status: 'pending', log: '' },
    ],
    stats: {},
    outputs: [],
    report: null,
    error: null,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };
  jobs.set(id, job);
  return job;
}

function getJob(id)    { return jobs.get(id) || null; }
function getAllJobs()   { return Array.from(jobs.values()).reverse(); }

module.exports = { createJob, getJob, getAllJobs };
