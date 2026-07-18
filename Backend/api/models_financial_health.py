"""
Financial Health Score models.

A project-scoped, explainable financial health score (0-100) computed by a
configurable weighted scoring engine. The engine derives the score from several
independent *dimensions* (budget management, savings ratio, cash-flow stability,
etc.). Each dimension is configured with a weight and a list of rules so the
model stays a thin persistence layer while the math lives in
``api.services.financial_health``.

Three persistence concepts are modelled here:

* ``ScoreDimensionConfig`` – per-project (or global) weight + enabled flag for
  each scoring dimension. Empty set => engine falls back to built-in defaults.
* ``FinancialHealthScore`` – an immutable snapshot of a computed score plus its
  grade, trend, and per-dimension contribution breakdown. History of these
  snapshots powers the timeline / comparison views.
* ``HealthRecommendation`` – an actionable, explainable improvement suggested by
  the engine for a given score snapshot.

All three are scoped to a ``Project`` (project=None keeps the legacy,
pre-scoping behaviour) so a single backend serves many independent workspaces.
"""
from decimal import Decimal

from django.db import models
from django.utils import timezone
import uuid


# Dimensions recognised by the engine. Kept here so the config model, the
# engine, and the UI all reference a single source of truth.
DIMENSION_KEYS = [
    'budget_management',
    'cash_flow_stability',
    'savings_ratio',
    'income_stability',
    'expense_distribution',
    'spending_behaviour',
    'goal_progress',
    'financial_discipline',
    'recurring_commitments',
    'risk_indicators',
]

DIMENSION_LABELS = {
    'budget_management': 'Budget Management',
    'cash_flow_stability': 'Cash Flow Stability',
    'savings_ratio': 'Savings Ratio',
    'income_stability': 'Income Stability',
    'expense_distribution': 'Expense Distribution',
    'spending_behaviour': 'Spending Behaviour',
    'goal_progress': 'Goal Progress',
    'financial_discipline': 'Financial Discipline',
    'recurring_commitments': 'Recurring Commitments',
    'risk_indicators': 'Risk Indicators',
}

DEFAULT_DIMENSION_WEIGHTS = {
    'budget_management': Decimal('0.15'),
    'cash_flow_stability': Decimal('0.15'),
    'savings_ratio': Decimal('0.15'),
    'income_stability': Decimal('0.10'),
    'expense_distribution': Decimal('0.10'),
    'spending_behaviour': Decimal('0.10'),
    'goal_progress': Decimal('0.10'),
    'financial_discipline': Decimal('0.05'),
    'recurring_commitments': Decimal('0.05'),
    'risk_indicators': Decimal('0.05'),
}

# Health grades mapped to score ranges (inclusive lower bound).
GRADE_BANDS = [
    (90, 'A', 'Excellent'),
    (80, 'B', 'Good'),
    (70, 'C', 'Fair'),
    (60, 'D', 'Poor'),
    (0, 'F', 'Critical'),
]


def grade_for_score(score: Decimal) -> tuple:
    """Return (grade_letter, grade_label) for a 0-100 score."""
    value = int(score)
    for threshold, letter, label in GRADE_BANDS:
        if value >= threshold:
            return letter, label
    return 'F', 'Critical'


class ScoreDimensionConfig(models.Model):
    """Per-project weight + enabled toggle for a scoring dimension.

    One row per dimension. When a project has no rows the engine uses
    ``DEFAULT_DIMENSION_WEIGHTS``. Storing weights in the DB makes the model
    configurable without code changes (the task requires configurable weights,
    not hardcoded ones).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='score_configs')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='score_configs',
    )
    dimension = models.CharField(max_length=40, choices=[(k, DIMENSION_LABELS[k]) for k in DIMENSION_KEYS])
    weight = models.DecimalField(max_digits=4, decimal_places=3, default=Decimal('0.100'))
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'score_dimension_configs'
        unique_together = [['user', 'project', 'dimension']]
        indexes = [models.Index(fields=['user'])]

    def __str__(self):
        return f"{self.dimension} ({self.weight}) - {self.user.email}"


class FinancialHealthScore(models.Model):
    """Immutable snapshot of a computed financial health score for a project.

    Created every time the engine recomputes. Historical snapshots drive the
    timeline, trend, and comparison features.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='health_scores')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='health_scores',
    )
    score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    grade = models.CharField(max_length=2, default='F')
    grade_label = models.CharField(max_length=20, default='Critical')
    # Previous snapshot's score for fast trend calculation.
    previous_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    trend = models.CharField(
        max_length=10,
        choices=[('up', 'Up'), ('down', 'Down'), ('flat', 'Flat')],
        default='flat',
    )
    # JSON breakdown: per-dimension raw metrics, normalized score, weight,
    # contribution, explanation and recommended improvements. Fully explainable.
    dimensions = models.JSONField(default=list, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    risks = models.JSONField(default=list, blank=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    computed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'financial_health_scores'
        ordering = ['-computed_at']
        indexes = [
            models.Index(fields=['user', 'computed_at']),
            models.Index(fields=['project', 'computed_at']),
        ]

    def __str__(self):
        return f"Score {self.score} ({self.grade}) - {self.user.email}"

    def save(self, *args, **kwargs):
        letter, label = grade_for_score(self.score)
        self.grade = letter
        self.grade_label = label
        if self.score is not None and self.previous_score is not None:
            if self.score > self.previous_score + Decimal('0.5'):
                self.trend = 'up'
            elif self.score < self.previous_score - Decimal('0.5'):
                self.trend = 'down'
            else:
                self.trend = 'flat'
        super().save(*args, **kwargs)


class HealthRecommendation(models.Model):
    """An actionable improvement tied to a score snapshot.

    The engine emits recommendations with an estimated score uplift. They are
    stored so the UI can show "estimated score improvement if followed".
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='health_recommendations')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='health_recommendations',
    )
    score_snapshot = models.ForeignKey(
        FinancialHealthScore, on_delete=models.CASCADE, null=True, blank=True,
        related_name='recommendations',
    )
    dimension = models.CharField(max_length=40, choices=[(k, DIMENSION_LABELS[k]) for k in DIMENSION_KEYS])
    title = models.CharField(max_length=255)
    detail = models.TextField(blank=True)
    estimated_improvement = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    priority = models.CharField(
        max_length=10,
        choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')],
        default='medium',
    )
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'health_recommendations'
        ordering = ['-estimated_improvement']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['resolved']),
        ]

    def __str__(self):
        return f"Recommendation: {self.title} - {self.user.email}"
