"""
Build a verified training dataset from backend transactions.
"""
import logging
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

from api.models import Transaction, MLTrainingSample, User, Category

logger = logging.getLogger(__name__)


class DatasetBuilder:
    """Extract verified transactions and turn them into MLTrainingSample records."""

    def build_from_backend(self, batch_size: int = 1000) -> int:
        created = 0
        skipped = 0
        qs = Transaction.objects.select_related('user', 'project', 'category').filter(
            category__isnull=False,
        )
        # Exclude pending if needed; keep both completed and pending for now
        # Only non-deleted transactions (hard delete in this model)
        for txn in qs.iterator(chunk_size=batch_size):
            if not self._is_valid(txn):
                skipped += 1
                continue
            source = self._determine_source(txn)
            _, created_flag = MLTrainingSample.objects.update_or_create(
                merchant=txn.merchant or '',
                description=txn.description,
                amount=txn.amount,
                transaction_type=txn.type,
                category=txn.category,
                source=source,
                defaults={
                    'created_at': txn.created_at,
                    'model_version': txn.ml_model_version or '',
                    'is_verified': True,
                },
            )
            if created_flag:
                created += 1
        logger.info("Backend dataset: %d created, %d skipped.", created, skipped)
        return created

    def build_from_feedback(self, batch_size: int = 1000) -> int:
        from api.models import CategoryFeedback
        created = 0
        for fb in CategoryFeedback.objects.select_related('user', 'project', 'actual_category').iterator(chunk_size=batch_size):
            _, created_flag = MLTrainingSample.objects.update_or_create(
                merchant=fb.merchant,
                description=fb.description,
                amount=Decimal('0.00'),
                transaction_type='expense',
                category=fb.actual_category,
                source='FEEDBACK',
                defaults={
                    'created_at': fb.timestamp,
                    'model_version': '',
                    'is_verified': True,
                },
            )
            if created_flag:
                created += 1
        logger.info("Feedback dataset: %d created.", created)
        return created

    def merge_datasets(self, kaggle_records: List[Dict], min_count_per_class: int = 2) -> List[Dict]:
        """Merge kaggle + backend + feedback into a single list of dicts."""
        backend_qs = MLTrainingSample.objects.filter(is_verified=True).select_related('category')
        records: List[Dict] = []
        seen = set()
        for sample in backend_qs.iterator():
            text = f"{sample.merchant} {sample.description}".strip()
            dedup_key = (text.lower(), str(sample.amount), sample.transaction_type, sample.category_id)
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            records.append({
                'merchant': sample.merchant,
                'description': sample.description,
                'amount': float(sample.amount),
                'transaction_type': sample.transaction_type,
                'category': sample.category.name,
            })
        for rec in kaggle_records:
            text = f"{rec.get('merchant', '')} {rec.get('description', '')}".strip()
            dedup_key = (text.lower(), str(rec.get('amount', 0)), rec.get('transaction_type', 'expense'), rec.get('category', ''))
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            records.append({
                'merchant': rec.get('merchant', ''),
                'description': rec.get('description', ''),
                'amount': float(rec.get('amount', 0) or 0),
                'transaction_type': rec.get('transaction_type', 'expense').lower(),
                'category': rec.get('category', ''),
            })
        return records

    def _is_valid(self, txn: Transaction) -> bool:
        if txn.category is None:
            return False
        merchant_valid = bool((txn.merchant or '').strip())
        description_valid = bool((txn.description or '').strip())
        return merchant_valid or description_valid

    def _determine_source(self, txn: Transaction) -> str:
        if txn.predicted_category is not None and txn.category == txn.predicted_category:
            return 'MANUAL'
        if txn.predicted_category is not None and txn.category != txn.predicted_category:
            return 'FEEDBACK'
        return 'MANUAL'
