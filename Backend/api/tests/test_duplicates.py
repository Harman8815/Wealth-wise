"""
Tests for the Duplicate Transaction Detection engine (Django side).

The fuzzy scoring lives in the external ML microservice, so these tests mock
``services.ml_client.scan`` / ``score_batch`` (returning canned groups/matches)
and verify the Django orchestration: persistence, project scoping, resolution
actions, feedback suppression, import-time skip/flag behaviour, graceful
fallback when the service is down, and notifications.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest import mock

from rest_framework import status

pytestmark = [pytest.mark.django_db]

from ..models import (
    DuplicateGroup, DuplicateMatch, DuplicateFeedback,
    Transaction, Alert,
)
from ..services import duplicates as dup_service
from ..services.ml_client import MLServiceUnavailable


def _make_txn(user, project, desc, amount=Decimal('2500.00'), d=None, ttype='expense'):
    from .factories import CategoryFactory, AccountFactory, TransactionFactory
    cat = CategoryFactory(user=user, project=project, name='Food', type=ttype)
    acc = AccountFactory(user=user, project=project)
    return TransactionFactory(
        user=user, project=project, category=cat, account=acc,
        description=desc, amount=amount, type=ttype,
        date=d or (date.today() - timedelta(days=1)),
    )


def _group_payload(a, b):
    return [{
        'members': [str(a.id), str(b.id)],
        'matches': [{
            'a_id': str(a.id), 'b_id': str(b.id),
            'score': 0.92, 'confidence': 'high',
            'features': {'description_sim': 0.9, 'amount_sim': 1.0, 'date_sim': 0.75},
            'explanation': 'Same amount, 1 day apart.',
        }],
    }]


class TestStandingScan:
    def test_scan_persists_groups(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        assert len(groups) == 1
        assert groups[0].matches.count() == 1
        assert DuplicateMatch.objects.filter(user=user, project=project).count() == 1

    def test_scan_emits_notification(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            dup_service.scan_for_project(user, project)
        assert Alert.objects.filter(user=user, category='Activity').exists()

    def test_scan_skips_feedback_suppressed_pairs(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        DuplicateFeedback.objects.create(
            user=user, project=project, transaction_a=a, transaction_b=b,
            label='not_duplicate',
        )
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        assert groups == []

    def test_scan_graceful_fallback(self, user, project):
        _make_txn(user, project, 'Swiggy order 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', side_effect=MLServiceUnavailable('down')):
            groups = dup_service.scan_for_project(user, project)
        assert groups == []
        # No groups persisted when the service is unavailable.
        assert DuplicateGroup.objects.filter(user=user).count() == 0

    def test_scan_is_idempotent(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        payload = _group_payload(a, b)
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=payload):
            first = dup_service.scan_for_project(user, project)
            second = dup_service.scan_for_project(user, project)
        assert len(first) == 1
        # Re-scanning pending pairs does not create a second group.
        assert len(second) == 0
        assert DuplicateGroup.objects.filter(user=user, project=project).count() == 1


class TestResolve:
    def test_resolve_deleted_removes_transaction(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        match = groups[0].matches.first()
        dup_txn_id = match.transaction_id
        dup_service.resolve_match(match, 'deleted')
        assert not Transaction.objects.filter(id=dup_txn_id).exists()
        # The match row is cascade-deleted with its transaction.
        assert not DuplicateMatch.objects.filter(id=match.id).exists()

    def test_resolve_not_duplicate_writes_feedback(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        match = groups[0].matches.first()
        dup_service.resolve_match(match, 'not_duplicate')
        assert DuplicateFeedback.objects.filter(
            user=user, label='not_duplicate',
            transaction_a=match.transaction, transaction_b=match.duplicate_of,
        ).exists()

    def test_resolve_kept_leaves_transaction(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        match = groups[0].matches.first()
        txn_id = match.transaction_id
        dup_service.resolve_match(match, 'kept')
        assert Transaction.objects.filter(id=txn_id).exists()


class TestFeedback:
    def test_record_feedback_dedup(self, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        fb = dup_service.record_feedback(user, project, str(a.id), str(b.id), 'not_duplicate')
        assert fb.label == 'not_duplicate'
        # Re-recording the same pair must not create a second row.
        dup_service.record_feedback(user, project, str(a.id), str(b.id), 'not_duplicate')
        assert DuplicateFeedback.objects.filter(user=user).count() == 1


class TestImportDetection:
    def test_detect_for_import_flags_high(self, user, project):
        existing = _make_txn(user, project, 'Swiggy order 1234')
        rows = [{
            'row_id': 'import-0',
            'date': date.today().isoformat(),
            'amount': -2500.0,
            'description': 'SWIGGY ORDER 1234',
        }]
        match = {
            'b_id': str(existing.id), 'score': 0.92, 'confidence': 'high',
            'features': {'description_sim': 0.9, 'amount_sim': 1.0, 'date_sim': 0.75},
            'explanation': 'x',
        }
        with mock.patch.object(dup_service.ml_client, 'score_batch', return_value=[match]):
            results = dup_service.detect_for_import(user, project, rows)
        assert results[0]['confidence'] == 'high'
        assert len(results[0]['matches']) == 1

    def test_detect_for_import_graceful_fallback(self, user, project):
        rows = [{'row_id': 'i', 'date': date.today().isoformat(), 'amount': -10.0, 'description': 'x'}]
        with mock.patch.object(dup_service.ml_client, 'score_batch', side_effect=MLServiceUnavailable('down')):
            results = dup_service.detect_for_import(user, project, rows)
        assert results[0]['confidence'] is None
        assert results[0]['matches'] == []


class TestApi:
    def test_list_open_groups(self, project_client, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            dup_service.scan_for_project(user, project)
        resp = project_client.get('/api/duplicates/', HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK

    def test_scan_endpoint(self, project_client, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            resp = project_client.post('/api/duplicates/scan/', {}, format='json',
                                        HTTP_X_PROJECT_ID=str(project.id))
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['groups_found'] >= 1

    def test_resolve_endpoint(self, project_client, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            groups = dup_service.scan_for_project(user, project)
        match = groups[0].matches.first()
        resp = project_client.post(
            f'/api/duplicates/{groups[0].id}/matches/{match.id}/resolve/',
            {'resolution': 'not_duplicate'}, format='json',
            HTTP_X_PROJECT_ID=str(project.id),
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['resolution'] == 'not_duplicate'

    def test_feedback_endpoint(self, project_client, user, project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        resp = project_client.post(
            '/api/duplicates/feedback/', {
                'transaction_a': str(a.id),
                'transaction_b': str(b.id),
                'label': 'not_duplicate',
            }, format='json', HTTP_X_PROJECT_ID=str(project.id),
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data['label'] == 'not_duplicate'

    def test_project_isolation(self, user, project, other_user, other_project):
        a = _make_txn(user, project, 'Swiggy order 1234')
        b = _make_txn(user, project, 'SWIGGY ORDER 1234')
        with mock.patch.object(dup_service.ml_client, 'scan', return_value=_group_payload(a, b)):
            dup_service.scan_for_project(user, project)
        # Other user (different project) must not see the groups.
        assert DuplicateGroup.objects.filter(user=other_user).count() == 0
        assert DuplicateGroup.objects.filter(user=user, project=project).count() == 1
