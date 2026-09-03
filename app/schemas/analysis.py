from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

class CaseAnalysisRequest(BaseModel):
    case_id: int = Field(..., description="ID of the case to analyze")
    summary_acts: str = Field(..., description="Case summary acts text for extraction and matching")

class ExtractedEntitiesSchema(BaseModel):
    suspect_age: Optional[int] = Field(None, description="Age of the suspect extracted from text")
    objective_behavior: Optional[str] = Field(None, description="Objective criminal acts/behaviors")
    consequence: Optional[float] = Field(None, description="Monetary damage value or financial consequence in VND")
    arrest_time: Optional[str] = Field(None, description="Date of arrest/custody (YYYY-MM-DD)")
    weapon: Optional[str] = Field(None, description="Weapons, tools or vehicles used")

class SuggestedChargeSchema(BaseModel):
    article_id: int = Field(..., description="Penal Code Article number")
    title: str = Field(..., description="Title of the Penal Code Article")
    applicable_clause: int = Field(..., description="Applicable clause based on damage or acts")
    clause_details: str = Field(..., description="Description details of the applicable clause")
    conflict_warning: Optional[str] = Field(None, description="Warning about potential crime competition/conflicts")
    matching_score: Optional[float] = Field(None, description="4-Element matching score S(f, C_k) in [0, 1]")
    element_scores: Optional[Dict[str, float]] = Field(None, description="Individual constituent element scores (KT, KQ, CT, CQ)")
    explanation: Optional[Dict[str, Any]] = Field(None, description="GNNExplainer key evidence nodes/edges XAI output")
    distillation_result: Optional[str] = Field(None, description="Graph Distillation Operator classification result")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ProceduralWarningSchema(BaseModel):
    severity: str = Field(..., description="Warning severity: INFO, WARNING, CRITICAL")
    message: str = Field(..., description="Explanation of the procedural violation/milestone")
    article_reference: str = Field(..., description="Procedural code article reference (e.g. Điều 118 BLTTHS)")

    model_config = ConfigDict(from_attributes=True)

class CaseAnalysisResponse(BaseModel):
    case_id: int = Field(..., description="ID of the analyzed case")
    extracted_entities: ExtractedEntitiesSchema = Field(..., description="Entities extracted by NLP/LLM pipeline")
    tội_danh_đề_xuất: List[SuggestedChargeSchema] = Field(..., description="Proposed charges predicted by GNN/Ontology")
    căn_cứ_hình_sự: str = Field(..., description="Penal Code legal basis description text")
    cảnh_báo_thủ_tục_tố_tụng: List[ProceduralWarningSchema] = Field(..., description="Procedural timeline alerts based on CPC")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
