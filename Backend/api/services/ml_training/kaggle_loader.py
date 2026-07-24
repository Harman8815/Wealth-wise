"""
Load Kaggle dataset for budget category classification.
Expects CSV with columns: merchant, description, amount, transaction_type, category
"""
import csv
import logging
from pathlib import Path
from typing import List, Dict, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


class KaggleDatasetLoader:
    """Load a Kaggle-style transaction classification dataset from CSV."""

    DEFAULT_PATH = getattr(settings, 'ML_KAGGLE_DATA_PATH', None)

    def __init__(self, path: Optional[str] = None):
        self.path = Path(path or self.DEFAULT_PATH) if path or self.DEFAULT_PATH else None

    def load(self) -> List[Dict]:
        if not self.path or not self.path.exists():
            logger.warning("Kaggle dataset not found at %s. Returning empty dataset.", self.path)
            return []
        records = []
        with open(self.path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                record = {
                    'merchant': (row.get('merchant') or '').strip(),
                    'description': (row.get('description') or '').strip(),
                    'amount': row.get('amount', '0'),
                    'transaction_type': (row.get('transaction_type') or row.get('type') or 'expense').strip().lower(),
                    'category': (row.get('category') or '').strip(),
                }
                if record['merchant'] or record['description']:
                    records.append(record)
        logger.info("Loaded %d records from Kaggle dataset.", len(records))
        return records

    @staticmethod
    def generate_sample_schema() -> str:
        return (
            "merchant,description,amount,transaction_type,category\n"
            "Starbucks,Coffee latte,4.50,expense,Food\n"
            "Uber,Ride to airport,24.00,expense,Transportation\n"
            "Amazon,Household supplies,35.99,expense,Shopping\n"
            "Netflix,Monthly subscription,15.00,expense,Entertainment\n"
        )
