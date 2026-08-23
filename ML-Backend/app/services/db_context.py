"""
Database context service for ML-Backend.

Inspects the Django database schema and provides structured context
for AI agents to understand the database structure.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import django
from django.conf import settings


def _setup_django() -> None:
    if not django.apps.apps.ready:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wealthwise_backend.settings')
        django.setup()


def get_database_context() -> Dict[str, Any]:
    """Return structured database schema context."""
    _setup_django()

    from django.db import connection
    from django.apps import apps

    tables = []
    for model in apps.get_models():
        table_name = model._meta.db_table
        columns = []
        for field in model._meta.get_fields():
            if hasattr(field, 'column'):
                columns.append({
                    'name': field.column,
                    'type': field.get_internal_type(),
                    'primary_key': getattr(field, 'primary_key', False),
                    'nullable': getattr(field, 'null', False),
                    'unique': getattr(field, 'unique', False),
                    'max_length': getattr(field, 'max_length', None),
                })

        relationships = []
        for field in model._meta.get_fields():
            if field.is_relation:
                relationships.append({
                    'type': 'one_to_one' if field.one_to_one else ('one_to_many' if field.one_to_many else 'many_to_one'),
                    'field': field.name,
                    'related_model': field.related_model._meta.label if field.related_model else None,
                })

        tables.append({
            'name': table_name,
            'model': model._meta.label,
            'columns': columns,
            'relationships': relationships,
        })

    return {
        'database_type': connection.vendor,
        'database_name': connection.settings_dict.get('NAME', ''),
        'tables': tables,
        'table_count': len(tables),
    }


def refresh_database_context() -> Dict[str, Any]:
    """Refresh and return the database context."""
    return get_database_context()
