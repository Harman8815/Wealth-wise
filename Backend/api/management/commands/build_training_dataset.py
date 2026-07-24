"""
Management command: build_training_dataset
Builds the verified training dataset from backend transactions and user feedback.
"""
from django.core.management.base import BaseCommand
import logging

from api.services.ml_training.dataset_builder import DatasetBuilder

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Build verified ML training dataset from backend transactions and feedback."

    def add_arguments(self, parser):
        parser.add_argument('--feedback-only', action='store_true', help='Only import feedback data.')

    def handle(self, *args, **options):
        builder = DatasetBuilder()
        if options['feedback_only']:
            count = builder.build_from_feedback()
            self.stdout.write(self.style.SUCCESS(f"Imported {count} feedback samples."))
        else:
            backend_count = builder.build_from_backend()
            feedback_count = builder.build_from_feedback()
            self.stdout.write(self.style.SUCCESS(
                f"Backend: {backend_count} | Feedback: {feedback_count}"
            ))
