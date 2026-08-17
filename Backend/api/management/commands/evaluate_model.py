"""
Management command: evaluate_model
Evaluate a specific model version against current production.
"""
from django.core.management.base import BaseCommand
import logging

from api.services.ml_training.versioning import ModelVersionManager
from api.services.ml_training.evaluator import ModelEvaluator

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Evaluate a model version and optionally promote it if better than production."

    def add_arguments(self, parser):
        parser.add_argument('version', type=str, help='Model version to evaluate (e.g. v1.1).')
        parser.add_argument('--promote-if-better', action='store_true', help='Promote if better than production.')

    def handle(self, *args, **options):
        version = options['version']
        manager = ModelVersionManager()
        evaluator = ModelEvaluator()
        data = manager.load_version(version)
        meta = data['metadata']
        self.stdout.write(f"Version: {version}")
        self.stdout.write(f"Classes: {meta.get('classes')}")
        self.stdout.write(f"Train accuracy: {meta.get('train_accuracy')}")
        self.stdout.write(f"Train F1: {meta.get('train_f1')}")
        self.stdout.write(f"CV F1 mean: {meta.get('cv_f1_mean')}")

        prod = evaluator.load_production_metrics()
        if not prod:
            self.stdout.write(self.style.SUCCESS("No production model. This version is the best available."))
            if options['promote_if_better']:
                manager.promote(version)
            return

        candidate_metrics = {
            'accuracy': meta.get('train_accuracy', 0.0),
            'f1_score': meta.get('train_f1', 0.0),
        }
        deploy, reason = evaluator.should_deploy(candidate_metrics, prod)
        self.stdout.write(self.style.NOTICE(f"Comparison: {reason}"))
        if deploy and options['promote_if_better']:
            manager.promote(version)
            self.stdout.write(self.style.SUCCESS(f"Promoted {version}."))
