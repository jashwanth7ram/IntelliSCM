from pydantic import BaseModel, Field
from typing import Optional, List


class SoftwareMetrics(BaseModel):
    """Input features derived from source code metrics (JM1 schema)."""
    loc: float = Field(..., description="Lines of Code", example=190)
    v_g: float = Field(..., description="McCabe Cyclomatic Complexity", example=3)
    ev_g: float = Field(..., description="McCabe Essential Complexity", example=1)
    iv_g: float = Field(..., description="McCabe Design Complexity", example=3)
    n: Optional[float] = Field(None, description="Halstead Total Operators+Operands", example=600)
    v: Optional[float] = Field(None, description="Halstead Volume", example=4348.76)
    l: Optional[float] = Field(None, description="Halstead Program Length", example=0.06)
    d: Optional[float] = Field(None, description="Halstead Difficulty", example=17.06)
    i: Optional[float] = Field(None, description="Halstead Intelligence", example=254.87)
    e: Optional[float] = Field(None, description="Halstead Effort", example=74202.67)
    b: Optional[float] = Field(None, description="Halstead Error Estimate", example=1.45)
    t: Optional[float] = Field(None, description="Halstead Time to Program", example=4122.37)
    lOCode: float = Field(..., description="Line count of code", example=129)
    lOComment: float = Field(..., description="Line count of comments", example=29)
    lOBlank: float = Field(..., description="Line count of blank lines", example=28)
    locCodeAndComment: float = Field(..., description="Lines with code and comment", example=2)
    uniq_Op: float = Field(..., description="Unique Operators", example=17)
    uniq_Opnd: float = Field(..., description="Unique Operands", example=135)
    total_Op: float = Field(..., description="Total Operators", example=329)
    total_Opnd: float = Field(..., description="Total Operands", example=271)
    branchCount: float = Field(..., description="Branch Count", example=5)

    class Config:
        json_schema_extra = {
            "example": {
                "loc": 190, "v_g": 3, "ev_g": 1, "iv_g": 3,
                "n": 600, "v": 4348.76, "l": 0.06, "d": 17.06, "i": 254.87,
                "e": 74202.67, "b": 1.45, "t": 4122.37,
                "lOCode": 129, "lOComment": 29, "lOBlank": 28,
                "locCodeAndComment": 2, "uniq_Op": 17, "uniq_Opnd": 135,
                "total_Op": 329, "total_Opnd": 271, "branchCount": 5
            }
        }


class PredictionResponse(BaseModel):
    defect_probability: float = Field(..., description="Probability of defect (0-1)")
    risk_level: str = Field(..., description="Low | Medium | High")
    impact_level: str = Field(..., description="Minor | Moderate | Major | Critical")
    defect_predicted: bool = Field(..., description="Boolean defect prediction")
    confidence: float = Field(..., description="Model confidence percentage")
    recommendations: List[str] = Field(..., description="Actionable recommendations")
    feature_contributions: dict = Field(..., description="Top contributing feature values")


class ModelInfoResponse(BaseModel):
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    training_samples: int
    feature_count: int
    top_features: List[dict]
    classes: List[str]
