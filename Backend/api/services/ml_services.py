import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

logger = logging.getLogger(__name__)

ML_NOTEBOOKS_DIR = Path(__file__).resolve().parents[2] / 'ML-Notebooks'


def _load_joblib(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    return joblib.load(path)


def _load_pickle(path: Path):
    import pickle
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    with open(path, 'rb') as f:
        return pickle.load(f)


def detect_anomalies(transactions_df: pd.DataFrame) -> List[Dict[str, Any]]:
    model_path = ML_NOTEBOOKS_DIR / 'Transaction Anomaly Detection' / 'model' / 'transaction_anomaly_isolation_forest.pkl'
    scaler_path = ML_NOTEBOOKS_DIR / 'Transaction Anomaly Detection' / 'model' / 'transaction_anomaly_scaler.pkl'
    threshold_path = ML_NOTEBOOKS_DIR / 'Transaction Anomaly Detection' / 'model' / 'transaction_anomaly_optimal_threshold.pkl'
    features_path = ML_NOTEBOOKS_DIR / 'Transaction Anomaly Detection' / 'model' / 'transaction_anomaly_features.pkl'

    if not all(p.exists() for p in [model_path, scaler_path, threshold_path, features_path]):
        logger.warning("Anomaly detection model artifacts missing; returning empty result.")
        return []

    model = _load_joblib(model_path)
    scaler = _load_joblib(scaler_path)
    threshold = _load_joblib(threshold_path)
    feature_columns = _load_joblib(features_path)

    X = transactions_df[feature_columns].fillna(0)
    X_scaled = scaler.transform(X)
    scores = model.decision_function(X_scaled)
    predictions = model.predict(X_scaled)

    anomalies = []
    for idx, (score, pred) in enumerate(zip(scores, predictions)):
        if pred == -1 or score < threshold:
            anomalies.append({
                'index': int(idx),
                'score': float(score),
                'threshold': float(threshold),
                'is_anomaly': bool(pred == -1),
                'transaction_id': str(transactions_df.iloc[idx].get('id', '')),
                'date': str(transactions_df.iloc[idx].get('date', '')),
                'description': str(transactions_df.iloc[idx].get('description', '')),
                'amount': float(transactions_df.iloc[idx].get('amount', 0)),
            })
    return anomalies


def forecast_spending(transactions_df: pd.DataFrame, days_ahead: int = 30) -> Dict[str, Any]:
    prophet_path = ML_NOTEBOOKS_DIR / 'Spending Forecast' / 'spending_forecast_prophet (1).pkl'
    lstm_path = ML_NOTEBOOKS_DIR / 'Spending Forecast' / 'spending_forecast_lstm.keras'
    scaler_path = ML_NOTEBOOKS_DIR / 'Spending Forecast' / 'spending_forecast_lstm_scaler.pkl'
    metadata_path = ML_NOTEBOOKS_DIR / 'Spending Forecast' / 'spending_forecast_metadata.pkl'
    csv_path = ML_NOTEBOOKS_DIR / 'Spending Forecast' / 'spending_forecast_30_days (1).csv'

    result = {'prophet': None, 'lstm': None, 'csv_data': None}

    if prophet_path.exists():
        try:
            prophet_model = _load_joblib(prophet_path)
            future = prophet_model.make_future_dataframe(periods=days_ahead)
            forecast = prophet_model.predict(future)
            result['prophet'] = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days_ahead).to_dict('records')
        except Exception as exc:
            logger.warning("Prophet forecast failed: %s", exc)

    if lstm_path.exists() and scaler_path.exists():
        try:
            from tensorflow import keras
            lstm_model = keras.models.load_model(lstm_path)
            scaler = _load_joblib(scaler_path)
            metadata = _load_joblib(metadata_path) if metadata_path.exists() else {}
            lookback = metadata.get('lookback', 30)

            recent = transactions_df.tail(lookback)[['amount']].values
            if len(recent) >= lookback:
                scaled = scaler.transform(recent[-lookback:])
                X = np.array([scaled])
                pred = lstm_model.predict(X, verbose=0)
                pred_inv = scaler.inverse_transform(pred)
                result['lstm'] = {
                    'forecast': pred_inv.flatten().tolist(),
                    'lookback': lookback,
                }
        except Exception as exc:
            logger.warning("LSTM forecast failed: %s", exc)

    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            result['csv_data'] = df.tail(days_ahead).to_dict('records')
        except Exception as exc:
            logger.warning("CSV forecast load failed: %s", exc)

    return result


