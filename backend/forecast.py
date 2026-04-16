import sys
import json
import os
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH  = os.path.join(BASE_DIR, "forecast_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "forecast_scaler.pkl")
META_PATH   = os.path.join(BASE_DIR, "forecast_meta.pkl")

# Feature columns — must match train_forecast.py exactly
FEATURE_COLS = [
    "monthly_income_usd",
    "savings_usd",
    "debt_to_income_ratio",
    "credit_score",
    "monthly_emi_usd",
    "loan_amount_usd",
    "savings_to_income_ratio",
    "age",
    "employment_encoded",
    "education_encoded",
    "has_loan_encoded"
]

# Default values used when user data doesn't have these fields
DEFAULTS = {
    "monthly_income_usd":    4000.0,
    "savings_usd":           500.0,
    "debt_to_income_ratio":  0.3,
    "credit_score":          650,
    "monthly_emi_usd":       200.0,
    "loan_amount_usd":       5000.0,
    "savings_to_income_ratio": 0.12,
    "age":                   30,
    "employment_encoded":    1,
    "education_encoded":     0,
    "has_loan_encoded":      0
}

def load_model():
    try:
        import joblib
        model  = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        return model, scaler
    except Exception:
        return None, None

def parse_input(raw):
    try:
        return json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)

def get_next_month_labels(last_year, last_month, n=3):
    labels = []
    dt = datetime(last_year, last_month, 1)
    for _ in range(n):
        dt = dt + relativedelta(months=1)
        labels.append(dt.strftime("%Y-%m"))
    return labels

def linear_trend(values, n_future=3):
    """Simple linear regression trend on historical values."""
    values = [float(v) for v in values]
    n = len(values)
    if n == 0:
        return [0.0] * n_future
    if n == 1:
        return [round(values[0], 2)] * n_future
    x = np.arange(n, dtype=float)
    y = np.array(values, dtype=float)
    x_mean, y_mean = np.mean(x), np.mean(y)
    slope = np.sum((x - x_mean) * (y - y_mean)) / (np.sum((x - x_mean) ** 2) + 1e-9)
    intercept = y_mean - slope * x_mean
    return [round(max(0.0, slope * (n + i) + intercept), 2) for i in range(n_future)]

def build_feature_vector(user_context):
    vector = []
    for col in FEATURE_COLS:
        value = user_context.get(col, DEFAULTS[col])
        vector.append(float(value))
    return vector

def forecast_total(monthly_totals):
    if not monthly_totals:
        return {"forecast": [], "historical": [], "warning": "No historical data available"}

    monthly_totals = sorted(monthly_totals, key=lambda x: x["month"])
    values = [item["total"] for item in monthly_totals]

    last_month_str = monthly_totals[-1]["month"]
    last_year  = int(last_month_str[:4])
    last_month = int(last_month_str[5:7])
    next_labels = get_next_month_labels(last_year, last_month, n=3)

    trend_preds = linear_trend(values, n_future=3)
    model, scaler = load_model()

    if model is not None and scaler is not None:
        try:
            avg_expense = float(np.mean(values))
            user_context = {
                "monthly_income_usd":      avg_expense * 1.5,
                "savings_usd":             avg_expense * 0.1,
                "debt_to_income_ratio":    0.3,
                "credit_score":            650,
                "monthly_emi_usd":         avg_expense * 0.05,
                "loan_amount_usd":         avg_expense * 2,
                "savings_to_income_ratio": 0.1,
                "age":                     30,
                "employment_encoded":      1,
                "education_encoded":       0,
                "has_loan_encoded":        0
            }
            feature_vec = build_feature_vector(user_context)
            scaled      = scaler.transform([feature_vec])
            model_pred  = float(model.predict(scaled)[0])
            predictions = [round(0.6 * model_pred + 0.4 * tp, 2) for tp in trend_preds]
            method = "trained_linear_regression"
        except Exception:
            predictions = trend_preds
            method = "linear_regression_fallback"
    else:
        predictions = trend_preds
        method = "linear_regression_fallback"

    return {
        "type":   "total",
        "method": method,
        "historical": [{"month": item["month"], "total": item["total"]} for item in monthly_totals],
        "forecast":   [{"month": label, "predicted": pred} for label, pred in zip(next_labels, predictions)]
    }

def forecast_by_category(category_data):
    if not category_data:
        return {"forecast": {}, "warning": "No historical data available"}

    categories = {}
    for row in category_data:
        cat = row["category"] or "Other"
        if cat not in categories:
            categories[cat] = {}
        categories[cat][row["month"]] = float(row["total"])

    all_months = sorted(set(row["month"] for row in category_data))
    if not all_months:
        return {"forecast": {}, "warning": "No months found"}

    last_month_str = all_months[-1]
    last_year  = int(last_month_str[:4])
    last_month = int(last_month_str[5:7])
    next_labels = get_next_month_labels(last_year, last_month, n=3)

    model, scaler = load_model()

    latest_totals = {cat: month_map.get(all_months[-1], 0.0) for cat, month_map in categories.items()}
    total_latest  = sum(latest_totals.values()) or 1.0

    result = {}
    for cat, month_map in categories.items():
        values      = [month_map.get(m, 0.0) for m in all_months]
        trend_preds = linear_trend(values, n_future=3)

        if model is not None and scaler is not None:
            try:
                total_avg   = sum(np.mean(list(m.values())) for m in categories.values())
                user_context = {
                    "monthly_income_usd":      total_avg * 1.5,
                    "savings_usd":             total_avg * 0.1,
                    "debt_to_income_ratio":    0.3,
                    "credit_score":            650,
                    "monthly_emi_usd":         total_avg * 0.05,
                    "loan_amount_usd":         total_avg * 2,
                    "savings_to_income_ratio": 0.1,
                    "age":                     30,
                    "employment_encoded":      1,
                    "education_encoded":       0,
                    "has_loan_encoded":        0
                }
                feature_vec    = build_feature_vector(user_context)
                scaled         = scaler.transform([feature_vec])
                total_model    = float(model.predict(scaled)[0])
                cat_share      = latest_totals.get(cat, 0.0) / total_latest
                model_cat_pred = total_model * cat_share
                predictions    = [round(max(0.0, 0.6 * model_cat_pred + 0.4 * tp), 2) for tp in trend_preds]
            except Exception:
                predictions = trend_preds
        else:
            predictions = trend_preds

        result[cat] = [{"month": label, "predicted": pred} for label, pred in zip(next_labels, predictions)]

    return {
        "type":        "category",
        "method":      "trained_linear_regression" if model is not None else "fallback",
        "next_months": next_labels,
        "forecast":    result
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing mode. Use 'total' or 'category'"}))
        sys.exit(1)

    mode = sys.argv[1].strip().lower()
    raw  = sys.stdin.read().strip()
    data = parse_input(raw)

    if mode == "total":
        output = forecast_total(data)
    elif mode == "category":
        output = forecast_by_category(data)
    else:
        output = {"error": f"Unknown mode '{mode}'. Use 'total' or 'category'"}

    print(json.dumps(output))
