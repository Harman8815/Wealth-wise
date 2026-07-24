import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import patch, MagicMock

from api.models import Transaction, CategoryFeedback, MLTrainingSample, MLModelVersion, Category
from api.tests.factories import TransactionFactory, CategoryFactory, UserFactory, ProjectFactory, AccountFactory
from api.services.ml_training.dataset_builder import DatasetBuilder
from api.services.ml_training.kaggle_loader import KaggleDatasetLoader
from api.services.ml_training.trainer import ModelTrainer
from api.services.ml_training.evaluator import ModelEvaluator
from api.services.ml_training.versioning import ModelVersionManager
from api.services.ml_training.inference import CategoryPredictor

pytestmark = [pytest.mark.django_db]


class TestDatasetBuilder:
    def test_build_from_backend_creates_samples(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=cat,
            merchant='Starbucks',
            description='Coffee',
        )
        builder = DatasetBuilder()
        count = builder.build_from_backend()
        assert count >= 1
        sample = MLTrainingSample.objects.first()
        assert sample.source == 'MANUAL'
        assert sample.is_verified is True

    def test_build_from_feedback_creates_samples(self, project_client):
        cat_predicted = CategoryFactory(user=project_client.user, project=project_client.project, name='Transport')
        cat_actual = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=cat_actual,
            predicted_category=cat_predicted,
            prediction_confidence=0.85,
            merchant='Uber',
            description='Ride',
        )
        fb = CategoryFeedback.objects.create(
            user=project_client.user,
            project=project_client.project,
            transaction=txn,
            merchant='Uber',
            description='Ride',
            predicted_category=cat_predicted,
            actual_category=cat_actual,
            confidence=0.85,
            timestamp=datetime.now(),
        )
        builder = DatasetBuilder()
        count = builder.build_from_feedback()
        assert count >= 1
        sample = MLTrainingSample.objects.filter(source='FEEDBACK').first()
        assert sample is not None
        assert sample.category == cat_actual

    def test_is_valid_requires_category(self, project_client):
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=None,
            merchant='Test',
            description='Test desc',
        )
        builder = DatasetBuilder()
        assert not builder._is_valid(txn)

    def test_determine_source_accepted_prediction(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=cat,
            predicted_category=cat,
            prediction_confidence=0.9,
        )
        builder = DatasetBuilder()
        assert builder._determine_source(txn) == 'MANUAL'

    def test_determine_source_feedback(self, project_client):
        cat_predicted = CategoryFactory(user=project_client.user, project=project_client.project, name='Transport')
        cat_actual = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=cat_actual,
            predicted_category=cat_predicted,
            prediction_confidence=0.8,
        )
        builder = DatasetBuilder()
        assert builder._determine_source(txn) == 'FEEDBACK'


class TestKaggleLoader:
    def test_load_missing_file_returns_empty(self):
        loader = KaggleDatasetLoader('/nonexistent/path.csv')
        records = loader.load()
        assert records == []

    def test_generate_sample_schema(self):
        schema = KaggleDatasetLoader.generate_sample_schema()
        assert 'merchant,description,amount,transaction_type,category' in schema


class TestModelTrainer:
    def test_train_returns_metrics(self):
        records = [
            {'merchant': 'Starbucks', 'description': 'Coffee', 'amount': 4.5, 'transaction_type': 'expense', 'category': 'Food'},
            {'merchant': 'Uber', 'description': 'Ride', 'amount': 24.0, 'transaction_type': 'expense', 'category': 'Transport'},
            {'merchant': 'Amazon', 'description': 'Books', 'amount': 15.0, 'transaction_type': 'expense', 'category': 'Shopping'},
            {'merchant': 'Netflix', 'description': 'Subscription', 'amount': 15.0, 'transaction_type': 'expense', 'category': 'Entertainment'},
            {'merchant': 'Salary', 'description': 'Monthly pay', 'amount': 5000.0, 'transaction_type': 'income', 'category': 'Salary'},
        ] * 4
        trainer = ModelTrainer(n_estimators=10, random_state=42)
        metrics = trainer.train(records)
        assert 'train_accuracy' in metrics
        assert 'train_f1' in metrics
        assert 'cv_f1_mean' in metrics
        assert metrics['n_samples'] == 20
        assert metrics['n_classes'] == 5

    def test_predict_returns_labels_and_confidences(self):
        records = [
            {'merchant': 'Starbucks', 'description': 'Coffee', 'amount': 4.5, 'transaction_type': 'expense', 'category': 'Food'},
            {'merchant': 'Uber', 'description': 'Ride', 'amount': 24.0, 'transaction_type': 'expense', 'category': 'Transport'},
            {'merchant': 'Amazon', 'description': 'Books', 'amount': 15.0, 'transaction_type': 'expense', 'category': 'Shopping'},
            {'merchant': 'Netflix', 'description': 'Subscription', 'amount': 15.0, 'transaction_type': 'expense', 'category': 'Entertainment'},
            {'merchant': 'Salary', 'description': 'Monthly pay', 'amount': 5000.0, 'transaction_type': 'income', 'category': 'Salary'},
        ] * 4
        trainer = ModelTrainer(n_estimators=10, random_state=42)
        trainer.train(records)
        test_records = [
            {'merchant': 'McDonalds', 'description': 'Burger', 'amount': 8.0, 'transaction_type': 'expense', 'category': 'Food'},
        ]
        labels, confidences = trainer.predict(test_records)
        assert len(labels) == 1
        assert len(confidences) == 1
        assert 0.0 <= confidences[0] <= 1.0

    def test_train_empty_raises(self):
        trainer = ModelTrainer(n_estimators=10, random_state=42)
        with pytest.raises(ValueError, match='No training records'):
            trainer.train([])


