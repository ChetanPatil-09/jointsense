from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class PryingModelEnum(str, Enum):
    DEFAULT = "default"
    CONSERVATIVE = "conservative"
    OPTIMISTIC = "optimistic"
    CUSTOM = "custom"


class PlateInputModel(BaseModel):
    width: float = Field(..., gt=0, description="Plate width in mm")
    thickness: float = Field(..., gt=0, description="Plate thickness in mm")
    material_key: str


class JointInputModel(BaseModel):
    bolt_diameter: float = Field(..., gt=0, le=100)
    bolt_material_key: str
    plates: List[PlateInputModel] = Field(..., min_length=1, max_length=10)
    Fx: float = 0.0
    Fy: float = 0.0
    Fz: float = 0.0
    edge_distance_mode: str = "1.5d"
    custom_edge_distance: Optional[float] = None
    prying_model: PryingModelEnum = PryingModelEnum.DEFAULT
    prying_factor: Optional[float] = None


class FailureModeResponse(BaseModel):
    name: str
    applied_mpa: float
    allowable_mpa: float
    margin_of_safety: float
    status: str


class BoltResultResponse(BaseModel):
    material_name: str
    diameter: float
    shear: FailureModeResponse
    tension: FailureModeResponse
    interaction: FailureModeResponse
    Rs: float
    Rt: float
    interaction_value: float
    critical_mode: FailureModeResponse


class PlateResultResponse(BaseModel):
    plate_index: int
    material_name: str
    material_key: str
    width: float
    thickness: float
    bearing: FailureModeResponse
    net_section: FailureModeResponse
    shear_out: FailureModeResponse
    pull_through: FailureModeResponse
    critical_mode: FailureModeResponse


class JointResultResponse(BaseModel):
    bolt_diameter: float
    grip_length: float
    edge_distance: float
    n_shear_planes: int
    Fx: float
    Fy: float
    Fz: float
    resultant_shear: float
    effective_tensile: float
    prying_factor: float
    bolt: BoltResultResponse
    plates: List[PlateResultResponse]
    all_margins: List[dict]
    critical_item: dict
    minimum_mos: float
    overall_status: str


class AIAnalysisRequest(BaseModel):
    joint_result: JointResultResponse
    user_question: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    analysis: str
    recommendations: List[str]
    critical_mode_explanation: str
