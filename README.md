# JointSense — Aerospace Structural Joint Analysis Platform

A professional CAE tool for analyzing single-bolt multi-plate structural joints. Performs bearing, net-section, shear-out, pull-through, bolt shear/tension, and interaction equation analysis — and explains results like a senior aerospace structural engineer using AI.

---

## Features

- **Full failure mode analysis** — Bearing, Net Section, Shear-Out, Pull-Through, Bolt Shear, Bolt Tension, Interaction Equation (Rs² + Rt²)
- **11 aerospace materials** — Al 2024-T3, 7075-T6, Ti-6Al-4V, A-286, 4340, Inconel 718 and more
- **AI CAE Assistant** — Powered by Claude, interprets results and gives design recommendations
- **Interactive charts** — MoS bar charts, stress vs allowable, joint schematic SVG
- **Prying models** — Default (0.75×Fx), Conservative, Optimistic, or user-defined
- **Multi-plate stacking** — Up to 10 plates with individual materials and dimensions
- **REST API** — Share the backend with other tools or scripts
- **Docker support** — One command to deploy anywhere

---

## Quick Start (Recommended)

```bash
git clone <your-repo-url> jointsense
cd jointsense

# Add your Anthropic API key to backend/.env
echo "ANTHROPIC_API_KEY=sk-ant-..." > backend/.env

# Start everything
bash scripts/start.sh
```

Open http://localhost:3000

---

## Manual Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- An Anthropic API key (for the CAE Assistant tab)

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add: ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
Interactive API docs: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:3000

---

## Docker Deployment (Share with Anyone)

```bash
# Build and start with Docker Compose
ANTHROPIC_API_KEY=sk-ant-... docker compose up --build

# Or create a .env file at project root:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
docker compose up --build
```

App: http://localhost:3000 | API: http://localhost:8000

---

## Project Structure

```
jointsense/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── core/
│   │   │   ├── config.py            # Settings (env vars)
│   │   │   ├── materials.json       # 11-alloy material database
│   │   │   └── materials_db.py      # Material loader
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── analysis.py          # POST /api/analysis/run
│   │   │   ├── materials.py         # GET /api/materials/
│   │   │   └── ai_assistant.py      # POST /api/ai/analyze
│   │   └── services/
│   │       └── plate_analysis.py    # Core engineering engine (extends plate_v01.py)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Root component + state
│   │   ├── components/
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.jsx      # All input controls
│   │   │   │   └── PlateRow.jsx     # Per-plate input row
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardTab.jsx # KPIs + charts
│   │   │   │   ├── DetailsTab.jsx   # Failure mode tables
│   │   │   │   └── VizTab.jsx       # Schematic + charts
│   │   │   ├── ai/
│   │   │   │   └── AITab.jsx        # CAE AI assistant
│   │   │   └── shared/
│   │   │       ├── TabBar.jsx
│   │   │       └── EmptyState.jsx
│   │   └── utils/
│   │       ├── api.js               # Axios API client
│   │       └── mos.js               # MoS color/format helpers
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
├── scripts/
│   └── start.sh                     # One-command startup
├── docker-compose.yml
└── README.md
```

---

## API Reference

### POST /api/analysis/run

Run a full joint analysis.

**Request body:**
```json
{
  "bolt_diameter": 6.35,
  "bolt_material_key": "titanium_6al4v",
  "plates": [
    { "width": 25.4, "thickness": 3.175, "material_key": "al2024_t3" },
    { "width": 25.4, "thickness": 3.175, "material_key": "al7075_t6" }
  ],
  "Fx": 2000,
  "Fy": 3000,
  "Fz": 1000,
  "edge_distance_mode": "1.5d",
  "prying_model": "default"
}
```

**Response:** Full joint result with bolt, plates, all margins, critical item, min MoS, and overall status.

### GET /api/materials/

Returns the full material database.

### POST /api/ai/analyze

Sends joint results to Claude for AI engineering assessment.

---

## Material Database

All strength values in MPa. Source: MMPDS-01 / MIL-HDBK-5.

| Key | Material | Ftu | Fty | Fsu | Fbru |
|-----|----------|-----|-----|-----|------|
| al2024_t3 | Al 2024-T3 | 483 | 345 | 290 | 896 |
| al7075_t6 | Al 7075-T6 | 572 | 503 | 331 | 1034 |
| al6061_t6 | Al 6061-T6 | 310 | 276 | 207 | 572 |
| titanium_6al4v | Ti-6Al-4V | 950 | 880 | 620 | 1654 |
| steel_a286 | A-286 Steel | 1000 | 793 | 621 | 1792 |
| steel_4340 | 4340 Steel HT | 1379 | 1241 | 827 | 2068 |
| steel_17_4ph | 17-4PH Steel | 1172 | 1103 | 724 | 2000 |
| inconel718 | Inconel 718 | 1379 | 1172 | 827 | 2413 |
| inconel625 | Inconel 625 | 965 | 517 | 580 | 1655 |

---

## Engineering Methodology

### Plate Failure Modes
- **Bearing:** σ_br = P / (d × t), allowable = Fbru
- **Net Section:** σ_ns = P / ((w - d) × t), allowable = Ftu
- **Shear-Out:** τ = P / (2 × e × t), allowable = Fsu
- **Pull-Through:** σ_pt = Fx / (π × d × t), allowable = Ftu

### Bolt Failure Modes
- **Shear:** τ = V / (A × n), allowable = Fsu
- **Tension:** σ = T_eff / A, allowable = Ftu
- **Interaction:** MoS = 1/√(Rs² + Rt²) − 1

### Margin of Safety
MoS = Allowable / Applied − 1 (MoS > 0 = PASS, MoS < 0 = FAIL)

### Prying Load
T_eff = Fx × (1 + prying_factor)

---

## License

MIT — free to use, modify, and share.
