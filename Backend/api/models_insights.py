"""
Dynamic AI Insights models.

A cross-cutting *insight feed* that aggregates richer, narrative business-rule
findings (spending anomalies, category spikes, recurring/subscription drift,
savings opportunities, goal momentum) as a **persisted, dismissible feed**,
distinct from the Financial Health Score's ``HealthRecommendation`` rows.

Insights are their own ``Insight`` model so they can be dismissed independently
and survive recomputes. Every row is scoped to a ``Project`` (project=None keeps
the legacy, pre-scoping behaviour) so a single backend serves many independent
workspaces, mirroring ``models_financial_health`` / ``models_duplicates``.
"""
import uuid

from django.db import models
from django.utils import timezone


class Insight(models.Model):
    """A single persisted, dismissible AI insight for a user/project.

    Distinct from ``HealthRecommendation`` (those are tied to a score snapshot).
    Insights feed the dashboard's ``AIInsightsCard`` and can be dismissed without
    being deleted — a dismissed insight stays dismissed across regenerations.
    """

    KIND_CHOICES = [
        ('spending', 'Spending'),
        ('saving', 'Saving'),
        ('investment', 'Investment'),
        ('alert', 'Alert'),
        ('goal', 'Goal'),
        ('recurring', 'Recurring'),
    ]

    SEVERITY_CHOICES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('neutral', 'Neutral'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='insights')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='insights',
    )
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(
        max_length=10, choices=SEVERITY_CHOICES, default='neutral',
    )
    # Stable key used to dedupe regenerations (so re-running rules updates in
    # place rather than creating endless duplicate rows).
    dedup_key = models.CharField(max_length=255, blank=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    action_url = models.CharField(max_length=500, blank=True)
    dismissed = models.BooleanField(default=False)
    generated_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'insights'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['user', 'project', 'dismissed', 'generated_at']),
        ]

    def __str__(self):
        return f"Insight: {self.title} ({self.kind}) - {self.user.email}"
