"""
utils.py
========
Utility functions for the Placement Prediction System.
Provides helper functions for preprocessing, validation, recommendation
generation, report creation, and result formatting.

Author: Placement Prediction System
Version: 1.0.0
"""

import os
import io
import json
import logging
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import joblib
import numpy as np
import pandas as pd

from config import (
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    HIGH_CONFIDENCE_THRESHOLD,
    LOW_CONFIDENCE_THRESHOLD,
    MODEL_PATH,
    MODEL_METRICS_PATH,
    BEST_MODEL_NAME_PATH,
    PLACEMENT_RECOMMENDATIONS,
    SCALER_PATH,
    TARGET_DECODING,
    TARGET_ENCODING,
    VALIDATION_RULES,
    VALID_GENDERS,
    VALID_SSC_BOARDS,
    VALID_HSC_BOARDS,
    VALID_HSC_STREAMS,
    VALID_DEGREE_TYPES,
    VALID_WORK_EX,
    VALID_SPECIALISATIONS
)

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADING
# ─────────────────────────────────────────────────────────────────────────────

def load_model_artifacts() -> Tuple[Any, Any, Any, List[str]]:
    """
    Load trained model, encoder, scaler, and feature names from disk.

    Returns
    -------
    Tuple[model, encoder_map, scaler, feature_names]

    Raises
    ------
    FileNotFoundError
        If any required artifact file is missing.
    Exception
        If loading fails for any reason.
    """
    try:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model file not found: {MODEL_PATH}. "
                "Please run train_model.py first."
            )
        if not ENCODER_PATH.exists():
            raise FileNotFoundError(
                f"Encoder file not found: {ENCODER_PATH}. "
                "Please run train_model.py first."
            )
        if not SCALER_PATH.exists():
            raise FileNotFoundError(
                f"Scaler file not found: {SCALER_PATH}. "
                "Please run train_model.py first."
            )
        if not FEATURE_NAMES_PATH.exists():
            raise FileNotFoundError(
                f"Feature names file not found: {FEATURE_NAMES_PATH}. "
                "Please run train_model.py first."
            )

        model = joblib.load(MODEL_PATH)
        encoder_map = joblib.load(ENCODER_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_names = joblib.load(FEATURE_NAMES_PATH)

        logger.info("Model artifacts loaded successfully.")
        return model, encoder_map, scaler, feature_names

    except FileNotFoundError:
        raise
    except Exception as exc:
        logger.error("Failed to load model artifacts: %s", exc)
        raise RuntimeError(f"Model loading failed: {exc}") from exc


def load_model_metrics() -> Dict[str, Any]:
    """
    Load saved model comparison metrics from disk.

    Returns
    -------
    dict
        Dictionary of model_name -> metrics dict.
    """
    try:
        if MODEL_METRICS_PATH.exists():
            return joblib.load(MODEL_METRICS_PATH)
        return {}
    except Exception as exc:
        logger.warning("Could not load model metrics: %s", exc)
        return {}


def load_best_model_name() -> str:
    """
    Load the name of the best-performing model.

    Returns
    -------
    str
        Name of the best model, or 'Unknown' if not available.
    """
    try:
        if BEST_MODEL_NAME_PATH.exists():
            return joblib.load(BEST_MODEL_NAME_PATH)
        return "Unknown"
    except Exception as exc:
        logger.warning("Could not load best model name: %s", exc)
        return "Unknown"


# ─────────────────────────────────────────────────────────────────────────────
# INPUT VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def validate_form_input(form_data: Dict[str, str]) -> Tuple[bool, List[str]]:
    """
    Validate all form inputs from the prediction form.

    Parameters
    ----------
    form_data : dict
        Raw form data dictionary from Flask request.

    Returns
    -------
    Tuple[bool, List[str]]
        (is_valid, list_of_error_messages)
    """
    errors: List[str] = []

    # --- Categorical validations ---
    gender = form_data.get("gender", "").strip()
    if gender not in VALID_GENDERS:
        errors.append(f"Gender must be one of: {', '.join(VALID_GENDERS)}.")

    ssc_b = form_data.get("ssc_b", "").strip()
    if ssc_b not in VALID_SSC_BOARDS:
        errors.append(f"SSC Board must be one of: {', '.join(VALID_SSC_BOARDS)}.")

    hsc_b = form_data.get("hsc_b", "").strip()
    if hsc_b not in VALID_HSC_BOARDS:
        errors.append(f"HSC Board must be one of: {', '.join(VALID_HSC_BOARDS)}.")

    hsc_s = form_data.get("hsc_s", "").strip()
    if hsc_s not in VALID_HSC_STREAMS:
        errors.append(f"HSC Stream must be one of: {', '.join(VALID_HSC_STREAMS)}.")

    degree_t = form_data.get("degree_t", "").strip()
    if degree_t not in VALID_DEGREE_TYPES:
        errors.append(f"Degree Type must be one of: {', '.join(VALID_DEGREE_TYPES)}.")

    workex = form_data.get("workex", "").strip()
    if workex not in VALID_WORK_EX:
        errors.append(f"Work Experience must be one of: {', '.join(VALID_WORK_EX)}.")

    specialisation = form_data.get("specialisation", "").strip()
    if specialisation not in VALID_SPECIALISATIONS:
        errors.append(
            f"MBA Specialisation must be one of: {', '.join(VALID_SPECIALISATIONS)}."
        )

    # --- Numeric validations ---
    for field, rules in VALIDATION_RULES.items():
        raw_value = form_data.get(field, "").strip()
        if not raw_value:
            errors.append(f"{rules['label']} is required.")
            continue
        try:
            value = float(raw_value)
            if not (rules["min"] <= value <= rules["max"]):
                errors.append(
                    f"{rules['label']} must be between "
                    f"{rules['min']} and {rules['max']}."
                )
        except (ValueError, TypeError):
            errors.append(f"{rules['label']} must be a valid number.")

    return len(errors) == 0, errors


# ─────────────────────────────────────────────────────────────────────────────
# PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_input(
    form_data: Dict[str, str],
    encoder_map: Dict[str, Any],
    scaler: Any,
    feature_names: List[str]
) -> np.ndarray:
    """
    Preprocess raw form input into a feature vector for model inference.

    Parameters
    ----------
    form_data : dict
        Raw form data from the prediction form.
    encoder_map : dict
        Dictionary mapping column names to fitted encoders.
    scaler : sklearn scaler
        Fitted StandardScaler (or similar) for numeric features.
    feature_names : list
        Ordered list of feature names as used during training.

    Returns
    -------
    np.ndarray
        Preprocessed 2D feature array of shape (1, n_features).
    """
    row: Dict[str, Any] = {}

    # --- Binary encodings ---
    gender_val = form_data.get("gender", "M").strip()
    row["gender"] = 1 if gender_val == "M" else 0

    workex_val = form_data.get("workex", "No").strip()
    row["workex"] = 1 if workex_val == "Yes" else 0

    # --- Label encodings ---
    label_encoded_cols = ["ssc_b", "hsc_b", "hsc_s", "degree_t", "specialisation"]
    for col in label_encoded_cols:
        raw = form_data.get(col, "").strip()
        if col in encoder_map:
            le = encoder_map[col]
            try:
                encoded = le.transform([raw])[0]
            except ValueError:
                # Unknown category: fallback to 0
                encoded = 0
            row[col] = int(encoded)
        else:
            row[col] = 0

    # --- Numeric features ---
    numeric_fields = ["ssc_p", "hsc_p", "degree_p", "etest_p", "mba_p"]
    for field in numeric_fields:
        try:
            row[field] = float(form_data.get(field, 0))
        except (ValueError, TypeError):
            row[field] = 0.0

    # Build DataFrame with features in the correct order
    input_df = pd.DataFrame([row])

    # Ensure all expected columns exist (add missing with 0)
    for col in feature_names:
        if col not in input_df.columns:
            input_df[col] = 0

    # Reorder columns to match training order
    input_df = input_df[feature_names]

    # Scale numeric features
    try:
        input_scaled = scaler.transform(input_df)
    except Exception as exc:
        logger.warning("Scaler transform failed: %s. Using raw values.", exc)
        input_scaled = input_df.values

    return input_scaled