def cluster_merchants(transactions_df: pd.DataFrame) -> Dict[str, Any]:
    scaler_path = ML_NOTEBOOKS_DIR / 'merchant clustering' / 'models' / 'clustering_scaler.pkl'
    model_path = ML_NOTEBOOKS_DIR / 'merchant clustering' / 'models' / 'merchant_clusters.csv'
    profiles_path = ML_NOTEBOOKS_DIR / 'merchant clustering' / 'models' / 'cluster_profiles.csv'
    features_path = ML_NOTEBOOKS_DIR / 'merchant clustering' / 'models' / 'feature_columns.pkl'
    metadata_path = ML_NOTEBOOKS_DIR / 'merchant clustering' / 'models' / 'clustering_metadata.json'

    result = {'clusters': [], 'profiles': [], 'metadata': {}}

    if not all(p.exists() for p in [scaler_path, features_path]):
        logger.warning("Merchant clustering artifacts missing; returning empty result.")
        return result

    scaler = _load_joblib(scaler_path)
    feature_columns = _load_joblib(features_path)

    if metadata_path.exists():
        with open(metadata_path, 'r', encoding='utf-8') as f:
            result['metadata'] = json.load(f)

    merchant_agg = transactions_df.groupby('merchant').agg({
        'amount': ['sum', 'mean', 'count', 'std'],
        'date': ['min', 'max'],
    }).reset_index()
    merchant_agg.columns = ['merchant', 'total_spend', 'avg_spend', 'transaction_count', 'std_spend', 'first_seen', 'last_seen']
    merchant_agg = merchant_agg.fillna(0)

    if set(feature_columns).issubset(merchant_agg.columns):
        X = merchant_agg[feature_columns]
        X_scaled = scaler.transform(X)
        from sklearn.cluster import KMeans
        if 'n_clusters' in result['metadata']:
            kmeans = KMeans(n_clusters=result['metadata']['n_clusters'], random_state=42)
            kmeans.fit(X_scaled)
            merchant_agg['cluster'] = kmeans.labels_
        else:
            merchant_agg['cluster'] = [0] * len(merchant_agg)
    else:
        merchant_agg['cluster'] = [0] * len(merchant_agg)

    result['clusters'] = merchant_agg.to_dict('records')

    if profiles_path.exists():
        try:
            profiles = pd.read_csv(profiles_path)
            result['profiles'] = profiles.to_dict('records')
        except Exception:
            pass

    return result


def forecast_budget(transactions_df: pd.DataFrame, budget_categories_df: pd.DataFrame) -> List[Dict[str, Any]]:
    forecast_months = 3
    results = []
    categories = budget_categories_df.to_dict('records') if not budget_categories_df.empty else []
    for cat in categories[:10]:
        cat_name = cat.get('name', 'Unknown')
        cat_spent = float(cat.get('spent', 0) or 0)
        cat_budget = float(cat.get('budgeted', 0) or 0)
        cat_transactions = transactions_df[transactions_df.get('category_name', '') == cat_name] if 'category_name' in transactions_df.columns else transactions_df.tail(30)
        monthly_avg = cat_transactions['amount'].sum() / 3 if len(cat_transactions) > 0 else cat_spent / 30 * 30
        forecast = []
        for m in range(1, forecast_months + 1):
            forecast.append({
                'month': m,
                'predicted_spend': round(float(monthly_avg), 2),
                'budget': round(cat_budget / 3, 2) if cat_budget else None,
            })
        results.append({
            'category': cat_name,
            'current_spent': cat_spent,
            'budget': cat_budget,
            'monthly_average': round(float(monthly_avg), 2),
            'forecast': forecast,
        })
    return results
