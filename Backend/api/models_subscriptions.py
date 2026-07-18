"""
Subscription Detection models.

These models capture subscriptions *mined from transaction history* (pattern
mining / ML) — distinct from the user-configured ``RecurringRule`` records. A
``Subscription`` is a detected recurring charge (same merchant, near-identical
amount, repeating on a stable cadence) surfaced for the user to review, confirm,
ignore, or convert into a formal ``RecurringRule``.

Every row is project-scoped via ``project_scope_filter`` (project=None keeps the
legacy, pre-scoping visibility), mirroring the other engine modules
(``models_insights``, ``models_duplicates``).
"""
import uuid

from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    """A subscription detected by mining the user's transaction history.

    Detection finds candidate series (same normalized merchant, stable amount,
    repeating cadence) and persists a ``Subscription`` row. The user can then
    confirm it, ignore it (so it is suppressed from future scans), or convert it
    into a proper ``RecurringRule``.

    ``dedup_key`` is a stable key (``sub:{normalized_merchant}:{project}``) so
    re-running the detector updates an existing *unconfirmed / unignored* row in
    place instead of creating duplicates.
    """

    STATUS_CHOICES = [
        ('detected', 'Detected'),
        ('confirmed', 'Confirmed'),
        ('ignored', 'Ignored'),
        ('converted', 'Converted'),
    ]

    CADENCE_CHOICES = [
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('unknown', 'Unknown'),
    ]

    CONFIDENCE_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='subscriptions')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='subscriptions',
    )
    # Normalized merchant name (e.g. "netflix"). Stable identity for dedup.
    merchant = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255, help_text="Human-friendly label.")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='detected',
    )
    cadence = models.CharField(
        max_length=20, choices=CADENCE_CHOICES, default='unknown',
    )
    confidence = models.CharField(
        max_length=10, choices=CONFIDENCE_CHOICES, default='medium',
    )
    # Average charged amount per occurrence (in the account currency).
    avg_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    # Most recent occurrence date seen for this subscription.
    last_seen = models.DateField(null=True, blank=True)
    # Estimated monthly cost (avg_amount normalized to a per-month figure).
    monthly_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    occurrences = models.PositiveIntegerField(default=0, help_text='Count of matched txns.')
    category = models.ForeignKey(
        'Category', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='subscriptions',
    )
    # Stable key used to dedupe re-scans (updates in place).
    dedup_key = models.CharField(max_length=255, blank=True, db_index=True)
    # Foreign recurring rule once converted (read-only link).
    converted_rule = models.ForeignKey(
        'RecurringRule', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='source_subscriptions',
    )
    metadata = models.JSONField(default=dict, blank=True)
    detected_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-monthly_cost', '-last_seen']
        indexes = [
            models.Index(fields=['user', 'project', 'status', 'detected_at']),
            models.Index(fields=['dedup_key']),
        ]

    def __str__(self):
        return f"Subscription: {self.display_name} ({self.cadence}) - {self.user.email}"


class SubscriptionFeedback(models.Model):
    """Explicit user label for a detected subscription.

    ``ignored`` suppresses a subscription from future scans (mirrors
    ``DuplicateFeedback``). The label is keyed by the normalized merchant so the
    same merchant is never re-flagged once dismissed.
    """

    LABEL_CHOICES = [
        ('ignored', 'Ignored'),
        ('confirmed', 'Confirmed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='subscription_feedback')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='subscription_feedback',
    )
    # Normalized merchant this label applies to.
    merchant = models.CharField(max_length=255)
    label = models.CharField(max_length=20, choices=LABEL_CHOICES)
    subscription = models.ForeignKey(
        'Subscription', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='feedback',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscription_feedback'
        unique_together = [['user', 'project', 'merchant', 'label']]
        indexes = [
            models.Index(fields=['user', 'project', 'merchant']),
        ]

    def __str__(self):
        return f"SubscriptionFeedback: {self.merchant} = {self.label} ({self.user.email})"
