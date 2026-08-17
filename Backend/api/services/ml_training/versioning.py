"""
Model versioning and on-disk persistence.
"""
import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, Optional

import joblib

from django.conf import settings

from api.models import MLModelVersion

logger = logging.getLogger(__name__)


class ModelVersionManager:
    """Save and load model versions from disk, never overwriting existing versions."""

    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = models_dir or getattr(settings, 'ML_MODELS_DIR', None)
        if not self.models_dir:
            raise ValueError("ML_MODELS_DIR is not configured in settings.")
        os.makedirs(self.models_dir, exist_ok=True)

    def next_version(self) -> str:
        last = MLModelVersion.objects.order_by('-created_at').first()
        if not last:
            return 'v1.0'
        try:
            ver = last.version
            if ver.startswith('v'):
                parts = ver[1:].split('.')
                major = int(parts[0])
                minor = int(parts[1]) if len(parts) > 1 else 0
                return f"v{major}.{minor + 1}"
        except Exception:
            pass
        return f"v{datetime.now().strftime('%Y%m%d%H%M%S')}"

    def save_version(self, version: str, pipeline, label_encoder, metadata: Dict[str, Any]) -> str:
        version_dir = os.path.join(self.models_dir, version)
        if os.path.exists(version_dir):
            raise FileExistsError(f"Version {version} already exists on disk.")
        os.makedirs(version_dir, exist_ok=True)
        joblib.dump(pipeline, os.path.join(version_dir, 'categorizer.joblib'))
        joblib.dump(label_encoder, os.path.join(version_dir, 'label_encoder.joblib'))
        meta_path = os.path.join(version_dir, 'metadata.json')
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str)
        logger.info("Saved model version %s to %s.", version, version_dir)
        return version_dir

    def load_version(self, version: str) -> Dict[str, Any]:
        version_dir = os.path.join(self.models_dir, version)
        if not os.path.exists(version_dir):
            raise FileNotFoundError(f"Model version {version} not found.")
        pipeline = joblib.load(os.path.join(version_dir, 'categorizer.joblib'))
        label_encoder = joblib.load(os.path.join(version_dir, 'label_encoder.joblib'))
        meta_path = os.path.join(version_dir, 'metadata.json')
        metadata = {}
        if os.path.exists(meta_path):
            with open(meta_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
        return {
            'pipeline': pipeline,
            'label_encoder': label_encoder,
            'metadata': metadata,
            'version': version,
        }

    def load_production(self) -> Dict[str, Any]:
        prod = MLModelVersion.objects.filter(status='approved').order_by('-promoted_at').first()
        if not prod:
            raise MLModelVersion.DoesNotExist("No approved model version found.")
        return self.load_version(prod.version)

    def promote(self, version: str) -> MLModelVersion:
        MLModelVersion.objects.filter(status='approved').update(status='deprecated')
        obj, _ = MLModelVersion.objects.get_or_create(
            version=version,
            defaults={'status': 'approved'},
        )
        obj.status = 'approved'
        obj.promoted_at = datetime.now()
        obj.save(update_fields=['status', 'promoted_at'])
        logger.info("Promoted model version %s to approved.", version)
        return obj
