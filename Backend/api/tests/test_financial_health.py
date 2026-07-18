"""
Tests for the Financial Health Score Engine.

Covers: engine math (weighted, explainable, clamped), configurable weights,
snapshot persistence + timeline, recommendations, the rule engine, the API
surface (current / history / report / recompute / config), and event-driven
recompute when transactions change.
"""
import pytest
from decimal import Decimal
from rest_framework import status

pytestmark = [pytest.mark.django_db]


from ..models import (
    FinancialHealthScore, ScoreDimensionConfig, HealthRecommendation,
)
from ..services.financial_health import (
    compute_score, recompute_for_project, resolve_weights,
    evaluate_rules, RuleContext, DEFAULT_DIMENSION_WEIGHTS,
)


def _seed_scenario(project_client, user, project, factories):
    """Create a healthy-ish scenario: income, budget, goal, accounts."""
    from ..tests.factories import (
        CategoryFactory, AccountFactory, BudgetCategoryFactory,
        GoalFactory, TransactionFactory,
    )
    cat = CategoryFactory(user=user, project=project, name='Salary', type='income')
    exp_cat = CategoryFactory(user=user, project=project, name='Food', type='expense')
    AccountFactory(user=user, project=project, balance=Decimal('20000'))
    budget = BudgetCategoryFactory(
        user=user, project=project, name='Food', budgeted=Decimal('5000'),
        spent=Decimal('2000'), category=exp_cat,
    )
    GoalFactory(user=user, project=project, target_amount=Decimal('100000'),
                current_amount=Decimal('40000'))
    # Income > expense in the window.
    TransactionFactory(user=user, project=project, type='income', amount=Decimal('100000'),
                       category=cat, date=__import__('datetime').date(2024, 1, 15))
    TransactionFactory(user=user, project=project, type='expense', amount=Decimal('30000'),
                       category=exp_cat, date=__import__('datetime').date(2024, 1, 20))
    return budget


# ---------------------------------------------------------------------------
# Engine math
# ---------------------------------------------------------------------------

class TestEngineMath:
    def test_score_is_between_0_and_100(self, user, project):
        result = compute_score(user, project)
        assert 0 <= float(result.score) <= 100

    def test_dimensions_present_and_weighted(self, user, project):
        result = compute_score(user, project)
        assert len(result.dimensions) == len(DEFAULT_DIMENSION_WEIGHTS)
        total_weight = sum((d.weight for d in result.dimensions), Decimal('0'))
        # Default weights sum to 1.0.
        assert abs(float(total_weight) - 1.0) < 1e-6

    def test_configurable_weights_applied(self, user, project):
        ScoreDimensionConfig.objects.create(
            user=user, project=project, dimension='savings_ratio',
            weight=Decimal('0.5'), enabled=True,
        )
        weights = resolve_weights(user, project)
        assert weights['savings_ratio'] == Decimal('0.5')

    def test_disabled_dimension_zero_weight(self, user, project):
        ScoreDimensionConfig.objects.create(
            user=user, project=project, dimension='savings_ratio',
            weight=Decimal('0.5'), enabled=False,
        )
        weights = resolve_weights(user, project)
        assert weights['savings_ratio'] == Decimal('0')

    def test_healthy_scenario_scores_high(self, project_client, user, project):
        _seed_scenario(project_client, user, project, None)
        result = compute_score(user, project)
        # Savings rate ~70%, positive cash flow => should be reasonably high.
        assert float(result.score) >= 50
        assert result.grade in {'A', 'B', 'C'}

    def test_explainable_breakdown(self, user, project):
        result = compute_score(user, project)
        snap = result.dimensions[0].__dict_for_storage__()
        assert 'normalized_score' in snap
        assert 'contribution' in snap
        assert 'explanation' in snap


# ---------------------------------------------------------------------------
# Persistence + timeline
# ---------------------------------------------------------------------------

class TestPersistence:
    def test_recompute_creates_snapshot(self, user, project):
        snapshot = recompute_for_project(user, project, notify=False)
        assert isinstance(snapshot, FinancialHealthScore)
        assert snapshot.score is not None
        assert FinancialHealthScore.objects.filter(user=user, project=project).count() == 1

    def test_history_timeline_ordered(self, user, project):
        recompute_for_project(user, project, notify=False)
        recompute_for_project(user, project, notify=False)
        snapshots = list(
            FinancialHealthScore.objects.filter(user=user, project=project).order_by('-computed_at')
        )
        assert len(snapshots) == 2
        # Second snapshot records previous score for trend.
        assert snapshots[0].previous_score is not None

    def test_recommendations_persisted(self, project_client, user, project):
        _seed_scenario(project_client, user, project, None)
        snapshot = recompute_for_project(user, project, notify=False)
        recs = HealthRecommendation.objects.filter(score_snapshot=snapshot)
        assert recs.count() > 0


# ---------------------------------------------------------------------------
# Rule engine
# ---------------------------------------------------------------------------

class TestRuleEngine:
    def test_rule_registry_evaluates(self, user, project):
        result = compute_score(user, project)
        ctx = RuleContext(user=user, project=project, metrics=result.metrics,
                          dimensions={d.key: d for d in result.dimensions})
        hits = evaluate_rules(ctx)
        assert isinstance(hits, list)


# ---------------------------------------------------------------------------
# API surface
# ---------------------------------------------------------------------------

class TestApi:
    def test_current_creates_if_missing(self, project_client, user, project):
        resp = project_client.get('/api/financial-health/current/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert 'score' in resp.data
        assert 'dimensions' in resp.data
        assert 'grade' in resp.data

    def test_history_endpoint(self, project_client, user, project):
        recompute_for_project(user, project, notify=False)
        resp = project_client.get('/api/financial-health/history/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK

    def test_report_endpoint(self, project_client, user, project):
        _seed_scenario(project_client, user, project, None)
        resp = project_client.get('/api/financial-health/report/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert 'snapshot' in resp.data
        assert 'recommendations' in resp.data
        assert 'estimated_improvement' in resp.data

    def test_recompute_endpoint(self, project_client, user, project):
        resp = project_client.post('/api/financial-health/recompute/', {}, format='json',
                                    HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert 'score' in resp.data

    def test_config_get_and_put(self, project_client, user, project):
        resp = project_client.get('/api/financial-health/config/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert 'dimensions' in resp.data

        resp = project_client.put(
            '/api/financial-health/config/',
            {'weights': {'savings_ratio': {'weight': 0.4, 'enabled': True}}},
            format='json', HTTP_X_PROJECT_ID=str(project.id),
        )
        assert resp.status_code == status.HTTP_200_OK
        saved = ScoreDimensionConfig.objects.get(user=user, project=project, dimension='savings_ratio')
        assert saved.weight == Decimal('0.4')
        assert saved.enabled is True


# ---------------------------------------------------------------------------
# Event-driven recompute
# ---------------------------------------------------------------------------

class TestEventDriven:
    def test_transaction_creation_triggers_recompute(self, project_client, user, project):
        from ..tests.factories import CategoryFactory
        cat = CategoryFactory(user=user, project=project, name='Salary', type='income')
        recompute_for_project(user, project, notify=False)
        before = FinancialHealthScore.objects.filter(user=user, project=project).count()

        resp = project_client.post('/api/transactions/', {
            'date': '2024-02-01',
            'description': 'Bonus',
            'category_id': str(cat.id),
            'amount': '50000.00',
            'type': 'income',
            'status': 'completed',
        }, format='json', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_201_CREATED

        after = FinancialHealthScore.objects.filter(user=user, project=project).count()
        assert after == before + 1
