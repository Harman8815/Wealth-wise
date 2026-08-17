"""
Runtime inference service for transaction category prediction.
Loads the latest approved model lazily.
"""
import logging
import threading
from typing import Dict, Any, Optional, Tuple, List

import joblib
import numpy as np

from django.conf import settings

from .versioning import ModelVersionManager

logger = logging.getLogger(__name__)


class CategoryPredictor:
    """Thread-safe singleton that loads the approved model once and predicts."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, models_dir: Optional[str] = None):
        if self._initialized:
            return
        self.models_dir = models_dir or getattr(settings, 'ML_MODELS_DIR', None)
        self.manager = ModelVersionManager(self.models_dir) if self.models_dir else None
        self._model = None
        self._label_encoder = None
        self._metadata = {}
        self._initialized = True

    def _load(self):
        if self._model is None and self.manager:
            try:
                data = self.manager.load_production()
                self._model = data['pipeline']
                self._label_encoder = data['label_encoder']
                self._metadata = data['metadata']
                logger.info("Loaded production model version %s.", data.get('version'))
            except Exception as exc:
                logger.warning("Could not load production model: %s", exc)

    def predict(self, merchant: str, description: str, amount: float, transaction_type: str) -> Tuple[Optional[str], float]:
        if self._model is None:
            self._load()
        if self._model is None or self._label_encoder is None:
            return None, 0.0
        text = f"{merchant or ''} {description or ''} {transaction_type or 'expense'} amount_{float(amount):.2f}"
        try:
            proba = self._model.predict_proba([text])
            pred_enc = self._model.predict([text])
            label = self._label_encoder.inverse_transform(pred_enc)[0]
            confidence = float(max(proba[0]))
            return str(label), confidence
        except Exception as exc:
            logger.error("Prediction failed: %s", exc)
            return None, 0.0

    @property
    def is_loaded(self) -> bool:
        return self._model is not None
