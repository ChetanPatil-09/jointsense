from fastapi import APIRouter, HTTPException
from app.core.materials_db import get_all_materials

router = APIRouter()


@router.get("/")
async def list_materials():
    return get_all_materials()


@router.get("/{key}")
async def get_material(key: str):
    mats = get_all_materials()
    if key not in mats:
        raise HTTPException(404, f"Material '{key}' not found")
    return mats[key]
