"""
predict.py
==========
Inference module for the Placement Prediction System.
Provides a standalone prediction function usable both by the Flask
application and as a command-line tool.

Usage (CLI)
-----------
    py -3 predict.py

Author: Placement Prediction System
Version: 1.0.0
"""

import sys
import logging
from typing import Any, Dict, Optional

import numpy as np

from config import TARGET_DECODING
from utils import (
    format_prediction_result,
    load_model_artifacts,
    preprocess_input,
    validate_form_input
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# CORE PREDICTION FUNCTION
# ─────────────────────────────────────────────────────────────────────────────

def predict_placement(form_data: Dict[str, str]) -> Dict[str, Any]:
    """
    End-to-end placement prediction from raw form data.

    This function:
    1. Validates all input fields.
    2. Loads model artifacts (model, encoder, scaler, feature_names).
    3. Preprocesses the input into the correct feature vector.
    4. Makes a prediction and extracts probabilities.
    5. Returns a comprehensive result dictionary.

    Parameters
    ----------
    form_data : dict
        Raw form data, e.g.:
        {
            "gender": "M",
            "ssc_p": "75.5",
            "ssc_b": "Others",
            "hsc_p": "68.0",
            "hsc_b": "Others",
            "hsc_s": "Science",
            "degree_p": "72.0",
            "degree_t": "Sci&Tech",
            "workex": "No",
            "etest_p": "65.0",
            "mba_p": "60.5",
            "specialisation": "Mkt&HR"
        }

    Returns
    -------
    dict
        Result dictionary with keys:
        - prediction (str): "Placed" / "Not Placed"
        - prediction_raw (int): 1 / 0
        - is_placed (bool)
        - placed_probability (float): 0-100
        - not_placed_probability (float): 0-100
        - confidence (float): 0-100
        - confidence_level (str): High / Moderate / Low
        - confidence_color (str): Bootstrap color class
        - confidence_icon (str): Bootstrap icon class
        - recommendations (list[str])
        - student_profile (dict)
        - timestamp (str)
        - timestamp_raw (str)
        - error (str): only present if validation or prediction failed

    Raises
    ------
    RuntimeError
        If model artifacts cannot be loaded.
    ValueError
        If input validation fails.
    """
    # --- Validate inputs ---
    is_valid, errors = validate_form_input(form_data)
    if not is_valid:
        return {
            "error": True,
            "error_messages": errors,
            "prediction": None,
            "is_placed": False
        }

    # --- Load artifacts ---
    try:
        model, encoder_map, scaler, feature_names = load_model_artifacts()
    except (FileNotFoundError, RuntimeError) as exc:
        logger.error("Artifact loading failed: %s", exc)
        return {
            "error": True,
            "error_messages": [str(exc)],
            "prediction": None,
            "is_placed": False
        }

    # --- Preprocess input ---
    try:
        X_input = preprocess_input(form_data, encoder_map, scaler, feature_names)
    except Exception as exc:
        logger.error("Preprocessing failed: %s", exc)
        return {
            "error": True,
            "error_messages": [f"Input preprocessing failed: {exc}"],
            "prediction": None,
            "is_placed": False
        }

    # --- Predict ---
    try:
        prediction = model.predict(X_input)[0]

        if hasattr(model, "predict_proba"):
            probability = model.predict_proba(X_input)[0]
        elif hasattr(model, "decision_function"):
            raw_score = model.decision_function(X_input)[0]
            # Sigmoid transform for SVM-like models
            sigmoid_score = 1 / (1 + np.exp(-raw_score))
            probability = np.array([1 - sigmoid_score, sigmoid_score])
        else:
            # Fallback: deterministic probability
            probability = np.array([0.0, 1.0]) if prediction == 1 else np.array([1.0, 0.0])

        logger.info(
            "Prediction: %s | Probability: [%.4f, %.4f]",
            TARGET_DECODING.get(int(prediction), "Unknown"),
            probability[0],
            probability[1]
        )

    except Exception as exc:
        logger.error("Prediction failed: %s", exc)
        return {
            "error": True,
            "error_messages": [f"Model prediction failed: {exc}"],
            "prediction": None,
            "is_placed": False
        }

    # --- Format and return result ---
    result = format_prediction_result(int(prediction), probability, form_data)
    result["error"] = False
    return result


# ─────────────────────────────────────────────────────────────────────────────
# CLI INTERFACE
# ─────────────────────────────────────────────────────────────────────────────

def cli_predict() -> None:
    """
    Interactive command-line prediction interface.
    Prompts the user for student details and displays the prediction result.
    """
    print("\n" + "=" * 60)
    print("   PLACEMENT PREDICTION SYSTEM — CLI Mode")
    print("=" * 60)
    print("Enter student details below (press Ctrl+C to exit):\n")

    def prompt(label: str, options: Optional[list] = None, default: str = "") -> str:
        hint = f" [{'/'.join(options)}]" if options else ""
        value = input(f"  {label}{hint}: ").strip()
        return value if value else default

    try:
        form_data = {
            "gender": prompt("Gender", ["M", "F"]),
            "ssc_p": prompt("SSC Percentage (e.g., 75.5)"),
            "ssc_b": prompt("SSC Board", ["Central", "Others"]),
            "hsc_p": prompt("HSC Percentage (e.g., 68.0)"),
            "hsc_b": prompt("HSC Board", ["Central", "Others"]),
            "hsc_s": prompt("HSC Stream", ["Commerce", "Science", "Arts"]),
            "degree_p": prompt("Degree Percentage (e.g., 72.0)"),
            "degree_t": prompt("Degree Type", ["Sci&Tech", "Comm&Mgmt", "Others"]),
            "workex": prompt("Work Experience", ["Yes", "No"]),
            "etest_p": prompt("Employability Test % (e.g., 65.0)"),
            "mba_p": prompt("MBA Percentage (e.g., 60.5)"),
            "specialisation": prompt("MBA Specialisation", ["Mkt&HR", "Mkt&Fin"])
        }

        result = predict_placement(form_data)

        print("\n" + "=" * 60)
        print("   PREDICTION RESULT")
        print("=" * 60)

        if result.get("error"):
            print("\n  [ERROR] Input validation failed:")
            for err in result.get("error_messages", []):
                print(f"    - {err}")
        else:
            print(f"\n  Prediction       : {result['prediction']}")
            print(f"  Placed Prob.     : {result['placed_probability']:.2f}%")
            print(f"  Not Placed Prob. : {result['not_placed_probability']:.2f}%")
            print(f"  Confidence       : {result['confidence']:.2f}% ({result['confidence_level']})")
            print(f"\n  Recommendations:")
            for i, rec in enumerate(result.get("recommendations", []), 1):
                print(f"    {i}. {rec}")

        print("=" * 60 + "\n")

    except KeyboardInterrupt:
        print("\n\n  [INFO] Exiting prediction CLI.")
        sys.exit(0)


if __name__ == "__main__":
    cli_predict()
