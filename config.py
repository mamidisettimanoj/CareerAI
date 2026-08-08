"""
config.py
=========
Central configuration module for the Placement Prediction System.
All application-wide settings, paths, model parameters, and constants
are defined here to ensure single-source-of-truth configuration management.

Author: Placement Prediction System
Version: 1.0.0
"""

import os
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# BASE PATHS
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent

DATASET_DIR = BASE_DIR / "dataset"
MODELS_DIR = BASE_DIR / "models"
STATIC_DIR = BASE_DIR / "static"
PLOTS_DIR = STATIC_DIR / "plots"
TEMPLATES_DIR = BASE_DIR / "templates"
IMAGES_DIR = STATIC_DIR / "images"

# ─────────────────────────────────────────────────────────────────────────────
# DATASET CONFIG
# ─────────────────────────────────────────────────────────────────────────────

DATASET_PATH = DATASET_DIR / "Campus_Selection.csv"

# The column used as the target/label variable
TARGET_COLUMN = "status"

# Columns to drop before training (identifiers, leakage columns, etc.)
COLUMNS_TO_DROP = ["sl_no", "salary"]

# Column encoding map: column_name -> encoding strategy
# Strategies: "label", "onehot", "binary"
CATEGORICAL_COLUMNS = {
    "gender": "binary",       # M/F -> 1/0
    "ssc_b": "label",         # SSC Board
    "hsc_b": "label",         # HSC Board
    "hsc_s": "label",         # HSC Stream
    "degree_t": "label",      # Degree Type
    "workex": "binary",       # Yes/No -> 1/0
    "specialisation": "label" # MBA Specialisation
}

# Target encoding: Placed -> 1, Not Placed -> 0
TARGET_ENCODING = {"Placed": 1, "Not Placed": 0}
TARGET_DECODING = {1: "Placed", 0: "Not Placed"}

# Numeric columns (after encoding)
NUMERIC_COLUMNS = ["ssc_p", "hsc_p", "degree_p", "etest_p", "mba_p"]

# ─────────────────────────────────────────────────────────────────────────────
# MODEL ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────

MODEL_PATH = MODELS_DIR / "placement_model.pkl"
ENCODER_PATH = MODELS_DIR / "encoder.pkl"
SCALER_PATH = MODELS_DIR / "scaler.pkl"
FEATURE_NAMES_PATH = MODELS_DIR / "feature_names.pkl"
MODEL_METRICS_PATH = MODELS_DIR / "model_metrics.pkl"
BEST_MODEL_NAME_PATH = MODELS_DIR / "best_model_name.pkl"

# ─────────────────────────────────────────────────────────────────────────────
# TRAINING CONFIG
# ─────────────────────────────────────────────────────────────────────────────

TEST_SIZE = 0.20          # 80/20 split
RANDOM_STATE = 42         # Reproducibility seed
CV_FOLDS = 5              # Cross-validation folds

# ─────────────────────────────────────────────────────────────────────────────
# MODEL HYPERPARAMETERS
# ─────────────────────────────────────────────────────────────────────────────

MODEL_PARAMS = {
    "Logistic Regression": {
        "max_iter": 1000,
        "random_state": RANDOM_STATE,
        "solver": "lbfgs",
        "C": 1.0
    },
    "Decision Tree": {
        "max_depth": 10,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "random_state": RANDOM_STATE
    },
    "Random Forest": {
        "n_estimators": 200,
        "max_depth": 15,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "random_state": RANDOM_STATE,
        "n_jobs": -1
    },
    "Support Vector Machine": {
        "kernel": "rbf",
        "C": 1.0,
        "gamma": "scale",
        "probability": True,
        "random_state": RANDOM_STATE
    },
    "KNN": {
        "n_neighbors": 7,
        "metric": "minkowski",
        "weights": "uniform"
    },
    "Naive Bayes": {},
    "Gradient Boosting": {
        "n_estimators": 200,
        "learning_rate": 0.1,
        "max_depth": 5,
        "random_state": RANDOM_STATE
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# PLOT CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

PLOT_STYLE = "seaborn-v0_8-darkgrid"
PLOT_DPI = 150
PLOT_FORMAT = "png"
FIGURE_SIZE = (10, 7)
FIGURE_SIZE_WIDE = (14, 7)

PLOT_FILES = {
    "confusion_matrix": PLOTS_DIR / "confusion_matrix.png",
    "roc_curve": PLOTS_DIR / "roc_curve.png",
    "accuracy_comparison": PLOTS_DIR / "accuracy_comparison.png",
    "feature_importance": PLOTS_DIR / "feature_importance.png",
    "placement_pie": PLOTS_DIR / "placement_pie.png",
    "ssc_distribution": PLOTS_DIR / "ssc_distribution.png",
    "hsc_distribution": PLOTS_DIR / "hsc_distribution.png",
    "degree_distribution": PLOTS_DIR / "degree_distribution.png",
    "correlation_heatmap": PLOTS_DIR / "correlation_heatmap.png",
    "mba_distribution": PLOTS_DIR / "mba_distribution.png",
    "gender_placement": PLOTS_DIR / "gender_placement.png",
    "specialisation_placement": PLOTS_DIR / "specialisation_placement.png",
    "workex_placement": PLOTS_DIR / "workex_placement.png",
    "etest_distribution": PLOTS_DIR / "etest_distribution.png",
    "model_comparison_full": PLOTS_DIR / "model_comparison_full.png"
}

# ─────────────────────────────────────────────────────────────────────────────
# FLASK APPLICATION CONFIG
# ─────────────────────────────────────────────────────────────────────────────

class FlaskConfig:
    """Flask application configuration class."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "pps-secure-secret-key-2024-placement-system")
    DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    TESTING = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload

    # Session config
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True

    # Prediction history max size (stored in session)
    MAX_HISTORY_SIZE = 50

    # Application metadata
    APP_NAME = "Placement Prediction System"
    APP_VERSION = "1.0.0"
    APP_DESCRIPTION = "AI-Powered Campus Placement Prediction"
    APP_AUTHOR = "PPS Team"
    APP_YEAR = "2024"


class DevelopmentConfig(FlaskConfig):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(FlaskConfig):
    """Production configuration."""
    DEBUG = False
    SESSION_COOKIE_SECURE = True


# Active config selector
CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}

# ─────────────────────────────────────────────────────────────────────────────
# INPUT VALIDATION RANGES
# ─────────────────────────────────────────────────────────────────────────────

VALIDATION_RULES = {
    "ssc_p": {"min": 0.0, "max": 100.0, "label": "SSC Percentage"},
    "hsc_p": {"min": 0.0, "max": 100.0, "label": "HSC Percentage"},
    "degree_p": {"min": 0.0, "max": 100.0, "label": "Degree Percentage"},
    "etest_p": {"min": 0.0, "max": 100.0, "label": "Employability Test Percentage"},
    "mba_p": {"min": 0.0, "max": 100.0, "label": "MBA Percentage"}
}

VALID_GENDERS = ["M", "F"]
VALID_SSC_BOARDS = ["Central", "Others"]
VALID_HSC_BOARDS = ["Central", "Others"]
VALID_HSC_STREAMS = ["Commerce", "Science", "Arts"]
VALID_DEGREE_TYPES = ["Sci&Tech", "Comm&Mgmt", "Others"]
VALID_WORK_EX = ["Yes", "No"]
VALID_SPECIALISATIONS = ["Mkt&HR", "Mkt&Fin"]

# ─────────────────────────────────────────────────────────────────────────────
# RECOMMENDATION ENGINE CONFIG
# ─────────────────────────────────────────────────────────────────────────────

PLACEMENT_RECOMMENDATIONS = {
    "high_confidence_placed": [
        "Congratulations! Your profile strongly suggests a successful placement.",
        "Focus on interview preparation and communication skills.",
        "Research companies aligning with your specialisation.",
        "Build a strong portfolio of projects to showcase your skills.",
        "Practice mock interviews and group discussions."
    ],
    "low_confidence_placed": [
        "Your profile shows moderate placement potential.",
        "Consider strengthening your technical and soft skills.",
        "Work on improving your MBA percentage if possible.",
        "Gain relevant internship or project experience.",
        "Attend workshops and certification programs."
    ],
    "not_placed": [
        "Don't be discouraged — focus on skill development.",
        "Consider pursuing additional certifications in your field.",
        "Work on improving academic percentages through supplementary courses.",
        "Seek mentorship from industry professionals.",
        "Participate in hackathons, competitions, and open-source projects.",
        "Develop strong communication and problem-solving skills.",
        "Consider internship opportunities for practical experience."
    ]
}

# Score thresholds for confidence categorization
HIGH_CONFIDENCE_THRESHOLD = 0.75
LOW_CONFIDENCE_THRESHOLD = 0.50
