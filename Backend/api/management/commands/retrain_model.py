"""
Management command: retrain_model
Runs the full offline retraining pipeline.
"""
from django.core.management.base import BaseCommand
import logging
import os

from api.services.ml_training.kaggle_loader import KaggleDatasetLoader
from api.services.ml_training.pipeline import RetrainingPipeline

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Run the offline retraining pipeline for the transaction categorizer."

    def add_arguments(self, parser):
        parser.add_argument('--kaggle-path', type=str, help='Path to Kaggle CSV dataset.')
        parser.add_argument('--dry-run', action='store_true', help='Train without saving model.')
        parser.add_argument('--min-accuracy', type=float, default=0.70)
        parser.add_argument('--min-f1', type=float, default=0.65)

    def handle(self, *args, **options):
        loader = KaggleDatasetLoader(options.get('kaggle_path'))
        records = loader.load()
        self.stdout.write(self.style.NOTICE(f"Kaggle records: {len(records)}"))

        pipeline = RetrainingPipeline(
            min_accuracy=options['min_accuracy'],
            min_f1=options['min_f1'],
        )
        result = pipeline.run(records, dry_run=options['dry_run'])

        if result.get('promoted'):
            self.stdout.write(self.style.SUCCESS(
                f"New model {result['version']} trained and promoted."
            ))
        elif result.get('status') == 'rejected_below_threshold':
            self.stdout.write(self.style.WARNING(
                f"Model {result['version']} trained but rejected (below min thresholds)."
            ))
        elif result.get('status') == 'dry_run':
            self.stdout.write(self.style.SUCCESS(
                f"Dry-run complete. Metrics: {result['metrics']}"
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"Model {result['version']} trained but NOT promoted. Reason: {result.get('reason')}"
            ))
