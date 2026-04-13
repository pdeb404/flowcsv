import React, { useState } from 'react';
import UploadPage  from './pages/UploadPage';
import JobPage     from './pages/JobPage';
import HistoryPage from './pages/HistoryPage';
import './styles.css';

export default function App() {
  const [view, setView]           = useState('upload');
  const [activeJobId, setJobId]   = useState(null);

  function onJobStarted(jobId) { setJobId(jobId); setView('job'); }
  function onNewUpload()        { setView('upload'); }
  function onViewHistory()      { setView('history'); }
  function onSelectJob(id)      { setJobId(id); setView('job'); }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand" onClick={onNewUpload}>
          <span className="nav-logo">◈</span>
          <span className="nav-title">FlowCSV</span>
          <span className="nav-sub">DATA PIPELINE</span>
        </div>
        <div className="nav-links">
          <button className={`nav-btn ${view === 'upload'  ? 'active' : ''}`} onClick={onNewUpload}>Upload</button>
          <button className={`nav-btn ${view === 'history' ? 'active' : ''}`} onClick={onViewHistory}>History</button>
          {activeJobId && (
            <button className={`nav-btn ${view === 'job' ? 'active' : ''}`} onClick={() => setView('job')}>
              Active Job
            </button>
          )}
        </div>
      </nav>
      <main className="main">
        {view === 'upload'  && <UploadPage  onJobStarted={onJobStarted} />}
        {view === 'job'     && <JobPage     jobId={activeJobId} onNewUpload={onNewUpload} />}
        {view === 'history' && <HistoryPage onSelectJob={onSelectJob} />}
      </main>
    </div>
  );
}
