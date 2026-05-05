"""
JointSense — Structural Joint Analysis Engine
Extends plate_v01.py with bolt analysis, multi-plate stacking,
interaction equations, and margin-of-safety calculations.
"""

import math
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class PryingModel(str, Enum):
    DEFAULT = "default"       # 0.75 × Fx
    CONSERVATIVE = "conservative"  # 1.0 × Fx
    OPTIMISTIC = "optimistic"      # 0.5 × Fx
    CUSTOM = "custom"


# ─────────────────────────────────────────────
# Core Plate class — from plate_v01.py, extended
# ─────────────────────────────────────────────
class Plate:
    def __init__(self, width: float, thickness: float,
                 bearing_allowable: float, net_allowable: float,
                 shear_allowable: float):
        self.width = width
        self.thickness = thickness
        self.bearing_allowable = bearing_allowable
        self.net_allowable = net_allowable
        self.shear_allowable = shear_allowable

    # ── BEARING ──────────────────────────────────────────
    def bearing_stress(self, load: float, diameter: float) -> float:
        return load / (diameter * self.thickness)

    def bearing_margin(self, load: float, diameter: float) -> float:
        stress = self.bearing_stress(load, diameter)
        return self.bearing_allowable / stress - 1

    # ── NET SECTION ───────────────────────────────────────
    def net_section_stress(self, load: float, diameter: float) -> float:
        net_area = (self.width - diameter) * self.thickness
        if net_area <= 0:
            raise ValueError("Net section area ≤ 0: bolt diameter ≥ plate width.")
        return load / net_area

    def net_section_margin(self, load: float, diameter: float) -> float:
        stress = self.net_section_stress(load, diameter)
        return self.net_allowable / stress - 1

    # ── SHEAR-OUT ─────────────────────────────────────────
    def shear_out_stress(self, load: float, edge_distance: float) -> float:
        shear_area = 2 * edge_distance * self.thickness
        return load / shear_area

    def shear_out_margin(self, load: float, edge_distance: float) -> float:
        stress = self.shear_out_stress(load, edge_distance)
        return self.shear_allowable / stress - 1

    # ── PULL-THROUGH ─────────────────────────────────────
    def pull_through_stress(self, axial_load: float, diameter: float) -> float:
        area = math.pi * diameter * self.thickness
        return axial_load / area

    def pull_through_margin(self, axial_load: float, diameter: float) -> float:
        stress = self.pull_through_stress(axial_load, diameter)
        return self.net_allowable / stress - 1


# ─────────────────────────────────────────────
# Bolt Analysis
# ─────────────────────────────────────────────
class BoltAnalyzer:
    """Analyzes bolt shear, tension, and interaction per MMPDS / MIL-HDBK-5."""

    def __init__(self, diameter: float, Ftu: float, Fsu: float):
        self.diameter = diameter
        self.Ftu = Ftu
        self.Fsu = Fsu
        self.area = math.pi * (diameter / 2) ** 2

    def shear_stress(self, shear_load: float, n_shear_planes: int = 1) -> float:
        return shear_load / (self.area * n_shear_planes)

    def tensile_stress(self, tensile_load: float) -> float:
        return tensile_load / self.area

    def shear_margin(self, shear_load: float, n_shear_planes: int = 1) -> float:
        stress = self.shear_stress(shear_load, n_shear_planes)
        return self.Fsu / stress - 1

    def tensile_margin(self, tensile_load: float) -> float:
        stress = self.tensile_stress(tensile_load)
        return self.Ftu / stress - 1

    def interaction_margin(self, shear_load: float, tensile_load: float,
                           n_shear_planes: int = 1) -> tuple[float, float, float]:
        """
        Combined load interaction per MMPDS:
        (Rs)^2 + (Rt)^2 ≤ 1.0
        MoS = 1/sqrt(Rs² + Rt²) - 1
        """
        Rs = self.shear_stress(shear_load, n_shear_planes) / self.Fsu
        Rt = self.tensile_stress(tensile_load) / self.Ftu
        interaction = Rs**2 + Rt**2
        margin = 1.0 / math.sqrt(interaction) - 1 if interaction > 0 else float('inf')
        return Rs, Rt, margin


