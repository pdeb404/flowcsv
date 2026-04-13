const fs   = require('fs');
const path = require('path');
const { parse }     = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const OUTPUTS_DIR  = path.join(__dirname, '..', 'outputs');
const ARCHIVES_DIR = path.join(__dirname, '..', 'archives');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setStep(job, i, status, log) {
  job.steps[i].status = status;
  if (log) job.steps[i].log = log;
}

// ── Main Pipeline ─────────────────────────────────────────────────────────
async function runPipeline(job, uploadedFiles) {
  job.status = 'running';

  const jobOutputDir  = path.join(OUTPUTS_DIR, job.id);
  const jobArchiveDir = path.join(ARCHIVES_DIR, job.id);

  try {

    // ── STEP 1: Initialize ──────────────────────────────────────────────
    setStep(job, 0, 'running');
    await sleep(300);
    fs.mkdirSync(jobOutputDir,  { recursive: true });
    fs.mkdirSync(jobArchiveDir, { recursive: true });
    setStep(job, 0, 'done',
      `Created output dir: outputs/${job.id}\n` +
      `Created archive dir: archives/${job.id}\n` +
      `Job ID: ${job.id}`
    );

    // ── STEP 2: Read ────────────────────────────────────────────────────
    setStep(job, 1, 'running');
    await sleep(400);

    let allRecords = [];
    const readLog  = [];

    for (const file of uploadedFiles) {
      const ext     = path.extname(file.originalname).toLowerCase();
      const content = fs.readFileSync(file.path, 'utf8');
      let records   = [];

      try {
        if (ext === '.csv') {
          records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
          readLog.push(`✓ ${file.originalname}: ${records.length} rows (CSV)`);
        } else if (ext === '.json') {
          const parsed = JSON.parse(content);
          records = Array.isArray(parsed) ? parsed : [parsed];
          readLog.push(`✓ ${file.originalname}: ${records.length} rows (JSON)`);
        } else {
          readLog.push(`⚠ ${file.originalname}: unsupported format, skipped`);
          continue;
        }
        records = records.map(r => ({ ...r, _source: file.originalname }));
        allRecords.push(...records);
      } catch (err) {
        readLog.push(`✗ ${file.originalname}: parse error — ${err.message}`);
      }
    }

    setStep(job, 1, 'done',
      readLog.join('\n') + `\n\nTotal records read: ${allRecords.length}`
    );
    job.stats.totalRead = allRecords.length;

    // ── STEP 3: Clean ───────────────────────────────────────────────────
    setStep(job, 2, 'running');
    await sleep(500);

    const before = allRecords.length;

    // Remove empty rows
    allRecords = allRecords.filter(r =>
      Object.values(r).some(v => v && String(v).trim() !== '')
    );

    // Deduplicate using Set + JSON.stringify (O(n), 100% accurate)
    const seen = new Set();
    allRecords = allRecords.filter(r => {
      const key = JSON.stringify(
        Object.fromEntries(Object.entries(r).filter(([k]) => k !== '_source'))
      );
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const dupes = before - allRecords.length;
    job.stats.duplicatesRemoved = dupes;
    job.stats.cleanRecords      = allRecords.length;

    setStep(job, 2, 'done',
      `Records before: ${before}\n` +
      `Duplicates removed: ${dupes}\n` +
      `Clean records: ${allRecords.length}`
    );

    // ── STEP 4: Organize ────────────────────────────────────────────────
    setStep(job, 3, 'running');
    await sleep(400);

    const sampleKeys    = Object.keys(allRecords[0] || {}).filter(k => k !== '_source');
    const categoryField = sampleKeys.find(k =>
      ['category','type','kind','group','tag','status','department'].includes(k.toLowerCase())
    ) || '_source';

    const grouped = {};
    for (const r of allRecords) {
      const cat = String(r[categoryField] || 'uncategorized')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .trim() || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    }

    const categories = Object.keys(grouped);
    job.stats.categories   = categories.length;
    job.stats.categoryField = categoryField;

    setStep(job, 3, 'done',
      `Category field: "${categoryField}"\n` +
      `Categories found: ${categories.length}\n\n` +
      categories.map(c => `  ${c}: ${grouped[c].length} records`).join('\n')
    );

    // ── STEP 5: Generate ────────────────────────────────────────────────
    setStep(job, 4, 'running');
    await sleep(500);

    const outputFiles = [];
    for (const [cat, records] of Object.entries(grouped)) {
      const clean    = records.map(({ _source, ...rest }) => rest);
      const csv      = stringify(clean, { header: true });
      const filename = `${cat}.csv`;
      const filepath = path.join(jobOutputDir, filename);
      fs.writeFileSync(filepath, csv, 'utf8');
      outputFiles.push({ name: filename, count: records.length, filepath });
    }

    job.outputs = outputFiles.map(f => ({
      name:  f.name,
      count: f.count,
      url:   `/outputs/${job.id}/${f.name}`,
    }));

    setStep(job, 4, 'done',
      outputFiles.map(f => `✓ ${f.name} (${f.count} records)`).join('\n')
    );

    // ── STEP 6: Archive ─────────────────────────────────────────────────
    setStep(job, 5, 'running');
    await sleep(300);

    let archived = 0;
    for (const file of uploadedFiles) {
      const dest = path.join(jobArchiveDir, file.originalname);
      fs.copyFileSync(file.path, dest);
      fs.unlinkSync(file.path);
      archived++;
    }
    setStep(job, 5, 'done',
      `Archived ${archived} source file(s) to archives/${job.id}/`
    );

    // ── STEP 7: Report ──────────────────────────────────────────────────
    setStep(job, 6, 'running');
    await sleep(300);

    const duration = Date.now() - new Date(job.createdAt).getTime();
    const report   = {
      jobId:       job.id,
      executedAt:  new Date().toISOString(),
      duration,
      inputFiles:  job.files,
      stats: {
        totalRecordsRead:    job.stats.totalRead,
        duplicatesRemoved:   job.stats.duplicatesRemoved,
        cleanRecords:        job.stats.cleanRecords,
        categoriesGenerated: job.stats.categories,
        outputFilesCreated:  outputFiles.length,
      },
      outputs: job.outputs,
    };

    const reportPath = path.join(jobOutputDir, '_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    job.report = report;
    job.outputs.push({
      name:  '_report.json',
      count: null,
      url:   `/outputs/${job.id}/_report.json`,
    });

    setStep(job, 6, 'done',
      `Report saved to outputs/${job.id}/_report.json\n` +
      `Duration: ${duration}ms\n` +
      `Throughput: ${Math.round(job.stats.cleanRecords / (duration / 1000))} rec/sec`
    );

    job.status     = 'done';
    job.finishedAt = new Date().toISOString();

  } catch (err) {
    const failedStep = job.steps.findIndex(s => s.status === 'running');
    if (failedStep >= 0) setStep(job, failedStep, 'error', `Fatal: ${err.message}`);
    job.status     = 'error';
    job.error      = err.message;
    job.finishedAt = new Date().toISOString();
    console.error('Pipeline error:', err);
  }
}

module.exports = { runPipeline };