# ─────────────────────────────────────────────────────────────────────────────
# PREDICTION RESULT FORMATTING
# ─────────────────────────────────────────────────────────────────────────────

def format_prediction_result(
    prediction: int,
    probability: np.ndarray,
    form_data: Dict[str, str]
) -> Dict[str, Any]:
    """
    Build a rich result dictionary from raw prediction outputs.

    Parameters
    ----------
    prediction : int
        Raw model prediction (0 = Not Placed, 1 = Placed).
    probability : np.ndarray
        Model probability array of shape (1, 2) or (2,).
    form_data : dict
        Original form input data for display purposes.

    Returns
    -------
    dict
        Comprehensive result dictionary for template rendering.
    """
    # Flatten probability array
    probs = probability.flatten() if probability.ndim > 1 else probability
    not_placed_prob = float(probs[0]) if len(probs) > 1 else 1 - float(probs[0])
    placed_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])

    label = TARGET_DECODING.get(int(prediction), "Unknown")
    confidence = placed_prob if prediction == 1 else not_placed_prob
    confidence_pct = round(confidence * 100, 2)

    # Confidence level categorisation
    if confidence >= HIGH_CONFIDENCE_THRESHOLD:
        confidence_level = "High"
        confidence_color = "success"
        confidence_icon = "bi-shield-check"
    elif confidence >= LOW_CONFIDENCE_THRESHOLD:
        confidence_level = "Moderate"
        confidence_color = "warning"
        confidence_icon = "bi-shield-half"
    else:
        confidence_level = "Low"
        confidence_color = "danger"
        confidence_icon = "bi-shield-x"

    # Recommendation selection
    recommendations = _get_recommendations(prediction, confidence)

    # Build student profile display
    student_profile = _build_student_profile(form_data)

    return {
        "prediction": label,
        "prediction_raw": int(prediction),
        "is_placed": prediction == 1,
        "placed_probability": round(placed_prob * 100, 2),
        "not_placed_probability": round(not_placed_prob * 100, 2),
        "confidence": confidence_pct,
        "confidence_level": confidence_level,
        "confidence_color": confidence_color,
        "confidence_icon": confidence_icon,
        "recommendations": recommendations,
        "student_profile": student_profile,
        "timestamp": datetime.now().strftime("%d %B %Y, %I:%M %p"),
        "timestamp_raw": datetime.now().isoformat()
    }


