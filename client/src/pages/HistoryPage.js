import React, { useEffect, useState } from 'react';
import { fetchAllJobs } from '../api';

export default function HistoryPage({ onSelectJob }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllJobs()
      .then(data => { setJobs(data); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  if (loading) return (
    <div className="history-page">
      <div className="loading-state"><span className="spinner large" /> Loading history...</div>
    </div>
  );

  return (
    <div className="history-page">
      <div className="upload-header">
        <h1 className="page-title">Job History</h1>
        <p className="page-sub">{jobs.length} pipeline run{jobs.length !== 1 ? 's' : ''} this session</p>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">No jobs yet. Upload some files to get started.</div>
      ) : (
        <div className="history-list">
          {jobs.map(job => (
            <div key={job.id} className="history-card" onClick={() => onSelectJob(job.id)}>
              <div className="history-card-top">
                <div>
                  <div className="history-files">{job.files.join(', ')}</div>
                  <div className="history-id mono">{job.id}</div>
                </div>
                <div className={`job-status-badge ${job.status}`}>
                  {job.status === 'done'    && '✓ done'}
                  {job.status === 'error'   && '✗ error'}
                  {job.status === 'running' && 'running'}
                  {job.status === 'queued'  && 'queued'}
                </div>
              </div>
              <div className="history-card-bottom">
                <span>{new Date(job.createdAt).toLocaleString()}</span>
                {job.stats?.cleanRecords !== undefined && (
                  <span>{job.stats.cleanRecords.toLocaleString()} clean records</span>
                )}
                {job.stats?.categories !== undefined && (
                  <span>{job.stats.categories} categories</span>
                )}
                <span className="view-link">View →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