# ─────────────────────────────────────────────
# Prying Load Calculator
# ─────────────────────────────────────────────
def compute_prying_load(axial_load: float, model: PryingModel,
                        factor: Optional[float] = None) -> float:
    """Compute effective tensile load including prying."""
    factors = {
        PryingModel.DEFAULT: 0.75,
        PryingModel.CONSERVATIVE: 1.0,
        PryingModel.OPTIMISTIC: 0.5,
        PryingModel.CUSTOM: factor or 0.75,
    }
    prying_factor = factors[model]
    return axial_load * (1 + prying_factor)


# ─────────────────────────────────────────────
# Joint Analysis Orchestrator
# ─────────────────────────────────────────────
@dataclass
class PlateInput:
    width: float          # mm
    thickness: float      # mm
    material_key: str


@dataclass
class JointInput:
    bolt_diameter: float          # mm
    bolt_material_key: str
    plates: list[PlateInput]
    Fx: float                     # N axial
    Fy: float                     # N shear
    Fz: float                     # N shear
    edge_distance_mode: str       # "1.5d" | "2d" | "custom"
    custom_edge_distance: Optional[float] = None  # mm
    prying_model: PryingModel = PryingModel.DEFAULT
    prying_factor: Optional[float] = None


@dataclass
class FailureMode:
    name: str
    applied_mpa: float
    allowable_mpa: float
    margin_of_safety: float
    status: str = field(init=False)

    def __post_init__(self):
        if self.margin_of_safety < 0:
            self.status = "FAIL"
        elif self.margin_of_safety < 0.2:
            self.status = "WARN"
        else:
            self.status = "PASS"


@dataclass
class PlateResult:
    plate_index: int
    material_name: str
    material_key: str
    width: float
    thickness: float
    bearing: FailureMode
    net_section: FailureMode
    shear_out: FailureMode
    pull_through: FailureMode

    def failure_modes(self) -> list[FailureMode]:
        return [self.bearing, self.net_section, self.shear_out, self.pull_through]

    def critical_mode(self) -> FailureMode:
        return min(self.failure_modes(), key=lambda m: m.margin_of_safety)


@dataclass
class BoltResult:
    material_name: str
    diameter: float
    shear: FailureMode
    tension: FailureMode
    interaction: FailureMode
    Rs: float
    Rt: float
    interaction_value: float

    def failure_modes(self) -> list[FailureMode]:
        return [self.shear, self.tension, self.interaction]

    def critical_mode(self) -> FailureMode:
        return min(self.failure_modes(), key=lambda m: m.margin_of_safety)


@dataclass
class JointResult:
    # Geometry
    bolt_diameter: float
    grip_length: float
    edge_distance: float
    n_shear_planes: int
    # Loads
    Fx: float
    Fy: float
    Fz: float
    resultant_shear: float
    effective_tensile: float
    prying_factor: float
    # Results
    bolt: BoltResult
    plates: list[PlateResult]
    # Summary
    all_margins: list[dict]
    critical_item: dict
    minimum_mos: float
    overall_status: str


