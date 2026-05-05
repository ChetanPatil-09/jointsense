import json
from pathlib import Path
from functools import lru_cache

MATERIALS_PATH = Path(__file__).parent / "materials.json"


@lru_cache(maxsize=1)
def get_all_materials() -> dict:
    with open(MATERIALS_PATH, "r") as f:
        return json.load(f)
