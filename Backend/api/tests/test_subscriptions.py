"""
Tests for the Subscription Detection engine + API.

Covers: merchant normalization, the pattern-mining heuristic (cadence/confidence/
monthly cost inference, suppression of unstable/one-off series), persistence +
dedup-by-key on re-scan, ignore/confirm/convert user actions, the API surface
(auth + project scoping), the per-day Bills-category notification, and a
regression that the financial-health recompute still works after the detection
hook.
"""
import pytest
from decimal import Decimal
from datetime import date, timedelta
from rest_framework import status

pytestmark = [pytest.mark.django_db]


from ..models import Subscription, SubscriptionFeedback, Alert, RecurringRule
from ..services.subscriptions import (
    detect_for_project, detect_after_change,
    normalize_merchant, mine_merchant, detect_series,
    ignore_subscription, confirm_subscription, convert_subscription,
)
from ..tests.factories import CategoryFactory, TransactionFactory


def _seed_monthly_subscription(user, project, merchant='Netflix', amount='499.00',
                                months=4):
    """Seed a clean monthly subscription: same amount, ~30 day gaps (recent dates)."""
    from django.utils import timezone
    today = timezone.localdate()
    anchor = today.replace(day=5) - timedelta(days=30 * (months - 1))
    cat = CategoryFactory(user=user, project=project, name=merchant, type='expense')
    txns = []
    for i in range(months):
        day = anchor + timedelta(days=30 * i)
        txns.append(TransactionFactory(
            user=user, project=project, type='expense', amount=Decimal(amount),
            description=f"{merchant} subscription", category=cat, date=day,
        ))
    return cat, txns


def _seed_one_off(user, project, merchant='Amazon', amount='1200.00', n=3):
    """Seed irregular one-off purchases (not a subscription)."""
    from django.utils import timezone
    today = timezone.localdate()
    anchor = today.replace(day=5)
    cat = CategoryFactory(user=user, project=project, name=merchant, type='expense')
    txns = []
    for i in range(n):
        # Irregular gaps and amounts -> should NOT be detected.
        day = anchor + timedelta(days=13 * i + (5 if i % 2 else 0))
        amt = Decimal(amount) + Decimal(str(i * 37))
        txns.append(TransactionFactory(
            user=user, project=project, type='expense', amount=amt,
            description=f"{merchant} order", category=cat, date=day,
        ))
    return cat, txns


# ---------------------------------------------------------------------------
# Merchant normalization
# ---------------------------------------------------------------------------

class TestNormalizeMerchant:
    def test_strips_noise_and_reference_numbers(self):
        assert normalize_merchant('NETFLIX.COM  TXN882139') == 'netflix'
        assert normalize_merchant('Spotify Premium Subscription') == 'spotify premium'
        assert normalize_merchant('Adobe Inc. Renewal 1234') == 'adobe'

    def test_empty(self):
        assert normalize_merchant('') == ''


# ---------------------------------------------------------------------------
# Mining heuristic
# ---------------------------------------------------------------------------

class TestMining:
    def test_detects_monthly_series(self, user, project):
        _seed_monthly_subscription(user, project, months=4)
        hits = detect_series(
            __import__('api.services.subscriptions', fromlist=['gather_candidates'])
            .gather_candidates(user, project)
        )
        assert any(h['merchant'] == 'netflix' for h in hits)
        netflix = next(h for h in hits if h['merchant'] == 'netflix')
        assert netflix['cadence'] == 'monthly'
        assert netflix['occurrences'] == 4
        assert netflix['avg_amount'] == Decimal('499.00')
        assert netflix['monthly_cost'] == Decimal('499.00')

    def test_suppresses_one_off_irregular(self, user, project):
        _seed_one_off(user, project)
        hits = detect_series(
            __import__('api.services.subscriptions', fromlist=['gather_candidates'])
            .gather_candidates(user, project)
        )
        assert not any(h['merchant'] == 'amazon' for h in hits)

    def test_requires_min_occurrences(self, user, project):
        # Only 2 occurrences -> below threshold, not detected.
        _seed_monthly_subscription(user, project, months=2)
        hits = detect_series(
            __import__('api.services.subscriptions', fromlist=['gather_candidates'])
            .gather_candidates(user, project)
        )
        assert not any(h['merchant'] == 'netflix' for h in hits)

    def test_mine_merchant_returns_none_for_few(self, user, project):
        cat, txns = _seed_monthly_subscription(user, project, months=2)
        candidates = [
            {'id': str(t.id), 'date': t.date, 'amount': t.amount,
             'merchant': 'netflix', 'category_id': str(cat.id),
             'category_name': cat.name, 'description': t.description}
            for t in txns
        ]
        assert mine_merchant('netflix', candidates) is None


# ---------------------------------------------------------------------------
# Persistence + dedup
# ---------------------------------------------------------------------------

