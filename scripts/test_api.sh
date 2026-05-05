#!/bin/bash
# JointSense API — Example Requests
# Make sure the backend is running: uvicorn app.main:app --reload

BASE="http://localhost:8000/api"

echo "=== Health Check ==="
curl -s "$BASE/health" | python3 -m json.tool

echo ""
echo "=== List Materials ==="
curl -s "$BASE/materials/" | python3 -m json.tool | head -40

echo ""
echo "=== Run Joint Analysis ==="
curl -s -X POST "$BASE/analysis/run" \
  -H "Content-Type: application/json" \
  -d '{
    "bolt_diameter": 6.35,
    "bolt_material_key": "titanium_6al4v",
    "plates": [
      {"width": 25.4, "thickness": 3.175, "material_key": "al2024_t3"},
      {"width": 25.4, "thickness": 3.175, "material_key": "al7075_t6"}
    ],
    "Fx": 2000,
    "Fy": 3000,
    "Fz": 1000,
    "edge_distance_mode": "1.5d",
    "prying_model": "default"
  }' | python3 -m json.tool

echo ""
echo "=== High-Load Failing Joint ==="
curl -s -X POST "$BASE/analysis/run" \
  -H "Content-Type: application/json" \
  -d '{
    "bolt_diameter": 4.0,
    "bolt_material_key": "al2024_t4",
    "plates": [
      {"width": 15.0, "thickness": 1.5, "material_key": "al6061_t6"}
    ],
    "Fx": 8000,
    "Fy": 12000,
    "Fz": 5000,
    "edge_distance_mode": "1.5d",
    "prying_model": "conservative"
  }' | python3 -m json.tool
