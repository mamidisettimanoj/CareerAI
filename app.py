"""
app.py
======
Flask web application entry point for the Placement Prediction System.

Routes
------
GET  /                     -> Landing page (index)
GET  /predict              -> Prediction form page
POST /predict              -> Handle form submission, run model inference
GET  /result               -> Display prediction result (redirect-safe)
GET  /dashboard            -> Analytics dashboard with charts and statistics
GET  /about                -> About page
GET  /download-report      -> Download prediction report as text file
404  error handler         -> Custom 404 page
500  error handler         -> Custom 500 page

Author: Placement Prediction System
Version: 1.0.0
"""

import io
import json
import logging
import os
import traceback
from datetime import datetime
from pathlib import Path

from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for
)

from config import (
    BEST_MODEL_NAME_PATH,
    ENCODER_PATH,
    FEATURE_NAMES_PATH,
    FlaskConfig,
    MODEL_PATH,
    MODELS_DIR,
    PLOT_FILES,
    PLOTS_DIR,
    SCALER_PATH,
    VALID_DEGREE_TYPES,
    VALID_GENDERS,
    VALID_HSC_BOARDS,
    VALID_HSC_STREAMS,
    VALID_SPECIALISATIONS,
    VALID_SSC_BOARDS,
    VALID_WORK_EX
)
from utils import (
    add_to_history,
    compute_dataset_stats,
    format_metrics_for_display,
    generate_prediction_report,
    load_best_model_name,
    load_model_metrics,
    safe_json_serialize
)
from predict import predict_placement

# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION FACTORY
# ─────────────────────────────────────────────────────────────────────────────

def create_app(config_class=FlaskConfig) -> Flask:
    """
    Flask application factory.

    Parameters
    ----------
    config_class : class
        Configuration class to use.

    Returns
    -------
    Flask
        Configured Flask application instance.
    """
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(config_class)

    # Register error handlers and routes
    _register_routes(app)
    _register_error_handlers(app)

    return app


# ─────────────────────────────────────────────────────────────────────────────
# CONTEXT PROCESSORS
# ─────────────────────────────────────────────────────────────────────────────

def _context_defaults() -> dict:
    """Return template context variables available globally."""
    return {
        "app_name": FlaskConfig.APP_NAME,
        "app_version": FlaskConfig.APP_VERSION,
        "app_year": FlaskConfig.APP_YEAR,
        "current_year": datetime.now().year
    }


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────

