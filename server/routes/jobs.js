const express = require('express');
const { getJob, getAllJobs } = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getAllJobs());
});

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

module.exports = router;
