"""
Offline retraining pipeline: load -> clean -> featurize -> train -> evaluate -> export.
"""
import logging
import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


class RetrainingPipeline:
    """End-to-end offline retraining orchestrator."""

    def __init__(self, models_dir: Optional[str] = None, min_accuracy: float = 0.70, min_f1: float = 0.65):
        from django.conf import settings
        self.models_dir = models_dir or getattr(settings, 'ML_MODELS_DIR', None)
        self.min_accuracy = min_accuracy
        self.min_f1 = min_f1
        self.manager = None
        self.trainer = None
        self.evaluator = None
        if self.models_dir:
            from .versioning import ModelVersionManager
            from .evaluator import ModelEvaluator
            from .trainer import ModelTrainer
            self.manager = ModelVersionManager(self.models_dir)
            self.trainer = ModelTrainer()
            self.evaluator = ModelEvaluator(self.models_dir)

    def run(self, kaggle_records: List[Dict], dry_run: bool = False) -> Dict[str, Any]:
        from .dataset_builder import DatasetBuilder
        builder = DatasetBuilder()
        builder.build_from_backend()
        builder.build_from_feedback()
        records = builder.merge_datasets(kaggle_records)

        if not records:
            raise ValueError("No training records available after merge.")

        logger.info("Training on %d records.", len(records))
        train_metrics = self.trainer.train(records)
        logger.info("Train metrics: %s", train_metrics)

        if dry_run:
            return {'status': 'dry_run', 'metrics': train_metrics, 'n_records': len(records)}

        candidate_version = self.manager.next_version()
        meta = {
            'version': candidate_version,
            'algorithm': 'RandomForest',
            'trained_at': datetime.now().isoformat(),
            'training_samples': train_metrics['n_samples'],
            'n_classes': train_metrics['n_classes'],
            'classes': train_metrics['classes'],
            'train_accuracy': train_metrics['train_accuracy'],
            'train_f1': train_metrics['train_f1'],
            'cv_f1_mean': train_metrics['cv_f1_mean'],
            'cv_f1_std': train_metrics['cv_f1_std'],
        }

        self.manager.save_version(candidate_version, self.trainer.pipeline, self.trainer.label_encoder, meta)

        prod_metrics = self.evaluator.load_production_metrics()
        candidate_metrics = {
            'accuracy': train_metrics['train_accuracy'],
            'f1_score': train_metrics['train_f1'],
        }
        deploy, reason = self.evaluator.should_deploy(candidate_metrics, prod_metrics)

        from api.models import MLModelVersion
        candidate_obj = MLModelVersion.objects.create(
            version=candidate_version,
            status='candidate',
            accuracy=train_metrics['train_accuracy'],
            f1_score=train_metrics['train_f1'],
            training_samples=train_metrics['n_samples'],
            model_path=os.path.join(self.models_dir, candidate_version) if self.models_dir else '',
            metadata=meta,
        )

        result = {
            'status': 'completed',
            'version': candidate_version,
            'metrics': train_metrics,
            'deploy': deploy,
            'reason': reason,
            'production': prod_metrics,
        }

        if deploy:
            if train_metrics['train_accuracy'] < self.min_accuracy or train_metrics['train_f1'] < self.min_f1:
                logger.warning("Candidate passes production comparison but below min thresholds. Not promoting.")
                candidate_obj.status = 'rejected'
                candidate_obj.save(update_fields=['status'])
                result['status'] = 'rejected_below_threshold'
                return result
            self.manager.promote(candidate_version)
            candidate_obj.status = 'approved'
            candidate_obj.promoted_at = datetime.now()
            candidate_obj.save(update_fields=['status', 'promoted_at'])
            result['promoted'] = True
        else:
            candidate_obj.status = 'rejected'
            candidate_obj.save(update_fields=['status'])
            result['promoted'] = False

        return result
