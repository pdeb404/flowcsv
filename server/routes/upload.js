const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { createJob }   = require('../store');
const { runPipeline } = require('../pipeline/processor');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.csv', '.json'];
  const ext     = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error(`Unsupported file type: ${ext}. Only CSV and JSON allowed.`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
});

router.post('/', upload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const jobId = uuidv4();
  const job   = createJob(jobId, req.files);

  // Run pipeline asynchronously — respond immediately with job ID
  runPipeline(job, req.files).catch(err =>
    console.error('Unhandled pipeline error:', err)
  );

  res.json({
    jobId,
    message: 'Pipeline started',
    files:   req.files.map(f => f.originalname),
  });
});

module.exports = router;
