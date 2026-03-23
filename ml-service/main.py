"""
IntelliSCM ML Microservice — FastAPI Application
Provides defect prediction, risk scoring, and model info endpoints.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from schemas import SoftwareMetrics, PredictionResponse, ModelInfoResponse
from model import load_model, predict as model_predict

# Global model bundle (loaded once on startup)
_model_bundle: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    global _model_bundle
    model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
    if os.path.exists(model_path):
        try:
            _model_bundle = load_model()
            print("[ML] ✅ Model loaded successfully")
        except Exception as e:
            print(f"[ML] ⚠️  Could not load model: {e}")
    else:
        print("[ML] ⚠️  model.pkl not found — run `python train.py` first")
    yield
    _model_bundle.clear()


app = FastAPI(
    title="IntelliSCM ML Service",
    description="Defect prediction and risk assessment microservice for IntelliSCM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health():
    """Health check endpoint."""
    model_loaded = bool(_model_bundle)
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "service": "IntelliSCM ML Microservice",
        "version": "1.0.0",
    }


@app.get("/", tags=["system"])
def root():
    return {"message": "IntelliSCM ML Service is running 🚀", "docs": "/docs"}


@app.post("/predict", response_model=PredictionResponse, tags=["prediction"])
def predict(metrics: SoftwareMetrics):
    """
    Predict defect probability and risk level for a software module.
    Returns risk_level (Low/Medium/High), impact_level, recommendations,
    and defect_probability from the trained RandomForest model.
    """
    if not _model_bundle:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run `python train.py` to train the model first."
        )
    try:
        result = model_predict(metrics.model_dump(), _model_bundle)
        return PredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/model-info", response_model=ModelInfoResponse, tags=["model"])
def model_info():
    """Return model performance metrics and feature importances."""
    if not _model_bundle:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run `python train.py` to train the model."
        )
    m = _model_bundle.get("metrics", {})
    return ModelInfoResponse(
        model_type="Random Forest Classifier (sklearn)",
        accuracy=m.get("accuracy", 0.0),
        precision=m.get("precision", 0.0),
        recall=m.get("recall", 0.0),
        f1_score=m.get("f1_score", 0.0),
        roc_auc=m.get("roc_auc", 0.0),
        training_samples=m.get("training_samples", 0),
        feature_count=m.get("feature_count", 0),
        top_features=m.get("top_features", []),
        classes=["No Defect", "Defect"],
    )


@app.post("/predict/batch", tags=["prediction"])
def predict_batch(metrics_list: list[SoftwareMetrics]):
    """Batch prediction for multiple modules at once."""
    if not _model_bundle:
        raise HTTPException(status_code=503, detail="Model not loaded.")
    results = []
    for m in metrics_list:
        try:
            results.append(model_predict(m.model_dump(), _model_bundle))
        except Exception as e:
            results.append({"error": str(e)})
    return {"predictions": results, "count": len(results)}