def _register_routes(app: Flask) -> None:
    """Register all application routes."""

    @app.context_processor
    def inject_globals():
        return _context_defaults()

    # ── INDEX / LANDING PAGE ──────────────────────────────────────────────────
    @app.route("/")
    def index():
        """Render the professional landing page."""
        stats = compute_dataset_stats()
        best_model_name = load_best_model_name()
        metrics = load_model_metrics()

        top_accuracy = 0.0
        if metrics:
            top_accuracy = max(m.get("accuracy", 0) for m in metrics.values()) * 100

        return render_template(
            "index.html",
            stats=stats,
            best_model_name=best_model_name,
            top_accuracy=round(top_accuracy, 2),
            models_trained=len(metrics)
        )

    # ── PREDICTION FORM PAGE ──────────────────────────────────────────────────
    @app.route("/predict", methods=["GET"])
    def predict_form():
        """Render the prediction input form."""
        return render_template(
            "predict.html",
            genders=VALID_GENDERS,
            ssc_boards=VALID_SSC_BOARDS,
            hsc_boards=VALID_HSC_BOARDS,
            hsc_streams=VALID_HSC_STREAMS,
            degree_types=VALID_DEGREE_TYPES,
            work_exp=VALID_WORK_EX,
            specialisations=VALID_SPECIALISATIONS
        )

    # ── PREDICTION SUBMISSION ─────────────────────────────────────────────────
    @app.route("/predict", methods=["POST"])
    def predict_submit():
        """Process the submitted prediction form."""
        form_data = {
            "gender": request.form.get("gender", "").strip(),
            "ssc_p": request.form.get("ssc_p", "").strip(),
            "ssc_b": request.form.get("ssc_b", "").strip(),
            "hsc_p": request.form.get("hsc_p", "").strip(),
            "hsc_b": request.form.get("hsc_b", "").strip(),
            "hsc_s": request.form.get("hsc_s", "").strip(),
            "degree_p": request.form.get("degree_p", "").strip(),
            "degree_t": request.form.get("degree_t", "").strip(),
            "workex": request.form.get("workex", "").strip(),
            "etest_p": request.form.get("etest_p", "").strip(),
            "mba_p": request.form.get("mba_p", "").strip(),
            "specialisation": request.form.get("specialisation", "").strip()
        }

        result = predict_placement(form_data)

        if result.get("error"):
            for error_msg in result.get("error_messages", []):
                flash(error_msg, "danger")
            return render_template(
                "predict.html",
                genders=VALID_GENDERS,
                ssc_boards=VALID_SSC_BOARDS,
                hsc_boards=VALID_HSC_BOARDS,
                hsc_streams=VALID_HSC_STREAMS,
                degree_types=VALID_DEGREE_TYPES,
                work_exp=VALID_WORK_EX,
                specialisations=VALID_SPECIALISATIONS,
                form_data=form_data
            )

        # Store result in session
        session["last_result"] = safe_json_serialize(result)

        # Update prediction history
        history = session.get("prediction_history", [])
        session["prediction_history"] = add_to_history(
            history, result, max_size=FlaskConfig.MAX_HISTORY_SIZE
        )
        session.modified = True

        flash("Prediction completed successfully!", "success")
        return redirect(url_for("result"))

    # ── RESULT PAGE ───────────────────────────────────────────────────────────
    @app.route("/result")
    def result():
        """Display the most recent prediction result."""
        last_result = session.get("last_result")

        if not last_result:
            flash("No prediction result found. Please submit the form first.", "warning")
            return redirect(url_for("predict_form"))

        best_model_name = load_best_model_name()
        metrics = load_model_metrics()
        best_accuracy = 0.0
        if metrics and best_model_name in metrics:
            best_accuracy = round(metrics[best_model_name].get("accuracy", 0) * 100, 2)

        return render_template(
            "result.html",
            result=last_result,
            best_model_name=best_model_name,
            best_accuracy=best_accuracy
        )

    # ── DASHBOARD ─────────────────────────────────────────────────────────────
    @app.route("/dashboard")
    def dashboard():
        """Render the analytics dashboard."""
        stats = compute_dataset_stats()
        raw_metrics = load_model_metrics()
        metrics_table = format_metrics_for_display(raw_metrics)
        best_model_name = load_best_model_name()
        history = session.get("prediction_history", [])

        # Determine which plots are available
        available_plots = {}
        for plot_key, plot_path in PLOT_FILES.items():
            available_plots[plot_key] = plot_path.exists()

        # Build chart data for JS charts
        model_chart_data = _build_model_chart_data(raw_metrics)

        return render_template(
            "dashboard.html",
            stats=stats,
            metrics_table=metrics_table,
            best_model_name=best_model_name,
            history=history,
            available_plots=available_plots,
            model_chart_data=json.dumps(safe_json_serialize(model_chart_data))
        )

    # ── ABOUT PAGE ────────────────────────────────────────────────────────────
    @app.route("/about")
    def about():
        """Render the about page."""
        metrics = load_model_metrics()
        metrics_table = format_metrics_for_display(metrics)
        best_model_name = load_best_model_name()
        return render_template(
            "about.html",
            metrics_table=metrics_table,
            best_model_name=best_model_name
        )

    # ── DOWNLOAD REPORT ───────────────────────────────────────────────────────
    @app.route("/download-report")
    def download_report():
        """Generate and stream the prediction report as a text download."""
        last_result = session.get("last_result")

        if not last_result:
            flash("No result to download. Please make a prediction first.", "warning")
            return redirect(url_for("predict_form"))

        report_text = generate_prediction_report(last_result)
        buffer = io.BytesIO(report_text.encode("utf-8"))
        buffer.seek(0)

        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"placement_prediction_report_{timestamp_str}.txt"

        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype="text/plain"
        )

    # ── CLEAR HISTORY ─────────────────────────────────────────────────────────
    @app.route("/clear-history", methods=["POST"])
    def clear_history():
        """Clear the prediction history from session."""
        session.pop("prediction_history", None)
        flash("Prediction history cleared.", "info")
        return redirect(url_for("dashboard"))

    # ── API: MODEL STATUS ─────────────────────────────────────────────────────
    @app.route("/api/status")
    def api_status():
        """JSON API endpoint for model status check."""
        model_ready = all([
            MODEL_PATH.exists(),
            ENCODER_PATH.exists(),
            SCALER_PATH.exists(),
            FEATURE_NAMES_PATH.exists()
        ])
        metrics = load_model_metrics()
        best_model_name = load_best_model_name()

        return jsonify({
            "status": "ready" if model_ready else "not_trained",
            "model_ready": model_ready,
            "best_model": best_model_name,
            "models_trained": len(metrics),
            "timestamp": datetime.now().isoformat()
        })

    # ── API: METRICS ──────────────────────────────────────────────────────────
    @app.route("/api/metrics")
    def api_metrics():
        """JSON API endpoint for model metrics."""
        raw_metrics = load_model_metrics()
        return jsonify(safe_json_serialize(raw_metrics))


