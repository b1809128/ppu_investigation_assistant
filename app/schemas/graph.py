from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class NodeSchema(BaseModel):
    id: str = Field(..., description="Unique ID for the node, e.g., suspect_1, action_2")
    label: str = Field(..., description="Node label, e.g., Suspect, Victim, Action, Asset, Weapon")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Attributes of the node (e.g., age, name, weapon type)")

class EdgeSchema(BaseModel):
    source: str = Field(..., description="ID of the source node")
    target: str = Field(..., description="ID of the target node")
    relation: str = Field(..., description="Relation type, e.g., THỰC_HIỆN, CHIẾM_ĐOẠT, ĐE_DỌA, SỬ_DỤNG")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Attributes of the edge")

class CaseGraphSchema(BaseModel):
    nodes: List[NodeSchema] = Field(default_factory=list, description="List of nodes/entities in the case graph")
    edges: List[EdgeSchema] = Field(default_factory=list, description="List of directed edges/relationships in the case graph")

    class Config:
        from_attributes = True
        populate_by_name = True