def _get_recommendations(prediction: int, confidence: float) -> List[str]:
    """
    Return personalised placement recommendations.

    Parameters
    ----------
    prediction : int
        0 = Not Placed, 1 = Placed.
    confidence : float
        Confidence score between 0 and 1.

    Returns
    -------
    List[str]
        List of recommendation strings.
    """
    if prediction == 1:
        if confidence >= HIGH_CONFIDENCE_THRESHOLD:
            return PLACEMENT_RECOMMENDATIONS["high_confidence_placed"]
        return PLACEMENT_RECOMMENDATIONS["low_confidence_placed"]
    return PLACEMENT_RECOMMENDATIONS["not_placed"]


def _build_student_profile(form_data: Dict[str, str]) -> Dict[str, str]:
    """
    Build a displayable student profile dictionary from form data.

    Parameters
    ----------
    form_data : dict
        Raw form data.

    Returns
    -------
    dict
        Labeled profile entries for display.
    """
    gender_map = {"M": "Male", "F": "Female"}
    workex_map = {"Yes": "Yes", "No": "No"}

    profile = {
        "Gender": gender_map.get(form_data.get("gender", ""), form_data.get("gender", "N/A")),
        "SSC Percentage": f"{form_data.get('ssc_p', 'N/A')}%",
        "SSC Board": form_data.get("ssc_b", "N/A"),
        "HSC Percentage": f"{form_data.get('hsc_p', 'N/A')}%",
        "HSC Board": form_data.get("hsc_b", "N/A"),
        "HSC Stream": form_data.get("hsc_s", "N/A"),
        "Degree Percentage": f"{form_data.get('degree_p', 'N/A')}%",
        "Degree Type": form_data.get("degree_t", "N/A"),
        "Work Experience": workex_map.get(form_data.get("workex", ""), "N/A"),
        "Employability Test %": f"{form_data.get('etest_p', 'N/A')}%",
        "MBA Percentage": f"{form_data.get('mba_p', 'N/A')}%",
        "MBA Specialisation": form_data.get("specialisation", "N/A")
    }
    return profile


# ─────────────────────────────────────────────────────────────────────────────
# PREDICTION HISTORY MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def add_to_history(
    session_history: List[Dict],
    result: Dict[str, Any],
    max_size: int = 50
) -> List[Dict]:
    """
    Add a prediction result to the session-based history list.

    Parameters
    ----------
    session_history : list
        Existing history entries from the session.
    result : dict
        New prediction result to add.
    max_size : int
        Maximum number of history entries to retain.

    Returns
    -------
    List[dict]
        Updated history list.
    """
    history_entry = {
        "prediction": result.get("prediction"),
        "confidence": result.get("confidence"),
        "is_placed": result.get("is_placed"),
        "timestamp": result.get("timestamp"),
        "gender": result.get("student_profile", {}).get("Gender", "N/A"),
        "mba_p": result.get("student_profile", {}).get("MBA Percentage", "N/A"),
        "placed_probability": result.get("placed_probability"),
        "not_placed_probability": result.get("not_placed_probability")
    }

    updated_history = [history_entry] + session_history
    return updated_history[:max_size]


