import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFiles } from '../api';

export default function UploadPage({ onJobStarted }) {
  const [files,     setFiles]     = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    setError(null);
    if (rejected.length > 0) setError('Only .csv and .json files are allowed.');
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...accepted.filter(f => !existing.has(f.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    maxFiles: 20,
  });

  function removeFile(name) { setFiles(f => f.filter(x => x.name !== name)); }

  async function handleSubmit() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const data = await uploadFiles(files);
      onJobStarted(data.jobId);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="upload-page">
      <div className="upload-header">
        <h1 className="page-title">Upload Your Data</h1>
        <p className="page-sub">Drop CSV or JSON files. FlowCSV runs a 7-step pipeline to clean, deduplicate, and organize your records automatically.</p>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-inner">
          <div className="drop-icon">{isDragActive ? '↓' : '+'}</div>
          <div className="drop-text">{isDragActive ? 'Release to add files' : 'Drag & drop CSV / JSON files here'}</div>
          <div className="drop-hint">or click to browse — up to 20 files, 50MB each</div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <span>{files.length} file{files.length > 1 ? 's' : ''} selected</span>
            <span>{formatBytes(totalSize)}</span>
          </div>
          {files.map(f => (
            <div key={f.name} className="file-item">
              <span className={`file-badge ${f.name.endsWith('.json') ? 'json' : 'csv'}`}>
                {f.name.endsWith('.json') ? 'JSON' : 'CSV'}
              </span>
              <span className="file-name">{f.name}</span>
              <span className="file-size">{formatBytes(f.size)}</span>
              <button className="file-remove" onClick={() => removeFile(f.name)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <button
        className={`run-btn ${files.length === 0 ? 'disabled' : ''} ${uploading ? 'loading' : ''}`}
        onClick={handleSubmit}
        disabled={files.length === 0 || uploading}
      >
        {uploading
          ? <><span className="spinner" /> Starting Pipeline...</>
          : <><span>▶</span> Run Pipeline on {files.length} file{files.length !== 1 ? 's' : ''}</>
        }
      </button>

      <div className="pipeline-preview">
        <div className="pp-label">7-STEP PIPELINE</div>
        <div className="pp-steps">
          {['Initialize','Read','Clean','Organize','Generate','Archive','Report'].map((s, i) => (
            <div key={s} className="pp-step">
              <span className="pp-num">0{i + 1}</span>
              <span className="pp-name">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatBytes(b) {
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
