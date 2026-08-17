import uuid

from django.db import models
from django.utils import timezone


class CategoryFeedback(models.Model):
    """Records when a user corrects an ML-predicted category."""

    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='category_feedback')
    project = models.ForeignKey(
        'Project', on_delete=models.CASCADE, null=True, blank=True,
        related_name='project_category_feedback',
    )
    transaction = models.ForeignKey('Transaction', on_delete=models.CASCADE, related_name='category_feedback')
    merchant = models.CharField(max_length=255)
    description = models.CharField(max_length=500)
    predicted_category = models.ForeignKey('Category', on_delete=models.PROTECT, related_name='feedback_as_predicted')
    actual_category = models.ForeignKey('Category', on_delete=models.PROTECT, related_name='feedback_as_actual')
    confidence = models.FloatField()
    timestamp = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'category_feedback'
        indexes = [
            models.Index(fields=['user', 'project']),
            models.Index(fields=['transaction']),
        ]

    def __str__(self):
        return f"Feedback {self.transaction_id}: {self.predicted_category} -> {self.actual_category}"


class MLTrainingSample(models.Model):
    """Curated training sample for the categorizer."""

    SOURCE_CHOICES = [
        ('KAGGLE', 'Kaggle'),
        ('IMPORT', 'Import'),
        ('MANUAL', 'Manual'),
        ('FEEDBACK', 'Feedback'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.CharField(max_length=255)
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20)
    category = models.ForeignKey('Category', on_delete=models.PROTECT, related_name='training_samples')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    created_at = models.DateTimeField()
    model_version = models.CharField(max_length=50, blank=True)
    is_verified = models.BooleanField(default=True)
    created_at_db = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ml_training_samples'
        indexes = [
            models.Index(fields=['source']),
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
        ]
        unique_together = [['merchant', 'description', 'amount', 'transaction_type', 'category', 'source']]

    def __str__(self):
        return f"{self.merchant} / {self.description} -> {self.category.name}"


class MLModelVersion(models.Model):
    """Tracks a trained model version on disk."""

    STATUS_CHOICES = [
        ('candidate', 'Candidate'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('deprecated', 'Deprecated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    version = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='candidate')
    accuracy = models.FloatField(null=True, blank=True)
    f1_score = models.FloatField(null=True, blank=True)
    training_samples = models.IntegerField(null=True, blank=True)
    model_path = models.CharField(max_length=500)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    promoted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ml_model_versions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['version']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Model {self.version} ({self.status})"
