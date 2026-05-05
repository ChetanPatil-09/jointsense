#!/bin/bash
# JointSense — Quick Start Script
# Works on macOS and Linux

set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   JointSense — Aerospace Joint CAE   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Backend ──────────────────────────────
echo -e "${GREEN}[1/4] Setting up Python backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${YELLOW}  ⚠  Created backend/.env — please add your ANTHROPIC_API_KEY${NC}"
fi

python3 -m venv .venv 2>/dev/null || true
source .venv/bin/activate
pip install -q -r requirements.txt
echo -e "${GREEN}  ✓  Backend dependencies installed${NC}"

# Start backend in background
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}  ✓  Backend running at http://localhost:8000${NC}"
echo -e "       API docs: http://localhost:8000/api/docs"

cd ..

# ── Frontend ─────────────────────────────
echo ""
echo -e "${GREEN}[2/4] Setting up React frontend...${NC}"
cd frontend

npm install -q
echo -e "${GREEN}  ✓  Frontend dependencies installed${NC}"

echo ""
echo -e "${GREEN}[3/4] Starting development server...${NC}"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓  Frontend running at http://localhost:3000${NC}"

cd ..

echo ""
echo -e "${GREEN}[4/4] JointSense is ready!${NC}"
echo ""
echo -e "  ${BLUE}App:${NC}     http://localhost:3000"
echo -e "  ${BLUE}API:${NC}     http://localhost:8000"
echo -e "  ${BLUE}Docs:${NC}    http://localhost:8000/api/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
