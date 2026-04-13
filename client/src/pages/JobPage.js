import React, { useEffect, useState, useRef } from 'react';
import { fetchJob, outputUrl } from '../api';

const STEP_ICONS    = ['⚙','📖','🧹','📂','✍','🗄','📊'];
const POLL_INTERVAL = 800;

export default function JobPage({ jobId, onNewUpload }) {
  const [job,   setJob]   = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  async function poll() {
    try {
      const data = await fetchJob(jobId);
      setJob(data);
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err.message);
      clearInterval(intervalRef.current);
    }
  }

  if (error) return (
    <div className="job-page">
      <div className="error-box">Error: {error}</div>
      <button className="run-btn" onClick={onNewUpload}>← New Upload</button>
    </div>
  );

  if (!job) return (
    <div className="job-page">
      <div className="loading-state"><span className="spinner large" /> Loading job...</div>
    </div>
  );

  const doneCount = job.steps.filter(s => s.status === 'done').length;
  const progress  = Math.round((doneCount / job.steps.length) * 100);

  return (
    <div className="job-page">
      <div className="job-header">
        <div>
          <h1 className="page-title">
            {job.status === 'done'    && '✓ Pipeline Complete'}
            {job.status === 'error'   && '✗ Pipeline Failed'}
            {job.status === 'running' && 'Pipeline Running...'}
            {job.status === 'queued'  && 'Pipeline Queued'}
          </h1>
          <p className="page-sub mono">Job: {job.id} · Files: {job.files.join(', ')}</p>
        </div>
        {job.status === 'done' && (
          <button className="run-btn small" onClick={onNewUpload}>+ New Upload</button>
        )}
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar" style={{
          width: `${progress}%`,
          background: job.status === 'error' ? 'var(--red)' : undefined,
        }} />
        <span className="progress-label">{progress}%</span>
      </div>

      <div className="job-layout">
        {/* Steps */}
        <div className="steps-panel">
          <div className="panel-label">PIPELINE STEPS</div>
          {job.steps.map((step, i) => (
            <div key={step.name} className={`step-card ${step.status}`}>
              <div className="step-card-top">
                <div className="step-card-left">
                  <span className="step-icon">{STEP_ICONS[i]}</span>
                  <div className="step-card-name">
                    <span className="step-card-num">0{i + 1}</span> {step.name}
                  </div>
                </div>
                <div className={`step-status-badge ${step.status}`}>
                  {step.status === 'running' && <><span className="spinner small" /> running</>}
                  {step.status === 'done'    && '✓ done'}
                  {step.status === 'error'   && '✗ error'}
                  {step.status === 'pending' && '· pending'}
                </div>
              </div>
              {step.log && <pre className="step-log">{step.log}</pre>}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="right-panel">
          {/* Stats */}
          {job.stats && Object.keys(job.stats).length > 0 && (
            <div className="stats-box">
              <div className="panel-label">STATS</div>
              <div className="stats-grid">
                {job.stats.totalRead !== undefined && (
                  <div className="stat-item">
                    <span className="stat-val">{job.stats.totalRead.toLocaleString()}</span>
                    <span className="stat-key">Records Read</span>
                  </div>
                )}
                {job.stats.duplicatesRemoved !== undefined && (
                  <div className="stat-item">
                    <span className="stat-val">{job.stats.duplicatesRemoved.toLocaleString()}</span>
                    <span className="stat-key">Dupes Removed</span>
                  </div>
                )}
                {job.stats.cleanRecords !== undefined && (
                  <div className="stat-item">
                    <span className="stat-val">{job.stats.cleanRecords.toLocaleString()}</span>
                    <span className="stat-key">Clean Records</span>
                  </div>
                )}
                {job.stats.categories !== undefined && (
                  <div className="stat-item">
                    <span className="stat-val">{job.stats.categories}</span>
                    <span className="stat-key">Categories</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outputs */}
          {job.outputs && job.outputs.length > 0 && (
            <div className="outputs-box">
              <div className="panel-label">OUTPUT FILES</div>
              {job.outputs.map(f => (
                <a
                  key={f.name}
                  href={outputUrl(f.url)}
                  className="output-file"
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="output-file-left">
                    <span className={`file-badge ${f.name.endsWith('.json') ? 'json' : 'csv'}`}>
                      {f.name.endsWith('.json') ? 'JSON' : 'CSV'}
                    </span>
                    <span className="output-name">{f.name}</span>
                  </div>
                  <div className="output-file-right">
                    {f.count !== null && <span className="output-count">{f.count} rows</span>}
                    <span className="download-arrow">↓</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Report */}
          {job.report && (
            <div className="report-box">
              <div className="panel-label">EXECUTION REPORT</div>
              <div className="report-row">
                <span>Duration</span>
                <span className="mono">{job.report.duration}ms</span>
              </div>
              <div className="report-row">
                <span>Throughput</span>
                <span className="mono">
                  {Math.round(job.report.stats.cleanRecords / (job.report.duration / 1000)).toLocaleString()} rec/sec
                </span>
              </div>
              <div className="report-row">
                <span>Output files</span>
                <span className="mono">{job.report.stats.outputFilesCreated}</span>
              </div>
              <div className="report-row">
                <span>Executed at</span>
                <span className="mono">{new Date(job.report.executedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {job.status === 'error' && (
            <div className="error-box">Pipeline failed: {job.error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
