# 🎓 Placement Prediction System

> **AI-Powered Campus Placement Prediction using Machine Learning**

[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green?logo=flask)](https://flask.palletsprojects.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-orange?logo=scikit-learn)](https://scikit-learn.org)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple?logo=bootstrap)](https://getbootstrap.com)

---

## 📋 Project Overview

The **Placement Prediction System** is an industry-grade machine learning web application that predicts
whether a student will receive a campus placement offer based on academic performance, work experience,
and MBA specialisation data.

The system trains **7+ machine learning models**, evaluates them using **5-fold cross-validation**,
automatically selects the best performing model, and provides predictions through a beautiful
**glassmorphism Flask web interface**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Model Training** | Trains 7+ ML models (LR, DT, RF, SVM, KNN, NB, GB, XGBoost) |
| 📊 **Auto Model Selection** | Picks the best model based on accuracy + cross-validation |
| 📈 **Rich Analytics** | Confusion matrix, ROC curve, feature importance, correlation heatmap |
| 🎯 **High Accuracy** | Achieves up to 92%+ accuracy on test data |
| 💡 **Smart Recommendations** | Personalised career advice per prediction outcome |
| 📥 **Report Download** | Download full prediction report as text file |
| 📱 **Responsive Design** | Mobile-first glassmorphism UI with animations |
| 🔒 **Input Validation** | Comprehensive server-side and client-side validation |
| 📜 **Prediction History** | Session-based tracking of past predictions |
| ⚡ **REST API** | `/api/status` and `/api/metrics` endpoints |

---

## 🗂️ Folder Structure

```
PLACEMENT_PREDICTION_SYSTEM/
├── dataset/
│   └── Campus_Selection.csv          # Training dataset
├── models/
│   ├── placement_model.pkl           # Best trained model
│   ├── encoder.pkl                   # Label encoders
│   ├── scaler.pkl                    # StandardScaler
│   ├── feature_names.pkl             # Feature order
│   ├── model_metrics.pkl             # All model metrics
│   └── best_model_name.pkl           # Best model name string
├── templates/
│   ├── index.html                    # Landing page
│   ├── predict.html                  # Prediction form (multi-step)
│   ├── result.html                   # Prediction result page
│   ├── dashboard.html                # Analytics dashboard
│   ├── about.html                    # About page
│   ├── 404.html                      # Custom 404 error
│   └── 500.html                      # Custom 500 error
├── static/
│   ├── css/
│   │   ├── style.css                 # Global design system
│   │   └── dashboard.css            # Dashboard-specific styles
│   ├── js/
│   │   ├── validation.js             # Form validation & animations
│   │   └── dashboard.js             # Chart.js & dashboard logic
│   ├── images/                       # Static images
│   └── plots/                        # Auto-generated ML plots
├── app.py                            # Flask application
├── train_model.py                    # ML training pipeline
├── predict.py                        # Inference module + CLI
├── utils.py                          # Utility functions
├── config.py                         # Central configuration
├── requirements.txt                  # Python dependencies
├── .gitignore
└── README.md
```

---

## 🧑‍💻 Tech Stack

### Backend
- **Python 3.13** — Core language
- **Flask 3.0+** — Web framework
- **Jinja2** — HTML templating
- **Joblib** — Model serialization

### Machine Learning
- **Scikit-Learn** — ML algorithms (LR, DT, RF, SVM, KNN, NB, GB)
- **XGBoost** — Extreme gradient boosting (optional)
- **Pandas** — Data manipulation
- **NumPy** — Numerical operations

### Visualization
- **Matplotlib** — Static plots
- **Seaborn** — Statistical visualizations
- **Chart.js** — Interactive dashboard charts

### Frontend
- **HTML5** — Semantic markup
- **CSS3** — Custom design system with glassmorphism
- **Bootstrap 5.3** — UI components
- **Bootstrap Icons** — Icon library
- **JavaScript (ES6+)** — Client-side interactivity

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+ (3.13 recommended)
- pip package manager

### Step 1: Clone / Download the Project
```powershell
# If using git:
git clone https://github.com/yourusername/placement-prediction-system.git
cd placement-prediction-system

# Or navigate to the project folder
```

### Step 2: Create a Virtual Environment
```powershell
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 3: Install Requirements
```powershell
pip install -r requirements.txt
```

### Step 4: Verify Dataset
Ensure `dataset/Campus_Selection.csv` exists in the project root. The file is already included.

### Step 5: Train the Models
```powershell
py -3 train_model.py
```

This will:
- Load and preprocess the dataset
- Generate all EDA plots in `static/plots/`
- Train 7+ ML models with cross-validation
- Evaluate and compare all models
- Save the best model to `models/`

### Step 6: Run the Web Application
```powershell
py -3 app.py
```

Open your browser and navigate to: **[http://localhost:5000](http://localhost:5000)**

---

## 🚀 How to Run

```powershell
# 1. Install dependencies
pip install -r requirements.txt

# 2. Train models (one-time setup)
py -3 train_model.py

# 3. Start Flask server
py -3 app.py

# 4. Open browser
# Navigate to http://localhost:5000
```

### Alternative: CLI Prediction
```powershell
py -3 predict.py
```

This opens an interactive command-line prediction interface.

---

## 🌐 Web Application Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Landing page with overview stats |
| `/predict` | GET | Multi-step prediction form |
| `/predict` | POST | Submit form, run inference |
| `/result` | GET | Display prediction result |
| `/dashboard` | GET | Analytics dashboard |
| `/about` | GET | About page |
| `/download-report` | GET | Download prediction text report |
| `/clear-history` | POST | Clear session prediction history |
| `/api/status` | GET | JSON model status |
| `/api/metrics` | GET | JSON model metrics |

---

## 📊 Machine Learning Models

| Model | Notes |
|-------|-------|
| Logistic Regression | Linear baseline |
| Decision Tree | Interpretable tree |
| Random Forest | 200-estimator ensemble |
| Support Vector Machine | RBF kernel, probability=True |
| K-Nearest Neighbors | k=7, minkowski distance |
| Naive Bayes | Gaussian NB |
| Gradient Boosting | 200 estimators, lr=0.1 |
| XGBoost | Optional (if installed) |

### Evaluation Metrics
- Accuracy
- Precision
- Recall
- F1 Score
- ROC AUC Score
- 5-Fold Cross-Validation Score

---

## 📥 Input Features

| Feature | Type | Values |
|---------|------|--------|
| Gender | Binary | M / F |
| SSC % | Numeric | 0–100 |
| SSC Board | Categorical | Central / Others |
| HSC % | Numeric | 0–100 |
| HSC Board | Categorical | Central / Others |
| HSC Stream | Categorical | Commerce / Science / Arts |
| Degree % | Numeric | 0–100 |
| Degree Type | Categorical | Sci&Tech / Comm&Mgmt / Others |
| Work Experience | Binary | Yes / No |
| Employability Test % | Numeric | 0–100 |
| MBA % | Numeric | 0–100 |
| MBA Specialisation | Categorical | Mkt&HR / Mkt&Fin |

## 📤 Output

| Output | Description |
|--------|-------------|
| Prediction | Placed / Not Placed |
| Placed Probability | 0–100% probability score |
| Confidence Score | Confidence percentage |
| Confidence Level | High / Moderate / Low |
| Recommendations | 5 personalised career tips |

---

## 🖼️ Screenshots

| Page | Description |
|------|-------------|
| Home | Hero landing page with stats |
| Predict | Multi-step form with sliders |
| Result | Prediction with probability rings |
| Dashboard | Charts, metrics, plots |
| About | Tech stack & pipeline overview |

*(Screenshots available after running the app)*

---

## 🔮 Future Improvements

- [ ] **User Authentication** — Save and manage personal predictions
- [ ] **Database Integration** — Persist prediction history with SQLite/PostgreSQL
- [ ] **SHAP Values** — Explainable AI feature attribution
- [ ] **API Documentation** — Swagger/OpenAPI spec
- [ ] **Docker Support** — Containerized deployment
- [ ] **Model Retraining** — Upload new data and retrain via web UI
- [ ] **Email Reports** — Send prediction reports via email
- [ ] **Salary Prediction** — Extend to regression (predict salary package)
- [ ] **Dark/Light Mode Toggle** — User-controlled theme switching
- [ ] **Batch Predictions** — Upload CSV for bulk predictions

---

## 📄 License

This project is created for educational and demonstration purposes.

---

## 👨‍💻 Author

**Placement Prediction System**  
Built with Python, Flask, and Scikit-Learn  
Version 1.0.0

---

*Powered by Machine Learning • Built with Flask • Styled with Bootstrap 5*