class TestPersistence:
    def test_detect_persists_rows(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        subs = detect_for_project(user, project, notify=False)
        assert len(subs) >= 1
        assert Subscription.objects.filter(user=user, project=project).count() >= 1

    def test_dedup_updates_in_place_on_rescan(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        detect_for_project(user, project, notify=False)
        first_ids = set(
            Subscription.objects.filter(user=user, project=project).values_list('id', flat=True)
        )
        detect_for_project(user, project, notify=False)
        second_ids = set(
            Subscription.objects.filter(user=user, project=project)
            .exclude(status='ignored').values_list('id', flat=True)
        )
        assert first_ids == second_ids

    def test_ignored_merchant_suppressed_on_rescan(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        subs = detect_for_project(user, project, notify=False)
        netflix = next(s for s in subs if s.merchant == 'netflix')
        ignore_subscription(netflix)
        # Re-scan should not return the ignored merchant.
        subs2 = detect_for_project(user, project, notify=False)
        assert not any(s.merchant == 'netflix' for s in subs2)
        assert SubscriptionFeedback.objects.filter(
            user=user, project=project, merchant='netflix', label='ignored'
        ).exists()


# ---------------------------------------------------------------------------
# User actions
# ---------------------------------------------------------------------------

class TestUserActions:
    def test_confirm(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        sub = detect_for_project(user, project, notify=False)[0]
        confirm_subscription(sub)
        sub.refresh_from_db()
        assert sub.status == 'confirmed'

    def test_ignore(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        sub = detect_for_project(user, project, notify=False)[0]
        ignore_subscription(sub)
        sub.refresh_from_db()
        assert sub.status == 'ignored'

    def test_convert_creates_recurring_rule(self, project_client, user, project):
        cat, txns = _seed_monthly_subscription(user, project, months=5)
        sub = detect_for_project(user, project, notify=False)[0]
        rule = convert_subscription(sub)
        assert isinstance(rule, RecurringRule)
        assert rule.frequency == 'monthly'
        assert rule.amount == Decimal('499.00')
        sub.refresh_from_db()
        assert sub.status == 'converted'
        assert sub.converted_rule_id == rule.id

    def test_convert_biweekly_interval(self, project_client, user, project):
        from django.utils import timezone
        cat = CategoryFactory(user=user, project=project, name='Gym', type='expense')
        anchor = timezone.localdate().replace(day=1)
        for i in range(4):
            TransactionFactory(
                user=user, project=project, type='expense', amount=Decimal('25.00'),
                description='Gym membership', category=cat,
                date=anchor + timedelta(days=14 * i),
            )
        sub = detect_for_project(user, project, notify=False)[0]
        assert sub.cadence == 'biweekly'
        rule = convert_subscription(sub)
        assert rule.frequency == 'weekly'
        assert rule.interval == 2


# ---------------------------------------------------------------------------
# API surface
# ---------------------------------------------------------------------------

class TestApi:
    def test_list_requires_auth(self, api_client):
        resp = api_client.get('/api/subscriptions/')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_scoped_to_project(self, project_client, user, project, other_project):
        from ..models import ProjectMember
        ProjectMember.objects.create(user=user, project=other_project, role='owner', invited_by=user)
        _seed_monthly_subscription(user, project)
        detect_for_project(user, project, notify=False)

        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        other_client = APIClient()
        token = RefreshToken.for_user(user)
        other_client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}',
            HTTP_X_PROJECT_ID=str(other_project.id),
        )
        resp = other_client.get('/api/subscriptions/', HTTP_X_PROJECT_ID=str(other_project.id))
        assert resp.status_code == status.HTTP_200_OK
        body = resp.data
        results = body.get('results', body) if isinstance(body, dict) else body
        assert len(results) == 0

        resp2 = project_client.get('/api/subscriptions/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp2.status_code == status.HTTP_200_OK
        body2 = resp2.data
        results2 = body2.get('results', body2) if isinstance(body2, dict) else body2
        assert len(results2) > 0

    def test_scan_endpoint(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        resp = project_client.post('/api/subscriptions/scan/', {}, format='json',
                                    HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        results = resp.data.get('results', []) if isinstance(resp.data, dict) else resp.data
        assert len(results) > 0

    def test_confirm_endpoint(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        sub = detect_for_project(user, project, notify=False)[0]
        resp = project_client.post(f'/api/subscriptions/{sub.id}/confirm/', {}, format='json',
                                    HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'confirmed'

    def test_ignore_endpoint(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        sub = detect_for_project(user, project, notify=False)[0]
        resp = project_client.post(f'/api/subscriptions/{sub.id}/ignore/', {}, format='json',
                                    HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['status'] == 'ignored'

    def test_convert_endpoint(self, project_client, user, project):
        _seed_monthly_subscription(user, project, months=5)
        sub = detect_for_project(user, project, notify=False)[0]
        resp = project_client.post(f'/api/subscriptions/{sub.id}/convert/', {}, format='json',
                                    HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_201_CREATED
        assert 'rule_id' in resp.data
        sub.refresh_from_db()
        assert sub.status == 'converted'

    def test_not_found_other_user(self, project_client, user, project, other_project):
        from ..models import ProjectMember
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken
        ProjectMember.objects.create(user=user, project=other_project, role='owner', invited_by=user)
        _seed_monthly_subscription(user, project)
        sub = detect_for_project(user, project, notify=False)[0]
        other_client = APIClient()
        token = RefreshToken.for_user(user)
        other_client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {str(token.access_token)}',
            HTTP_X_PROJECT_ID=str(other_project.id),
        )
        resp = other_client.post(f'/api/subscriptions/{sub.id}/ignore/', {}, format='json',
                                  HTTP_X_PROJECT_ID=str(other_project.id))
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class TestNotifications:
    def test_one_bills_alert_per_day(self, project_client, user, project):
        _seed_monthly_subscription(user, project)
        detect_for_project(user, project, notify=True)
        detect_for_project(user, project, notify=True)
        assert Alert.objects.filter(
            user=user, project=project, category='Bills'
        ).count() == 1


# ---------------------------------------------------------------------------
# Event-driven regression
# ---------------------------------------------------------------------------

class TestEventDrivenRegression:
    def test_recompute_after_change_still_works(self, project_client, user, project):
        from ..services.financial_health import recompute_for_project, FinancialHealthScore
        _seed_monthly_subscription(user, project)
        recompute_for_project(user, project, notify=False)
        result = detect_after_change(user, project)
        assert isinstance(result, list)
        assert FinancialHealthScore.objects.filter(user=user, project=project).count() >= 1
