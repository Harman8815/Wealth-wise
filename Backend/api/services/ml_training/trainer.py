"""
Train a transaction category classifier.
"""
import logging
import os
from datetime import datetime
from typing import List, Dict, Tuple, Optional

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score

from django.conf import settings

logger = logging.getLogger(__name__)


class ModelTrainer:
    """Train and persist a categorizer pipeline."""

    def __init__(self, n_estimators: int = 200, random_state: int = 42):
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.pipeline: Optional[Pipeline] = None
        self.label_encoder: Optional[LabelEncoder] = None

    def train(self, records: List[Dict]) -> Dict:
        texts = []
        labels = []
        for rec in records:
            merchant = (rec.get('merchant') or '').strip()
            description = (rec.get('description') or '').strip()
            amount = rec.get('amount', 0)
            txn_type = (rec.get('transaction_type') or 'expense').strip()
            texts.append(f"{merchant} {description} {txn_type} amount_{float(amount):.2f}")
            labels.append(rec.get('category', '').strip())

        if not texts:
            raise ValueError("No training records provided.")

        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(labels)

        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=5000,
                ngram_range=(1, 2),
                stop_words='english',
                sublinear_tf=True,
            )),
            ('clf', RandomForestClassifier(
                n_estimators=self.n_estimators,
                random_state=self.random_state,
                class_weight='balanced',
                n_jobs=-1,
            )),
        ])

        X = texts
        self.pipeline.fit(X, y)

        n_classes = len(self.label_encoder.classes_)
        from collections import Counter
        min_class_count = min(Counter(y).values()) if len(y) > 0 else 1
        n_splits = min(5, max(2, min_class_count))
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=self.random_state)
        cv_scores = cross_val_score(self.pipeline, X, y, cv=cv, scoring='f1_weighted', n_jobs=-1)

        y_pred = self.pipeline.predict(X)
        train_accuracy = float(accuracy_score(y, y_pred))
        train_f1 = float(f1_score(y, y_pred, average='weighted'))

        return {
            'cv_f1_mean': float(np.mean(cv_scores)),
            'cv_f1_std': float(np.std(cv_scores)),
            'train_accuracy': train_accuracy,
            'train_f1': train_f1,
            'n_samples': len(records),
            'n_classes': n_classes,
            'classes': self.label_encoder.classes_.tolist(),
        }

    def predict(self, records: List[Dict]) -> Tuple[List[str], List[float]]:
        if self.pipeline is None or self.label_encoder is None:
            raise RuntimeError("Model is not trained.")
        texts = []
        for rec in records:
            merchant = (rec.get('merchant') or '').strip()
            description = (rec.get('description') or '').strip()
            amount = rec.get('amount', 0)
            txn_type = (rec.get('transaction_type') or 'expense').strip()
            texts.append(f"{merchant} {description} {txn_type} amount_{float(amount):.2f}")
        proba = self.pipeline.predict_proba(texts)
        preds = self.pipeline.predict(texts)
        labels = self.label_encoder.inverse_transform(preds)
        confidences = [float(max(p)) for p in proba]
        return labels.tolist(), confidences
