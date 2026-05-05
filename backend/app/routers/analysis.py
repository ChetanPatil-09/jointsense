from fastapi import APIRouter, HTTPException
from app.models.schemas import JointInputModel, JointResultResponse
from app.services.plate_analysis import analyze_joint, JointInput, PlateInput, PryingModel
from app.core.materials_db import get_all_materials

router = APIRouter()


def _fm(fm):
    return {
        "name": fm.name,
        "applied_mpa": round(fm.applied_mpa, 3),
        "allowable_mpa": round(fm.allowable_mpa, 3),
        "margin_of_safety": round(fm.margin_of_safety, 4),
        "status": fm.status,
    }


@router.post("/run", response_model=JointResultResponse)
async def run_analysis(body: JointInputModel):
    materials = get_all_materials()
    if body.bolt_material_key not in materials:
        raise HTTPException(400, f"Unknown bolt material: {body.bolt_material_key}")
    for p in body.plates:
        if p.material_key not in materials:
            raise HTTPException(400, f"Unknown plate material: {p.material_key}")
    try:
        inputs = JointInput(
            bolt_diameter=body.bolt_diameter,
            bolt_material_key=body.bolt_material_key,
            plates=[PlateInput(p.width, p.thickness, p.material_key) for p in body.plates],
            Fx=body.Fx, Fy=body.Fy, Fz=body.Fz,
            edge_distance_mode=body.edge_distance_mode,
            custom_edge_distance=body.custom_edge_distance,
            prying_model=PryingModel(body.prying_model.value),
            prying_factor=body.prying_factor,
        )
        r = analyze_joint(inputs, materials)
    except ValueError as e:
        raise HTTPException(422, str(e))

    return {
        "bolt_diameter": r.bolt_diameter,
        "grip_length": round(r.grip_length, 3),
        "edge_distance": round(r.edge_distance, 3),
        "n_shear_planes": r.n_shear_planes,
        "Fx": r.Fx, "Fy": r.Fy, "Fz": r.Fz,
        "resultant_shear": round(r.resultant_shear, 2),
        "effective_tensile": round(r.effective_tensile, 2),
        "prying_factor": round(r.prying_factor, 3),
        "bolt": {
            "material_name": r.bolt.material_name,
            "diameter": r.bolt.diameter,
            "shear": _fm(r.bolt.shear),
            "tension": _fm(r.bolt.tension),
            "interaction": _fm(r.bolt.interaction),
            "Rs": round(r.bolt.Rs, 4),
            "Rt": round(r.bolt.Rt, 4),
            "interaction_value": round(r.bolt.interaction_value, 4),
            "critical_mode": _fm(r.bolt.critical_mode()),
        },
        "plates": [{
            "plate_index": pr.plate_index,
            "material_name": pr.material_name,
            "material_key": pr.material_key,
            "width": pr.width,
            "thickness": pr.thickness,
            "bearing": _fm(pr.bearing),
            "net_section": _fm(pr.net_section),
            "shear_out": _fm(pr.shear_out),
            "pull_through": _fm(pr.pull_through),
            "critical_mode": _fm(pr.critical_mode()),
        } for pr in r.plates],
        "all_margins": r.all_margins,
        "critical_item": r.critical_item,
        "minimum_mos": round(r.minimum_mos, 4),
        "overall_status": r.overall_status,
    }
