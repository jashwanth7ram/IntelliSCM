"""
Model training pipeline for IntelliSCM ML service.
Trains a Random Forest classifier on the JM1 NASA software defect dataset.
"""
import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, classification_report)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import joblib

# Feature columns matching JM1 schema
FEATURE_COLS = [
    "loc", "v(g)", "ev(g)", "iv(g)", "n", "v", "l", "d", "i", "e", "b", "t",
    "lOCode", "lOComment", "lOBlank", "locCodeAndComment",
    "uniq_Op", "uniq_Opnd", "total_Op", "total_Opnd", "branchCount"
]

# Map from API field names to CSV column names
API_TO_CSV = {
    "loc": "loc", "v_g": "v(g)", "ev_g": "ev(g)", "iv_g": "iv(g)",
    "n": "n", "v": "v", "l": "l", "d": "d", "i": "i",
    "e": "e", "b": "b", "t": "t",
    "lOCode": "lOCode", "lOComment": "lOComment", "lOBlank": "lOBlank",
    "locCodeAndComment": "locCodeAndComment",
    "uniq_Op": "uniq_Op", "uniq_Opnd": "uniq_Opnd",
    "total_Op": "total_Op", "total_Opnd": "total_Opnd",
    "branchCount": "branchCount"
}

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "jm1.csv")


def load_and_clean(path: str) -> pd.DataFrame:
    """Load JM1 CSV, clean '?' values, cast target to int."""
    df = pd.read_csv(path)
    # Replace '?' with NaN across all columns
    df.replace("?", np.nan, inplace=True)
    # Cast feature columns to numeric
    for col in FEATURE_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    # Convert defects column
    df["defects"] = df["defects"].map({"true": 1, "false": 0, True: 1, False: 0})
    df = df.dropna(subset=["defects"])
    return df


def build_pipeline() -> Pipeline:
    """Create preprocessing + model pipeline."""
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ))
    ])


def train(dataset_path: str = None) -> dict:
    """Train model and save to disk. Returns evaluation metrics."""
    path = dataset_path or DATASET_PATH
    df = load_and_clean(path)

    X = df[FEATURE_COLS].copy()
    y = df["defects"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "training_samples": int(len(X_train)),
        "feature_count": int(len(FEATURE_COLS)),
    }

    # Feature importances from inner RF
    rf = pipeline.named_steps["clf"]
    importances = rf.feature_importances_
    top_features = sorted(
        [{"feature": FEATURE_COLS[i], "importance": float(importances[i])}
         for i in range(len(FEATURE_COLS))],
        key=lambda x: x["importance"], reverse=True
    )[:10]
    metrics["top_features"] = top_features

    # Save pipeline + metadata bundle
    bundle = {"pipeline": pipeline, "metrics": metrics, "feature_cols": FEATURE_COLS}
    joblib.dump(bundle, MODEL_PATH)
    print(f"[ML] Model saved → {MODEL_PATH}")
    print(f"[ML] Accuracy={metrics['accuracy']:.4f}  AUC={metrics['roc_auc']:.4f}")
    print(f"[ML] F1={metrics['f1_score']:.4f}  Recall={metrics['recall']:.4f}")
    return metrics


def load_model() -> dict:
    """Load saved model bundle from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run: python train.py"
        )
    return joblib.load(MODEL_PATH)


def predict(features: dict, bundle: dict) -> dict:
    """
    Run prediction on a single sample.
    features: dict with API field names (v_g, ev_g, …)
    """
    pipeline = bundle["pipeline"]
    feature_cols = bundle["feature_cols"]

    # Map API names to CSV column names
    row = {}
    for api_name, csv_name in API_TO_CSV.items():
        row[csv_name] = features.get(api_name, np.nan)

    # Build DataFrame in correct column order
    X = pd.DataFrame([row])[feature_cols]

    prob = float(pipeline.predict_proba(X)[0][1])
    predicted = bool(pipeline.predict(X)[0])

    # Risk level thresholds
    if prob < 0.30:
        risk_level = "Low"
    elif prob < 0.60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # Impact level based on LOC + cyclomatic complexity
    loc = features.get("loc", 0) or 0
    vg = features.get("v_g", 1) or 1
    if loc > 300 or vg > 20:
        impact_level = "Critical"
    elif loc > 150 or vg > 10:
        impact_level = "Major"
    elif loc > 50 or vg > 5:
        impact_level = "Moderate"
    else:
        impact_level = "Minor"

    # Recommendations
    recommendations = _build_recommendations(risk_level, impact_level, features)

    # Top contributing features
    feature_contributions = {
        "loc": float(features.get("loc", 0)),
        "cyclomatic_complexity": float(features.get("v_g", 0)),
        "branch_count": float(features.get("branchCount", 0)),
        "halstead_effort": float(features.get("e", 0)),
    }

    return {
        "defect_probability": round(prob, 4),
        "risk_level": risk_level,
        "impact_level": impact_level,
        "defect_predicted": predicted,
        "confidence": round(max(prob, 1 - prob) * 100, 2),
        "recommendations": recommendations,
        "feature_contributions": feature_contributions,
    }


def _build_recommendations(risk: str, impact: str, features: dict) -> list:
    recs = []
    loc = features.get("loc", 0) or 0
    vg = features.get("v_g", 0) or 0
    ev_g = features.get("ev_g", 0) or 0
    branch = features.get("branchCount", 0) or 0

    if risk in ("Medium", "High"):
        recs.append("🔍 Mandatory peer code review required before merge")
    if risk == "High":
        recs.append("🛑 High-risk module — escalate to CCB for approval")
        recs.append("🧪 Require comprehensive test coverage (≥80%) before release")
    if vg > 10:
        recs.append(f"📉 Refactor to reduce cyclomatic complexity (current: {vg}, target: ≤10)")
    if loc > 200:
        recs.append(f"✂️  Split module — LOC ({loc}) exceeds recommended 200 lines")
    if ev_g > 5:
        recs.append("🔗 Reduce essential complexity — improve structured control flow")
    if branch > 15:
        recs.append(f"🌿 High branch count ({branch}) — simplify decision logic")
    if not recs:
        recs.append("✅ Module appears low-risk — standard review process sufficient")
    return recs
