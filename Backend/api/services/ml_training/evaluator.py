"""
Model evaluation: compare candidate against production (or baseline).
"""
import logging
import os
from typing import Dict, Any, List, Optional, Tuple

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, f1_score

from django.conf import settings

from .trainer import ModelTrainer

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluate a trained model against a holdout set or existing production model."""

    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = models_dir or getattr(settings, 'ML_MODELS_DIR', None)
        if not self.models_dir:
            raise ValueError("ML_MODELS_DIR is not configured in settings.")

    def evaluate_split(self, records: List[Dict], test_size: float = 0.2, random_state: int = 42) -> Dict[str, float]:
        from sklearn.model_selection import train_test_split
        trainer = ModelTrainer()
        metrics = trainer.train(records)
        # Re-evaluate on a held-out portion by doing a quick manual split for speed
        # In production, use proper train_test_split before training.
        texts = []
        labels = []
        for rec in records:
            merchant = (rec.get('merchant') or '').strip()
            description = (rec.get('description') or '').strip()
            amount = rec.get('amount', 0)
            txn_type = (rec.get('transaction_type') or 'expense').strip()
            texts.append(f"{merchant} {description} {txn_type} amount_{float(amount):.2f}")
            labels.append(rec.get('category', '').strip())

        if len(texts) < 10:
            return {
                'accuracy': metrics['train_accuracy'],
                'f1_score': metrics['train_f1'],
                'note': 'small dataset, using train metrics as proxy',
            }

        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=test_size, random_state=random_state, stratify=labels,
        )
        le = trainer.label_encoder
        pl = trainer.pipeline
        pl.fit(X_train, le.fit_transform(y_train))
        y_pred_enc = pl.predict(X_test)
        y_pred = le.inverse_transform(y_pred_enc)
        accuracy = float(accuracy_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred, average='weighted'))
        return {
            'accuracy': accuracy,
            'f1_score': f1,
            'train_accuracy': metrics['train_accuracy'],
            'train_f1': metrics['train_f1'],
        }

    def load_production_metrics(self) -> Optional[Dict[str, Any]]:
        """Load metadata for the currently approved model version."""
        from api.models import MLModelVersion
        prod = MLModelVersion.objects.filter(status='approved').order_by('-promoted_at').first()
        if not prod:
            return None
        return {
            'version': prod.version,
            'accuracy': prod.accuracy,
            'f1_score': prod.f1_score,
            'training_samples': prod.training_samples,
            'metadata': prod.metadata,
        }

    def should_deploy(self, candidate_metrics: Dict[str, float], production_metrics: Optional[Dict[str, Any]]) -> Tuple[bool, str]:
        """Return (True, reason) if candidate should replace production."""
        if production_metrics is None:
            return True, "No production model exists."
        prod_acc = production_metrics.get('accuracy') or 0.0
        prod_f1 = production_metrics.get('f1_score') or 0.0
        cand_acc = candidate_metrics.get('accuracy', 0.0)
        cand_f1 = candidate_metrics.get('f1_score', 0.0)
        if cand_acc > prod_acc and cand_f1 > prod_f1:
            return True, f"Candidate accuracy {cand_acc:.4f} > prod {prod_acc:.4f} and F1 {cand_f1:.4f} > prod {prod_f1:.4f}."
        if cand_acc == prod_acc and cand_f1 == prod_f1:
            return False, "Candidate ties production metrics; keep existing to avoid churn."
        if cand_acc < prod_acc or cand_f1 < prod_f1:
            worse = []
            if cand_acc < prod_acc:
                worse.append(f"accuracy {cand_acc:.4f} < prod {prod_acc:.4f}")
            if cand_f1 < prod_f1:
                worse.append(f"F1 {cand_f1:.4f} < prod {prod_f1:.4f}")
            return False, f"Regression detected: {', '.join(worse)}."
        return True, "Candidate meets deployment criteria."