# ─────────────────────────────────────────────────────────────────────────────
# REPORT GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def generate_prediction_report(result: Dict[str, Any]) -> str:
    """
    Generate a human-readable text report for a prediction result.

    Parameters
    ----------
    result : dict
        Formatted prediction result dictionary.

    Returns
    -------
    str
        Plain-text report content.
    """
    divider = "=" * 65
    thin_divider = "-" * 65

    lines = [
        divider,
        "        CAMPUS PLACEMENT PREDICTION REPORT",
        "         Placement Prediction System v1.0.0",
        divider,
        f"  Report Generated : {result.get('timestamp', 'N/A')}",
        thin_divider,
        "",
        "  PREDICTION OUTCOME",
        thin_divider,
        f"  Result            : {result.get('prediction', 'N/A')}",
        f"  Placed Probability: {result.get('placed_probability', 0):.2f}%",
        f"  Not Placed Prob.  : {result.get('not_placed_probability', 0):.2f}%",
        f"  Confidence Score  : {result.get('confidence', 0):.2f}%",
        f"  Confidence Level  : {result.get('confidence_level', 'N/A')}",
        "",
        thin_divider,
        "  STUDENT PROFILE",
        thin_divider
    ]

    profile = result.get("student_profile", {})
    for key, value in profile.items():
        lines.append(f"  {key:<25} : {value}")

    lines += [
        "",
        thin_divider,
        "  PERSONALISED RECOMMENDATIONS",
        thin_divider
    ]

    recommendations = result.get("recommendations", [])
    for i, rec in enumerate(recommendations, 1):
        lines.append(f"  {i}. {rec}")

    lines += [
        "",
        divider,
        "  Disclaimer: This prediction is based on historical data",
        "  and machine learning models. It should be used as a",
        "  reference only and not as a definitive career decision.",
        divider,
        ""
    ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# STATISTICS HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def compute_dataset_stats() -> Dict[str, Any]:
    """
    Compute summary statistics from the dataset for display on the dashboard.

    Returns
    -------
    dict
        Dataset statistics dictionary.
    """
    from config import DATASET_PATH

    try:
        df = pd.read_csv(DATASET_PATH)

        total = len(df)
        placed = int((df["status"] == "Placed").sum())
        not_placed = total - placed
        placement_rate = round((placed / total) * 100, 2) if total > 0 else 0.0

        avg_ssc = round(df["ssc_p"].mean(), 2)
        avg_hsc = round(df["hsc_p"].mean(), 2)
        avg_degree = round(df["degree_p"].mean(), 2)
        avg_mba = round(df["mba_p"].mean(), 2)
        avg_etest = round(df["etest_p"].mean(), 2)

        return {
            "total_students": total,
            "placed_count": placed,
            "not_placed_count": not_placed,
            "placement_rate": placement_rate,
            "avg_ssc_p": avg_ssc,
            "avg_hsc_p": avg_hsc,
            "avg_degree_p": avg_degree,
            "avg_mba_p": avg_mba,
            "avg_etest_p": avg_etest,
            "male_count": int((df["gender"] == "M").sum()),
            "female_count": int((df["gender"] == "F").sum()),
            "with_workex": int((df["workex"] == "Yes").sum()),
            "without_workex": int((df["workex"] == "No").sum())
        }

    except Exception as exc:
        logger.error("Failed to compute dataset stats: %s", exc)
        return {
            "total_students": 215,
            "placed_count": 148,
            "not_placed_count": 67,
            "placement_rate": 68.84,
            "avg_ssc_p": 67.30,
            "avg_hsc_p": 66.33,
            "avg_degree_p": 66.37,
            "avg_mba_p": 62.28,
            "avg_etest_p": 72.10,
            "male_count": 139,
            "female_count": 76,
            "with_workex": 74,
            "without_workex": 141
        }


def format_metrics_for_display(metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Convert raw metrics dict to a list suitable for template display.

    Parameters
    ----------
    metrics : dict
        model_name -> {accuracy, precision, recall, f1, roc_auc}

    Returns
    -------
    List[dict]
        Sorted list of metric rows.
    """
    rows = []
    for model_name, m in metrics.items():
        rows.append({
            "model": model_name,
            "accuracy": round(float(m.get("accuracy", 0)) * 100, 2),
            "precision": round(float(m.get("precision", 0)) * 100, 2),
            "recall": round(float(m.get("recall", 0)) * 100, 2),
            "f1": round(float(m.get("f1", 0)) * 100, 2),
            "roc_auc": round(float(m.get("roc_auc", 0)) * 100, 2),
            "cv_score": round(float(m.get("cv_score", 0)) * 100, 2)
        })

    rows.sort(key=lambda x: x["accuracy"], reverse=True)
    return rows


def safe_json_serialize(obj: Any) -> Any:
    """
    Recursively convert numpy types to Python native types for JSON serialization.

    Parameters
    ----------
    obj : Any
        Object to serialize.

    Returns
    -------
    Any
        JSON-serializable object.
    """
    if isinstance(obj, dict):
        return {k: safe_json_serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [safe_json_serialize(i) for i in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj
