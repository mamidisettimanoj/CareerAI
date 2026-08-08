"""
train_model.py
==============
Model training pipeline for the Placement Prediction System.

This script performs complete end-to-end ML pipeline:
  1. Data loading and validation
  2. Preprocessing (missing values, encoding, scaling, feature engineering)
  3. EDA and visualization generation
  4. Multi-model training and cross-validation
  5. Model evaluation and comparison
  6. Best model selection and artifact persistence
  7. Comprehensive plot generation

Run this script once before launching the Flask application.

Usage
-----
    py -3 train_model.py

Author: Placement Prediction System
Version: 1.0.0
"""

import os
import sys
import warnings
import logging
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for server-side rendering
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
    ConfusionMatrixDisplay
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("TrainModel")

# ─────────────────────────────────────────────────────────────────────────────
# IMPORT PROJECT CONFIG
# ─────────────────────────────────────────────────────────────────────────────

from config import (
    BEST_MODEL_NAME_PATH,
    CATEGORICAL_COLUMNS,
    COLUMNS_TO_DROP,
    CV_FOLDS,
    DATASET_PATH,
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    FIGURE_SIZE,
    FIGURE_SIZE_WIDE,
    MODEL_METRICS_PATH,
    MODEL_PARAMS,
    MODEL_PATH,
    MODELS_DIR,
    NUMERIC_COLUMNS,
    PLOT_DPI,
    PLOT_FILES,
    PLOT_FORMAT,
    PLOT_STYLE,
    PLOTS_DIR,
    RANDOM_STATE,
    SCALER_PATH,
    TARGET_COLUMN,
    TARGET_DECODING,
    TARGET_ENCODING,
    TEST_SIZE
)


# ─────────────────────────────────────────────────────────────────────────────
# PALETTE
# ─────────────────────────────────────────────────────────────────────────────

PALETTE_MAIN = ["#4361ee", "#f72585"]
PALETTE_STATUS = {"Placed": "#4361ee", "Not Placed": "#f72585"}
PALETTE_MULTI = [
    "#4361ee", "#f72585", "#7209b7", "#3a0ca3",
    "#4cc9f0", "#06d6a0", "#ffd166", "#ef476f"
]


# ─────────────────────────────────────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────────────────────────────────────

def load_dataset() -> pd.DataFrame:
    """
    Load the Campus Selection dataset from disk.

    Returns
    -------
    pd.DataFrame
        Raw dataset.

    Raises
    ------
    FileNotFoundError
        If the dataset file does not exist.
    """
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {DATASET_PATH}\n"
            "Please place Campus_Selection.csv in the dataset/ directory."
        )

    df = pd.read_csv(DATASET_PATH)
    logger.info("Dataset loaded: %d rows, %d columns", *df.shape)
    logger.info("Columns: %s", df.columns.tolist())
    return df


# ─────────────────────────────────────────────────────────────────────────────
# PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def preprocess_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, Dict[str, LabelEncoder]]:
    """
    Full preprocessing pipeline: cleaning, encoding, and feature engineering.

    Steps
    -----
    1. Drop unused columns and ID columns.
    2. Remove duplicate rows.
    3. Handle missing values.
    4. Encode categorical columns.
    5. Encode target variable.
    6. Separate features and target.

    Parameters
    ----------
    df : pd.DataFrame
        Raw dataset.

    Returns
    -------
    Tuple[pd.DataFrame, pd.Series, Dict[str, LabelEncoder]]
        (X_features, y_target, encoder_map)
    """
    logger.info("Starting preprocessing pipeline...")

    df = df.copy()

    # --- Drop identifier and irrelevant columns ---
    cols_to_drop = [c for c in COLUMNS_TO_DROP if c in df.columns]
    if cols_to_drop:
        df.drop(columns=cols_to_drop, inplace=True)
        logger.info("Dropped columns: %s", cols_to_drop)

    # --- Remove duplicates ---
    before_dedup = len(df)
    df.drop_duplicates(inplace=True)
    after_dedup = len(df)
    logger.info("Removed %d duplicate rows.", before_dedup - after_dedup)

    # --- Handle missing values ---
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols_present = df.select_dtypes(include=["object"]).columns.tolist()

    if TARGET_COLUMN in categorical_cols_present:
        categorical_cols_present.remove(TARGET_COLUMN)

    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)
            logger.info("Filled missing numeric values in '%s' with median=%.2f", col, median_val)

    for col in categorical_cols_present:
        if df[col].isnull().any():
            mode_val = df[col].mode()[0]
            df[col].fillna(mode_val, inplace=True)
            logger.info("Filled missing categorical values in '%s' with mode='%s'", col, mode_val)

    # --- Encode target ---
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found in dataset.")

    df[TARGET_COLUMN] = df[TARGET_COLUMN].map(TARGET_ENCODING)
    missing_target = df[TARGET_COLUMN].isnull().sum()
    if missing_target > 0:
        logger.warning("%d rows with unknown target values will be dropped.", missing_target)
        df.dropna(subset=[TARGET_COLUMN], inplace=True)

    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(int)

    # --- Encode categorical features ---
    encoder_map: Dict[str, LabelEncoder] = {}

    for col, strategy in CATEGORICAL_COLUMNS.items():
        if col not in df.columns:
            logger.warning("Column '%s' not found; skipping encoding.", col)
            continue

        if strategy == "binary":
            # For gender: M->1, F->0; for workex: Yes->1, No->0
            if col == "gender":
                df[col] = (df[col].str.strip() == "M").astype(int)
            elif col == "workex":
                df[col] = (df[col].str.strip() == "Yes").astype(int)
            else:
                df[col] = (df[col].str.strip().str.lower() == "yes").astype(int)

        elif strategy == "label":
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoder_map[col] = le
            logger.info("Label-encoded '%s': classes=%s", col, le.classes_.tolist())

    # --- Separate X and y ---
    y = df[TARGET_COLUMN].copy()
    X = df.drop(columns=[TARGET_COLUMN])

    logger.info("Preprocessing complete. Features: %s", X.columns.tolist())
    logger.info("Target distribution:\n%s", y.value_counts().to_string())

    return X, y, encoder_map


