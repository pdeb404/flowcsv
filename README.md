# FlowCSV — Automated Data Cleaning & Organization Pipeline

> Drag. Drop. Done in 30 seconds.

FlowCSV takes messy CSV and JSON files, runs them through a 7-step automated pipeline, and outputs clean organized files with a full audit report.

## Live Demo

**[flowcsv.vercel.app](https://flowcsv.vercel.app)**

Try it with the files in `/sample-data/` — `employees.csv` has 3 embedded duplicates baked in.

---

## What It Does

- Upload up to 20 CSV or JSON files at once
- Automatically removes duplicate rows (100% accuracy, O(n) speed)
- Auto-detects the grouping column — no configuration needed
- Outputs one clean CSV per category
- Live 7-step progress dashboard
- Full audit report (_report.json) every run

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, react-dropzone |
| Backend | Node.js, Express |
| File handling | Multer, csv-parse, csv-stringify |
| Job tracking | In-memory Map + UUID |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Run Locally

```bash
# 1. Install all dependencies
npm install
cd client && npm install && cd ..

# 2. Terminal 1 — backend (port 3001)
node server/index.js

# 3. Terminal 2 — frontend (port 3000)
cd client && npm start
```

Then open http://localhost:3000

---

## Project Structure

```
flowcsv/
├── server/
│   ├── index.js              # Express app + CORS + static serving
│   ├── store.js              # In-memory job store (Map)
│   ├── pipeline/
│   │   └── processor.js      # 7-step async pipeline
│   ├── routes/
│   │   ├── upload.js         # POST /api/upload
│   │   └── jobs.js           # GET /api/jobs, GET /api/jobs/:id
│   ├── uploads/              # Temp upload storage
│   ├── outputs/              # Generated CSV outputs
│   └── archives/             # Archived source files
├── client/
│   └── src/
│       ├── api.js            # Centralised fetch helper
│       ├── App.js
│       ├── styles.css
│       └── pages/
│           ├── UploadPage.js
│           ├── JobPage.js
│           └── HistoryPage.js
├── sample-data/
│   └── employees.csv         # Test file with embedded duplicates
└── README.md
```

---

## The 7-Step Pipeline

| Step | What it does | Key function |
|---|---|---|
| 1. Initialize | Creates output/archive dirs | `fs.mkdirSync()` |
| 2. Read | Parses CSV + JSON files | `csv-parse`, `JSON.parse` |
| 3. Clean | Removes dupes + empty rows | `Set` + `JSON.stringify` |
| 4. Organize | Groups by category column | `Object.keys()` detection |
| 5. Generate | Writes one CSV per category | `csv-stringify` + `fs.writeFile` |
| 6. Archive | Moves originals to archive | `copyFileSync` + `unlinkSync` |
| 7. Report | Generates audit JSON | Throughput + metrics |

---

## Built For

Kiro Heroes Challenge — Week 2: "Lazy Automation"