# ─────────────────────────────────────────────────────────────────────────────
# ERROR HANDLERS
# ─────────────────────────────────────────────────────────────────────────────

def _register_error_handlers(app: Flask) -> None:
    """Register custom error handlers for 404 and 500."""

    @app.errorhandler(404)
    def page_not_found(error):
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        logging.error("500 error: %s\n%s", error, traceback.format_exc())
        return render_template("500.html"), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        logging.error("Unexpected error: %s\n%s", error, traceback.format_exc())
        return render_template("500.html"), 500


# ─────────────────────────────────────────────────────────────────────────────
# CHART DATA HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _build_model_chart_data(metrics: dict) -> dict:
    """
    Build chart-ready data structure from model metrics.

    Parameters
    ----------
    metrics : dict
        Raw model metrics dict.

    Returns
    -------
    dict
        Chart data with labels and datasets.
    """
    if not metrics:
        return {"labels": [], "accuracy": [], "f1": [], "roc_auc": []}

    labels = list(metrics.keys())
    accuracy = [round(metrics[m].get("accuracy", 0) * 100, 2) for m in labels]
    precision = [round(metrics[m].get("precision", 0) * 100, 2) for m in labels]
    recall = [round(metrics[m].get("recall", 0) * 100, 2) for m in labels]
    f1 = [round(metrics[m].get("f1", 0) * 100, 2) for m in labels]
    roc_auc = [round(metrics[m].get("roc_auc", 0) * 100, 2) for m in labels]
    cv_score = [round(metrics[m].get("cv_score", 0) * 100, 2) for m in labels]

    return {
        "labels": labels,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "cv_score": cv_score
    }


# ─────────────────────────────────────────────────────────────────────────────
# APPLICATION ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

# Determine which config to use based on environment variable
_config_env = os.environ.get("FLASK_ENV", "development")
from config import CONFIG_MAP
_active_config = CONFIG_MAP.get(_config_env, CONFIG_MAP["default"])

app = create_app(_active_config)

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
    )
    logger = logging.getLogger("app")

    # Check if model is trained
    if not MODEL_PATH.exists():
        logger.warning(
            "Model not found. Please run 'py -3 train_model.py' first."
        )

    logger.info("Starting Placement Prediction System...")
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=_active_config.DEBUG
    )