# ─────────────────────────────────────────────────────────────────────────────
# VISUALIZATION HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _save_plot(fig: plt.Figure, path: Path) -> None:
    """Save a matplotlib figure to disk, creating parent directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=PLOT_DPI, bbox_inches="tight", format=PLOT_FORMAT)
    plt.close(fig)
    logger.info("Plot saved: %s", path.name)


def _apply_style() -> None:
    """Apply consistent plot style."""
    try:
        plt.style.use(PLOT_STYLE)
    except OSError:
        plt.style.use("seaborn-v0_8")


# ─────────────────────────────────────────────────────────────────────────────
# EDA VISUALIZATIONS
# ─────────────────────────────────────────────────────────────────────────────

def generate_eda_plots(raw_df: pd.DataFrame) -> None:
    """
    Generate and save all Exploratory Data Analysis visualizations.

    Parameters
    ----------
    raw_df : pd.DataFrame
        Raw (unencoded) dataset for interpretable category labels.
    """
    _apply_style()
    logger.info("Generating EDA visualizations...")

    # 1. Placement Distribution Pie Chart
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    status_counts = raw_df["status"].value_counts()
    colors_pie = [PALETTE_STATUS.get(s, "#888888") for s in status_counts.index]
    wedges, texts, autotexts = axes[0].pie(
        status_counts.values,
        labels=status_counts.index,
        autopct="%1.1f%%",
        colors=colors_pie,
        startangle=90,
        wedgeprops={"edgecolor": "white", "linewidth": 2}
    )
    for autotext in autotexts:
        autotext.set_fontsize(13)
        autotext.set_fontweight("bold")
    axes[0].set_title("Placement Distribution", fontsize=15, fontweight="bold", pad=15)

    # Gender vs Placement bar
    gender_status = raw_df.groupby(["gender", "status"]).size().unstack(fill_value=0)
    gender_status.plot(
        kind="bar", ax=axes[1], color=PALETTE_MAIN,
        edgecolor="white", linewidth=0.5, rot=0
    )
    axes[1].set_title("Gender vs Placement Status", fontsize=15, fontweight="bold", pad=15)
    axes[1].set_xlabel("Gender", fontsize=12)
    axes[1].set_ylabel("Count", fontsize=12)
    axes[1].legend(title="Status", fontsize=11)
    for container in axes[1].containers:
        axes[1].bar_label(container, fontsize=10)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["placement_pie"])

    # 2. SSC Score Distribution
    fig, axes = plt.subplots(1, 2, figsize=FIGURE_SIZE_WIDE)
    for ax, status_val in zip(axes, ["Placed", "Not Placed"]):
        subset = raw_df[raw_df["status"] == status_val]["ssc_p"]
        ax.hist(
            subset, bins=20, color=PALETTE_STATUS[status_val],
            edgecolor="white", alpha=0.85, linewidth=0.8
        )
        ax.axvline(subset.mean(), color="white", linestyle="--", linewidth=2,
                   label=f"Mean: {subset.mean():.1f}%")
        ax.set_title(f"SSC % Distribution - {status_val}", fontsize=13, fontweight="bold")
        ax.set_xlabel("SSC Percentage", fontsize=11)
        ax.set_ylabel("Count", fontsize=11)
        ax.legend(fontsize=11)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["ssc_distribution"])

    # 3. HSC Score Distribution
    fig, axes = plt.subplots(1, 2, figsize=FIGURE_SIZE_WIDE)
    for ax, status_val in zip(axes, ["Placed", "Not Placed"]):
        subset = raw_df[raw_df["status"] == status_val]["hsc_p"]
        ax.hist(
            subset, bins=20, color=PALETTE_STATUS[status_val],
            edgecolor="white", alpha=0.85, linewidth=0.8
        )
        ax.axvline(subset.mean(), color="white", linestyle="--", linewidth=2,
                   label=f"Mean: {subset.mean():.1f}%")
        ax.set_title(f"HSC % Distribution - {status_val}", fontsize=13, fontweight="bold")
        ax.set_xlabel("HSC Percentage", fontsize=11)
        ax.set_ylabel("Count", fontsize=11)
        ax.legend(fontsize=11)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["hsc_distribution"])

    # 4. Degree Score Distribution
    fig, axes = plt.subplots(1, 2, figsize=FIGURE_SIZE_WIDE)
    for ax, status_val in zip(axes, ["Placed", "Not Placed"]):
        subset = raw_df[raw_df["status"] == status_val]["degree_p"]
        ax.hist(
            subset, bins=20, color=PALETTE_STATUS[status_val],
            edgecolor="white", alpha=0.85, linewidth=0.8
        )
        ax.axvline(subset.mean(), color="white", linestyle="--", linewidth=2,
                   label=f"Mean: {subset.mean():.1f}%")
        ax.set_title(f"Degree % Distribution - {status_val}", fontsize=13, fontweight="bold")
        ax.set_xlabel("Degree Percentage", fontsize=11)
        ax.set_ylabel("Count", fontsize=11)
        ax.legend(fontsize=11)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["degree_distribution"])

    # 5. MBA Score Distribution
    fig, axes = plt.subplots(1, 2, figsize=FIGURE_SIZE_WIDE)
    for ax, status_val in zip(axes, ["Placed", "Not Placed"]):
        subset = raw_df[raw_df["status"] == status_val]["mba_p"]
        ax.hist(
            subset, bins=20, color=PALETTE_STATUS[status_val],
            edgecolor="white", alpha=0.85, linewidth=0.8
        )
        ax.axvline(subset.mean(), color="white", linestyle="--", linewidth=2,
                   label=f"Mean: {subset.mean():.1f}%")
        ax.set_title(f"MBA % Distribution - {status_val}", fontsize=13, fontweight="bold")
        ax.set_xlabel("MBA Percentage", fontsize=11)
        ax.set_ylabel("Count", fontsize=11)
        ax.legend(fontsize=11)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["mba_distribution"])

    # 6. Employability Test Distribution
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    for status_val, color in PALETTE_STATUS.items():
        subset = raw_df[raw_df["status"] == status_val]["etest_p"]
        ax.hist(subset, bins=20, color=color, edgecolor="white", alpha=0.75, linewidth=0.8,
                label=status_val)
    ax.set_title("Employability Test % Distribution by Placement", fontsize=14, fontweight="bold")
    ax.set_xlabel("Employability Test Percentage", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.legend(title="Status", fontsize=11)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["etest_distribution"])

    # 7. Specialisation vs Placement
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    spec_status = raw_df.groupby(["specialisation", "status"]).size().unstack(fill_value=0)
    spec_status.plot(kind="bar", ax=ax, color=PALETTE_MAIN, edgecolor="white", rot=0)
    ax.set_title("MBA Specialisation vs Placement Status", fontsize=14, fontweight="bold")
    ax.set_xlabel("Specialisation", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.legend(title="Status", fontsize=11)
    for container in ax.containers:
        ax.bar_label(container, fontsize=10)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["specialisation_placement"])

    # 8. Work Experience vs Placement
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    workex_status = raw_df.groupby(["workex", "status"]).size().unstack(fill_value=0)
    workex_status.plot(kind="bar", ax=ax, color=PALETTE_MAIN, edgecolor="white", rot=0)
    ax.set_title("Work Experience vs Placement Status", fontsize=14, fontweight="bold")
    ax.set_xlabel("Work Experience", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.legend(title="Status", fontsize=11)
    for container in ax.containers:
        ax.bar_label(container, fontsize=10)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["workex_placement"])

    # 9. Gender vs Placement (standalone)
    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    gender_status = raw_df.groupby(["gender", "status"]).size().unstack(fill_value=0)
    gender_status.plot(kind="bar", ax=ax, color=PALETTE_MAIN, edgecolor="white", rot=0)
    ax.set_title("Gender vs Placement Status", fontsize=14, fontweight="bold")
    ax.set_xlabel("Gender (M = Male, F = Female)", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.legend(title="Status", fontsize=11)
    for container in ax.containers:
        ax.bar_label(container, fontsize=10)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["gender_placement"])

    logger.info("EDA visualizations generated.")


def generate_correlation_heatmap(X: pd.DataFrame) -> None:
    """
    Generate and save the correlation heatmap for numeric features.

    Parameters
    ----------
    X : pd.DataFrame
        Encoded feature DataFrame.
    """
    _apply_style()

    numeric_X = X.select_dtypes(include=[np.number])
    corr_matrix = numeric_X.corr()

    fig, ax = plt.subplots(figsize=(12, 9))
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    sns.heatmap(
        corr_matrix,
        mask=mask,
        annot=True,
        fmt=".2f",
        cmap=cmap,
        center=0,
        vmin=-1,
        vmax=1,
        linewidths=0.5,
        linecolor="white",
        square=True,
        ax=ax,
        annot_kws={"size": 9}
    )
    ax.set_title("Feature Correlation Heatmap", fontsize=16, fontweight="bold", pad=20)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["correlation_heatmap"])


# ─────────────────────────────────────────────────────────────────────────────
# MODEL DEFINITIONS
# ─────────────────────────────────────────────────────────────────────────────

def build_models() -> Dict[str, Any]:
    """
    Instantiate all machine learning models with configured hyperparameters.

    Returns
    -------
    dict
        Mapping of model name -> sklearn estimator instance.
    """
    models: Dict[str, Any] = {
        "Logistic Regression": LogisticRegression(**MODEL_PARAMS["Logistic Regression"]),
        "Decision Tree": DecisionTreeClassifier(**MODEL_PARAMS["Decision Tree"]),
        "Random Forest": RandomForestClassifier(**MODEL_PARAMS["Random Forest"]),
        "Support Vector Machine": SVC(**MODEL_PARAMS["Support Vector Machine"]),
        "KNN": KNeighborsClassifier(**MODEL_PARAMS["KNN"]),
        "Naive Bayes": GaussianNB(**MODEL_PARAMS["Naive Bayes"]),
        "Gradient Boosting": GradientBoostingClassifier(**MODEL_PARAMS["Gradient Boosting"])
    }

    # XGBoost (optional)
    try:
        from xgboost import XGBClassifier
        models["XGBoost"] = XGBClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=RANDOM_STATE,
            eval_metric="logloss",
            n_jobs=-1
        )
        logger.info("XGBoost detected and added to model pipeline.")
    except ImportError:
        logger.info("XGBoost not installed; skipping.")

    return models


# ─────────────────────────────────────────────────────────────────────────────
# TRAINING AND EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def train_and_evaluate(
    models: Dict[str, Any],
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series
) -> Dict[str, Dict[str, float]]:
    """
    Train every model, evaluate on the test set, and compute cross-validation scores.

    Parameters
    ----------
    models : dict
        Name -> estimator mapping.
    X_train, X_test : pd.DataFrame
        Feature arrays.
    y_train, y_test : pd.Series
        Target arrays.

    Returns
    -------
    dict
        model_name -> {accuracy, precision, recall, f1, roc_auc, cv_score}
    """
    metrics: Dict[str, Dict[str, float]] = {}
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    print("\n" + "=" * 72)
    print(f"  {'MODEL':<28} {'ACC':>7} {'PREC':>7} {'REC':>7} {'F1':>7} {'AUC':>7} {'CV':>7}")
    print("=" * 72)

    for name, model in models.items():
        try:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            # Probability for AUC (fallback to decision function)
            if hasattr(model, "predict_proba"):
                y_prob = model.predict_proba(X_test)[:, 1]
            elif hasattr(model, "decision_function"):
                y_prob = model.decision_function(X_test)
            else:
                y_prob = y_pred.astype(float)

            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            try:
                auc = roc_auc_score(y_test, y_prob)
            except Exception:
                auc = 0.0

            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="accuracy")
            cv_mean = float(cv_scores.mean())

            metrics[name] = {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1": f1,
                "roc_auc": auc,
                "cv_score": cv_mean
            }

            print(
                f"  {name:<28} {acc*100:>6.2f}% {prec*100:>6.2f}% "
                f"{rec*100:>6.2f}% {f1*100:>6.2f}% {auc*100:>6.2f}% {cv_mean*100:>6.2f}%"
            )

        except Exception as exc:
            logger.error("Model '%s' training failed: %s", name, exc)
            traceback.print_exc()

    print("=" * 72 + "\n")
    return metrics


# ─────────────────────────────────────────────────────────────────────────────
# BEST MODEL SELECTION
# ─────────────────────────────────────────────────────────────────────────────

def select_best_model(
    models: Dict[str, Any],
    metrics: Dict[str, Dict[str, float]]
) -> Tuple[str, Any]:
    """
    Select the best performing model based on accuracy.

    Parameters
    ----------
    models : dict
        Trained model instances.
    metrics : dict
        Evaluation metrics per model.

    Returns
    -------
    Tuple[str, model]
        Name and instance of the best model.
    """
    best_name = max(metrics, key=lambda k: metrics[k]["accuracy"])
    best_model = models[best_name]
    best_acc = metrics[best_name]["accuracy"]
    logger.info("Best model: %s (Accuracy: %.4f)", best_name, best_acc)
    return best_name, best_model


# ─────────────────────────────────────────────────────────────────────────────
# POST-TRAINING VISUALIZATIONS
# ─────────────────────────────────────────────────────────────────────────────

def generate_confusion_matrix_plot(
    model: Any,
    X_test: np.ndarray,
    y_test: pd.Series,
    model_name: str
) -> None:
    """Generate and save the confusion matrix for the best model."""
    _apply_style()

    y_pred = model.predict(X_test)
    cm = confusion_matrix(y_test, y_pred)
    labels = ["Not Placed", "Placed"]

    fig, ax = plt.subplots(figsize=(8, 6))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    disp.plot(
        ax=ax,
        colorbar=True,
        cmap="Blues",
        values_format="d"
    )
    ax.set_title(
        f"Confusion Matrix — {model_name}",
        fontsize=14, fontweight="bold", pad=15
    )
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["confusion_matrix"])


def generate_roc_curve_plot(
    model: Any,
    X_test: np.ndarray,
    y_test: pd.Series,
    model_name: str
) -> None:
    """Generate and save the ROC curve for the best model."""
    _apply_style()

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    elif hasattr(model, "decision_function"):
        y_prob = model.decision_function(X_test)
    else:
        logger.warning("Model does not support probability output; skipping ROC curve.")
        return

    fpr, tpr, _ = roc_curve(y_test, y_prob)
    auc_score = roc_auc_score(y_test, y_prob)

    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    ax.plot(
        fpr, tpr,
        color="#4361ee",
        lw=2.5,
        label=f"{model_name} (AUC = {auc_score:.4f})"
    )
    ax.plot([0, 1], [0, 1], color="#888888", lw=1.5, linestyle="--", label="Random Classifier")
    ax.fill_between(fpr, tpr, alpha=0.15, color="#4361ee")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate", fontsize=13)
    ax.set_ylabel("True Positive Rate", fontsize=13)
    ax.set_title(f"ROC Curve — {model_name}", fontsize=15, fontweight="bold", pad=15)
    ax.legend(loc="lower right", fontsize=12)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["roc_curve"])


def generate_accuracy_comparison_plot(metrics: Dict[str, Dict[str, float]]) -> None:
    """Generate bar chart comparing model accuracies."""
    _apply_style()

    names = list(metrics.keys())
    accuracies = [metrics[n]["accuracy"] * 100 for n in names]
    sorted_pairs = sorted(zip(accuracies, names), reverse=True)
    sorted_acc, sorted_names = zip(*sorted_pairs)

    fig, ax = plt.subplots(figsize=FIGURE_SIZE_WIDE)
    bars = ax.barh(
        sorted_names,
        sorted_acc,
        color=PALETTE_MULTI[:len(sorted_names)],
        edgecolor="white",
        height=0.6
    )

    for bar, val in zip(bars, sorted_acc):
        ax.text(
            bar.get_width() + 0.3,
            bar.get_y() + bar.get_height() / 2,
            f"{val:.2f}%",
            va="center",
            ha="left",
            fontsize=11,
            fontweight="bold"
        )

    ax.set_xlabel("Accuracy (%)", fontsize=13)
    ax.set_title("Model Accuracy Comparison", fontsize=15, fontweight="bold", pad=15)
    ax.set_xlim(0, 110)
    ax.grid(axis="x", alpha=0.4)
    ax.invert_yaxis()
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["accuracy_comparison"])


def generate_full_model_comparison_plot(metrics: Dict[str, Dict[str, float]]) -> None:
    """Generate grouped bar chart comparing all metrics across all models."""
    _apply_style()

    metric_keys = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    metric_labels = ["Accuracy", "Precision", "Recall", "F1 Score", "ROC AUC"]
    model_names = list(metrics.keys())
    n_models = len(model_names)
    n_metrics = len(metric_keys)

    x = np.arange(n_models)
    width = 0.15

    fig, ax = plt.subplots(figsize=(16, 7))

    for i, (metric_key, metric_label) in enumerate(zip(metric_keys, metric_labels)):
        vals = [metrics[m][metric_key] * 100 for m in model_names]
        offset = (i - n_metrics / 2) * width + width / 2
        rects = ax.bar(
            x + offset, vals, width,
            label=metric_label,
            color=PALETTE_MULTI[i],
            edgecolor="white",
            linewidth=0.5,
            alpha=0.9
        )

    ax.set_xlabel("Model", fontsize=13)
    ax.set_ylabel("Score (%)", fontsize=13)
    ax.set_title("Full Model Performance Comparison", fontsize=15, fontweight="bold", pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(model_names, rotation=25, ha="right", fontsize=10)
    ax.legend(fontsize=11, loc="lower right")
    ax.set_ylim(0, 115)
    ax.grid(axis="y", alpha=0.4)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["model_comparison_full"])


def generate_feature_importance_plot(
    model: Any,
    feature_names: List[str],
    model_name: str
) -> None:
    """Generate and save feature importance plot for tree-based models."""
    _apply_style()

    if not hasattr(model, "feature_importances_"):
        # For non-tree models, attempt coefficient-based importance
        if hasattr(model, "coef_"):
            importances = np.abs(model.coef_[0])
        else:
            logger.info("Model '%s' does not support feature importance. Skipping.", model_name)
            return
    else:
        importances = model.feature_importances_

    indices = np.argsort(importances)[::-1]
    top_n = min(12, len(feature_names))
    top_indices = indices[:top_n]
    top_features = [feature_names[i] for i in top_indices]
    top_importances = importances[top_indices]

    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    colors = PALETTE_MULTI[:top_n]
    bars = ax.barh(
        top_features[::-1],
        top_importances[::-1],
        color=colors[::-1],
        edgecolor="white",
        height=0.65
    )

    for bar, val in zip(bars, top_importances[::-1]):
        ax.text(
            bar.get_width() + 0.002,
            bar.get_y() + bar.get_height() / 2,
            f"{val:.4f}",
            va="center",
            ha="left",
            fontsize=10
        )

    ax.set_xlabel("Feature Importance", fontsize=13)
    ax.set_title(
        f"Feature Importance — {model_name}",
        fontsize=14, fontweight="bold", pad=15
    )
    ax.set_xlim(0, max(top_importances) * 1.25)
    ax.grid(axis="x", alpha=0.4)
    plt.tight_layout()
    _save_plot(fig, PLOT_FILES["feature_importance"])


# ─────────────────────────────────────────────────────────────────────────────
# ARTIFACT PERSISTENCE
# ─────────────────────────────────────────────────────────────────────────────

def save_artifacts(
    model: Any,
    encoder_map: Dict[str, LabelEncoder],
    scaler: StandardScaler,
    feature_names: List[str],
    metrics: Dict[str, Dict[str, float]],
    best_model_name: str
) -> None:
    """
    Persist all model artifacts to disk.

    Parameters
    ----------
    model : sklearn estimator
        Best trained model.
    encoder_map : dict
        Fitted label encoders.
    scaler : StandardScaler
        Fitted scaler.
    feature_names : list
        Ordered feature name list.
    metrics : dict
        All model metrics.
    best_model_name : str
        Name of the best model.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder_map, ENCODER_PATH)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(feature_names, FEATURE_NAMES_PATH)
    joblib.dump(metrics, MODEL_METRICS_PATH)
    joblib.dump(best_model_name, BEST_MODEL_NAME_PATH)

    logger.info("All model artifacts saved to: %s", MODELS_DIR)
    logger.info("  Model        -> %s", MODEL_PATH.name)
    logger.info("  Encoder      -> %s", ENCODER_PATH.name)
    logger.info("  Scaler       -> %s", SCALER_PATH.name)
    logger.info("  Feature Names-> %s", FEATURE_NAMES_PATH.name)
    logger.info("  Metrics      -> %s", MODEL_METRICS_PATH.name)
    logger.info("  Best Name    -> %s", BEST_MODEL_NAME_PATH.name)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    """
    Entry point: run the full training pipeline.
    """
    print("\n" + "=" * 72)
    print("   PLACEMENT PREDICTION SYSTEM — MODEL TRAINING PIPELINE")
    print("=" * 72 + "\n")

    # 1. Load dataset
    logger.info("Step 1/8: Loading dataset...")
    raw_df = load_dataset()

    # 2. Generate EDA visualizations (using raw data for readable labels)
    logger.info("Step 2/8: Generating EDA visualizations...")
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)
    generate_eda_plots(raw_df)

    # 3. Preprocess
    logger.info("Step 3/8: Preprocessing data...")
    X, y, encoder_map = preprocess_data(raw_df)
    feature_names = X.columns.tolist()

    # 4. Correlation heatmap (after encoding)
    logger.info("Step 4/8: Generating correlation heatmap...")
    generate_correlation_heatmap(X)

    # 5. Train/test split + scaling
    logger.info("Step 5/8: Splitting and scaling data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    logger.info(
        "Train: %d samples | Test: %d samples | Features: %d",
        len(X_train), len(X_test), X_train.shape[1]
    )

    # 6. Build and train models
    logger.info("Step 6/8: Training models...")
    models = build_models()
    metrics = train_and_evaluate(models, X_train_scaled, X_test_scaled, y_train, y_test)

    # 7. Select best model
    logger.info("Step 7/8: Selecting best model...")
    best_name, best_model = select_best_model(models, metrics)

    # 8. Generate post-training plots
    logger.info("Step 8/8: Generating model evaluation plots...")
    generate_confusion_matrix_plot(best_model, X_test_scaled, y_test, best_name)
    generate_roc_curve_plot(best_model, X_test_scaled, y_test, best_name)
    generate_accuracy_comparison_plot(metrics)
    generate_full_model_comparison_plot(metrics)
    generate_feature_importance_plot(best_model, feature_names, best_name)

    # 9. Save artifacts
    save_artifacts(best_model, encoder_map, scaler, feature_names, metrics, best_name)

    print("\n" + "=" * 72)
    print(f"   TRAINING COMPLETE!")
    print(f"   Best Model  : {best_name}")
    print(f"   Accuracy    : {metrics[best_name]['accuracy']*100:.2f}%")
    print(f"   ROC AUC     : {metrics[best_name]['roc_auc']*100:.2f}%")
    print(f"   Artifacts   : {MODELS_DIR}")
    print(f"   Plots       : {PLOTS_DIR}")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    main()