class TestModelVersionManager:
    def test_next_version_increments(self, project_client):
        MLModelVersion.objects.create(
            version='v1.0',
            status='approved',
            promoted_at=datetime.now(),
        )
        manager = ModelVersionManager()
        next_ver = manager.next_version()
        assert next_ver == 'v1.1'

    def test_next_version_first(self):
        MLModelVersion.objects.all().delete()
        manager = ModelVersionManager()
        next_ver = manager.next_version()
        assert next_ver == 'v1.0'


class TestModelEvaluator:
    def test_should_deploy_when_no_production(self):
        evaluator = ModelEvaluator()
        candidate = {'accuracy': 0.95, 'f1_score': 0.93}
        deploy, reason = evaluator.should_deploy(candidate, None)
        assert deploy is True
        assert 'No production' in reason

    def test_should_not_deploy_on_regression(self):
        evaluator = ModelEvaluator()
        candidate = {'accuracy': 0.85, 'f1_score': 0.83}
        production = {'accuracy': 0.90, 'f1_score': 0.88}
        deploy, reason = evaluator.should_deploy(candidate, production)
        assert deploy is False
        assert 'Regression' in reason

    def test_should_deploy_on_improvement(self):
        evaluator = ModelEvaluator()
        candidate = {'accuracy': 0.95, 'f1_score': 0.93}
        production = {'accuracy': 0.90, 'f1_score': 0.88}
        deploy, reason = evaluator.should_deploy(candidate, production)
        assert deploy is True
        assert deploy is True


class TestCategoryFeedbackView:
    def test_category_change_creates_feedback(self, project_client, category):
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=category,
            predicted_category=category,
            prediction_confidence=0.9,
            merchant='Starbucks',
            description='Coffee',
        )
        new_cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Transport')
        response = project_client.patch(
            f'/api/transactions/{txn.id}/',
            {'category_id': str(new_cat.id)},
            format='json',
        )
        assert response.status_code == 200
        feedback = CategoryFeedback.objects.filter(transaction=txn)
        assert feedback.exists()
        txn.refresh_from_db()
        assert txn.predicted_category is None

    def test_non_predicted_category_change_no_feedback(self, project_client, category):
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=category,
            merchant='Starbucks',
            description='Coffee',
        )
        new_cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Transport')
        response = project_client.patch(
            f'/api/transactions/{txn.id}/',
            {'category_id': str(new_cat.id)},
            format='json',
        )
        assert response.status_code == 200
        feedback = CategoryFeedback.objects.filter(transaction=txn)
        assert not feedback.exists()


class TestPredictCategoryView:
    def test_predict_endpoint(self, project_client):
        response = project_client.post(
            '/api/transactions/predict_category/',
            {
                'merchant': 'Starbucks',
                'description': 'Coffee latte',
                'amount': 4.50,
                'type': 'expense',
            },
            format='json',
        )
        assert response.status_code == 200
        assert 'category' in response.data
        assert 'confidence' in response.data


class TestTransactionSerializerMLFields:
    def test_predicted_category_in_response(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        txn = TransactionFactory(
            user=project_client.user,
            project=project_client.project,
            category=cat,
            predicted_category=cat,
            prediction_confidence=0.92,
            merchant='Starbucks',
        )
        response = project_client.get(f'/api/transactions/{txn.id}/')
        assert response.status_code == 200
        assert response.data['predicted_category']['name'] == 'Food'
        assert response.data['merchant'] == 'Starbucks'

    def test_predict_category_id_on_create(self, project_client):
        cat = CategoryFactory(user=project_client.user, project=project_client.project, name='Food')
        response = project_client.post(
            '/api/transactions/',
            {
                'date': '2024-06-01',
                'description': 'Coffee',
                'category_id': str(cat.id),
                'predicted_category_id': str(cat.id),
                'prediction_confidence': 0.95,
                'merchant': 'Starbucks',
                'amount': 4.50,
                'type': 'expense',
                'status': 'completed',
            },
            format='json',
        )
        assert response.status_code == 201
        txn = Transaction.objects.get(id=response.data['id'])
        assert txn.predicted_category == cat
        assert txn.prediction_confidence == 0.95
        assert txn.merchant == 'Starbucks'


class TestMLModelVersionModel:
    def test_version_creation(self, project_client):
        ver = MLModelVersion.objects.create(
            version='v1.0',
            status='approved',
            accuracy=0.95,
            f1_score=0.93,
            training_samples=1000,
            model_path='/models/v1.0',
        )
        assert ver.version == 'v1.0'
        assert ver.status == 'approved'
        assert ver.accuracy == 0.95

    def test_version_str(self):
        ver = MLModelVersion(version='v1.0', status='candidate')
        assert str(ver) == 'Model v1.0 (candidate)'