def analyze_joint(inputs: JointInput, materials: dict) -> JointResult:
    """
    Full joint analysis — bolt + all plates, all failure modes.
    Returns a structured JointResult.
    """
    d = inputs.bolt_diameter
    bolt_mat = materials[inputs.bolt_material_key]

    # ── Edge Distance
    if inputs.edge_distance_mode == "1.5d":
        edge = 1.5 * d
    elif inputs.edge_distance_mode == "2d":
        edge = 2.0 * d
    else:
        edge = inputs.custom_edge_distance or (1.5 * d)

    # ── Loads
    Fshear = math.sqrt(inputs.Fy**2 + inputs.Fz**2)
    effective_tensile = compute_prying_load(inputs.Fx, inputs.prying_model, inputs.prying_factor)
    prying_factor = (effective_tensile / inputs.Fx - 1) if inputs.Fx != 0 else 0
    n_shear_planes = max(len(inputs.plates) - 1, 1)
    grip_length = sum(p.thickness for p in inputs.plates)

    # ── Bolt Analysis
    bolt = BoltAnalyzer(d, Ftu=bolt_mat["Ftu"], Fsu=bolt_mat["Fsu"])
    b_shear_stress = bolt.shear_stress(Fshear, n_shear_planes)
    b_shear_mos = bolt.shear_margin(Fshear, n_shear_planes)
    b_tensile_stress = bolt.tensile_stress(effective_tensile)
    b_tensile_mos = bolt.tensile_margin(effective_tensile)
    Rs, Rt, b_inter_mos = bolt.interaction_margin(Fshear, effective_tensile, n_shear_planes)
    inter_val = Rs**2 + Rt**2

    bolt_result = BoltResult(
        material_name=bolt_mat["name"],
        diameter=d,
        shear=FailureMode("Bolt Shear", b_shear_stress, bolt_mat["Fsu"], b_shear_mos),
        tension=FailureMode("Bolt Tension", b_tensile_stress, bolt_mat["Ftu"], b_tensile_mos),
        interaction=FailureMode("Interaction (Rs²+Rt²)", math.sqrt(inter_val), 1.0, b_inter_mos),
        Rs=Rs, Rt=Rt, interaction_value=inter_val
    )

    # ── Plate Analysis
    plate_results = []
    for i, p_in in enumerate(inputs.plates):
        mat = materials[p_in.material_key]
        plate = Plate(
            width=p_in.width,
            thickness=p_in.thickness,
            bearing_allowable=mat["Fbru"],
            net_allowable=mat["Ftu"],
            shear_allowable=mat["Fsu"]
        )

        bearing_stress = plate.bearing_stress(Fshear, d)
        net_stress = plate.net_section_stress(Fshear, d)
        shear_stress = plate.shear_out_stress(Fshear, edge)
        pull_stress = plate.pull_through_stress(inputs.Fx, d)

        plate_results.append(PlateResult(
            plate_index=i + 1,
            material_name=mat["name"],
            material_key=p_in.material_key,
            width=p_in.width,
            thickness=p_in.thickness,
            bearing=FailureMode("Bearing", bearing_stress, mat["Fbru"],
                                plate.bearing_margin(Fshear, d)),
            net_section=FailureMode("Net Section", net_stress, mat["Ftu"],
                                    plate.net_section_margin(Fshear, d)),
            shear_out=FailureMode("Shear-Out", shear_stress, mat["Fsu"],
                                   plate.shear_out_margin(Fshear, edge)),
            pull_through=FailureMode("Pull-Through", pull_stress, mat["Ftu"],
                                      plate.pull_through_margin(inputs.Fx, d))
        ))

    # ── Consolidate all margins
    all_margins = []
    for fm in bolt_result.failure_modes():
        all_margins.append({
            "label": fm.name,
            "component": "Bolt",
            "margin_of_safety": round(fm.margin_of_safety, 4),
            "status": fm.status
        })
    for pr in plate_results:
        for fm in pr.failure_modes():
            all_margins.append({
                "label": f"P{pr.plate_index} {fm.name}",
                "component": f"Plate {pr.plate_index}",
                "margin_of_safety": round(fm.margin_of_safety, 4),
                "status": fm.status
            })

    critical = min(all_margins, key=lambda x: x["margin_of_safety"])
    min_mos = critical["margin_of_safety"]
    status = "FAIL" if min_mos < 0 else ("WARN" if min_mos < 0.2 else "PASS")

    return JointResult(
        bolt_diameter=d,
        grip_length=grip_length,
        edge_distance=edge,
        n_shear_planes=n_shear_planes,
        Fx=inputs.Fx, Fy=inputs.Fy, Fz=inputs.Fz,
        resultant_shear=Fshear,
        effective_tensile=effective_tensile,
        prying_factor=prying_factor,
        bolt=bolt_result,
        plates=plate_results,
        all_margins=all_margins,
        critical_item=critical,
        minimum_mos=min_mos,
        overall_status=status
    )
