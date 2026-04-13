const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const uploadRouter = require('./routes/upload');
const jobsRouter = require('./routes/jobs');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Ensure directories exist ──────────────────────────────────────────────
['uploads', 'outputs', 'archives'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    FRONTEND_URL,
  ],
  credentials: true,
}));

app.use(express.json());

// ── Static file serving (outputs + archives for download) ─────────────────
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
app.use('/archives', express.static(path.join(__dirname, 'archives')));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/upload', uploadRouter);
app.use('/api/jobs', jobsRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 FlowCSV API running on port ${PORT}`);
  console.log(`📁 Outputs: ${path.join(__dirname, 'outputs')}`);
  console.log(`🌐 Allowing origin: ${FRONTEND_URL}\n`);
});
