"""
Duplicate Transaction Detection models.

Cross-existing-data, ML-backed near-duplicate detection. The Django backend
orchestrates detection (delegating the fuzzy scoring to the stateless
``ML-Backend`` service), scopes results to a ``Project`` (project=None keeps
legacy pre-scoping visibility), persists findings, and lets users review /
resolve them.

Three concepts:

* ``DuplicateGroup`` – a cluster of transactions the engine believes are
  duplicates of one another, surfaced for review.
* ``DuplicateMatch`` – one directed pair within a group, with the scored
  confidence, per-feature breakdown, and a human explanation. Resolution tracks
  the user's decision.
* ``DuplicateFeedback`` – explicit ``duplicate`` / ``not_duplicate`` labels,
  persisted (so future weight tuning can consume them) and used to suppress
  re-flagging of already-reviewed pairs.

All entities follow the project-scoped convention used by
``models_financial_health``.
"""
import uuid

from django.db import models


def default_duplicate_config() -> dict:
    """Return the engine's default detection config (mirrors ML-Backend defaults)."""
    return {
        "amount_tolerance": 0.01,
        "date_window_days": 4,
        "threshold_high": 0.85,
        "threshold_medium": 0.65,
        "weights": {"description": 0.5, "amount": 0.3, "date": 0.2},
    }


class DuplicateGroup(models.Model):
    """A cluster of transactions surfaced as probable duplicates."""

    STATUS_CHOICES = [
        ("open", "Open"),
        ("reviewed", "Reviewed"),
        ("dismissed", "Dismissed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='duplicate_groups')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='project_duplicate_groups',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    detected_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'duplicate_groups'
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['project', 'status']),
        ]

    def __str__(self):
        return f"Duplicate group {self.id} ({self.status})"


class DuplicateMatch(models.Model):
    """A single scored pair within a ``DuplicateGroup``."""

    CONFIDENCE_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
    ]
    RESOLUTION_CHOICES = [
        ('pending', 'Pending'),
        ('kept', 'Kept'),
        ('deleted', 'Deleted'),
        ('not_duplicate', 'Not a duplicate'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(
        DuplicateGroup, on_delete=models.CASCADE, null=True, blank=True,
        related_name='matches',
    )
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='duplicate_matches')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='project_duplicate_matches',
    )
    transaction = models.ForeignKey(
        'Transaction', on_delete=models.CASCADE, related_name='duplicate_matches',
    )
    duplicate_of = models.ForeignKey(
        'Transaction', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='duplicate_of_matches',
    )
    score = models.DecimalField(max_digits=5, decimal_places=4, default=0)
    confidence = models.CharField(max_length=10, choices=CONFIDENCE_CHOICES, default='medium')
    features = models.JSONField(default=dict, blank=True)
    explanation = models.TextField(blank=True)
    resolution = models.CharField(
        max_length=20, choices=RESOLUTION_CHOICES, default='pending',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'duplicate_matches'
        ordering = ['-score']
        indexes = [
            models.Index(fields=['user', 'project']),
            models.Index(fields=['resolution']),
        ]

    def __str__(self):
        return f"Match {self.transaction_id} ~ {self.duplicate_of_id} ({self.confidence})"


class DuplicateFeedback(models.Model):
    """Explicit user label for a pair; suppresses re-flagging and feeds tuning."""

    LABEL_CHOICES = [
        ('duplicate', 'Duplicate'),
        ('not_duplicate', 'Not a duplicate'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='duplicate_feedback')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='project_duplicate_feedback',
    )
    transaction_a = models.ForeignKey(
        'Transaction', on_delete=models.CASCADE, related_name='feedback_as_a',
    )
    transaction_b = models.ForeignKey(
        'Transaction', on_delete=models.CASCADE, related_name='feedback_as_b',
    )
    label = models.CharField(max_length=20, choices=LABEL_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'duplicate_feedback'
        unique_together = [['user', 'project', 'transaction_a', 'transaction_b']]
        indexes = [
            models.Index(fields=['user', 'project']),
        ]

    def __str__(self):
        return f"Feedback {self.transaction_a_id} vs {self.transaction_b_id}: {self.label}"
