"""
Import & Export API views for WealthWise.

These endpoints expose the reusable ``data_io`` services for the transaction
domain. The heavy lifting (parsing, mapping, validation, export rendering)
lives in ``api.services.data_io`` so it can be reused by other modules.
"""
from __future__ import annotations

import uuid

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.http import HttpResponse

from ..base import project_scope_filter
from ..models import (
    Transaction,
    Category,
    Account,
    ImportJob,
    ExportJob,
    MappingTemplate,
)
from ..services.data_io import FileParser, ImportService, ExportService, MappingService, ParseError


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _project(request):
    return getattr(request, "active_project", None)


def _json_safe(value):
    """Coerce parsed values (Decimal, etc.) into JSON-serializable types."""
    from decimal import Decimal

    if isinstance(value, Decimal):
        return float(value)
    if value is None:
        return None
    return value


def _resolve_account(user, project, account_id, account_name):
    """Return an Account instance for the user, or None."""
    if account_id:
        try:
            return Account.objects.get(id=account_id, user=user)
        except (Account.DoesNotExist, ValueError):
            return None
    if account_name:
        return Account.objects.filter(user=user, name__iexact=account_name).first()
    return None


def _resolve_category(user, project, name, txn_type):
    """Get-or-create a category by name for the user."""
    name = (name or "").strip()
    if not name:
        return None
    category_type = "income" if txn_type == "income" else "expense"
    category, _ = Category.objects.get_or_create(
        user=user,
        name__iexact=name,
        type=category_type,
        project=project,
        defaults={
            "name": name,
            "type": category_type,
            "color": "#3b82f6",
            "text_color": "#ffffff",
            "icon": "utensils",
            "symbol": "utensils",
            "is_default": False,
        },
    )
    return category


def _transaction_sink(user, project):
    """Build a persistence sink for parsed transaction records."""

    def sink(records):
        created = 0
        for rec in records:
            if rec.get("amount") is None:
                continue
            amount = rec["amount"]
            txn_type = "income" if amount >= 0 else "expense"
            account = _resolve_account(
                user, project, rec.get("account_id"), rec.get("account_name")
            )
            category = _resolve_category(
                user, project, rec.get("category") or rec.get("merchant"), txn_type
            )
            Transaction.objects.create(
                user=user,
                project=project,
                account=account,
                date=rec.get("date"),
                description=rec.get("description") or rec.get("merchant") or "Imported",
                category=category,
                amount=abs(amount),
                type=txn_type,
                status="completed",
                account_name=account.name if account else "",
            )
            created += 1
        return created

    return sink


# --------------------------------------------------------------------------- #
# Upload / Parse
# --------------------------------------------------------------------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_upload(request):
    """Parse an uploaded file and return rows + auto-detected mapping."""
    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        FileParser.validate_file(uploaded.name, uploaded.size)
    except ParseError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    content = uploaded.read()
    job = ImportJob.objects.create(
        user=request.user,
        project=_project(request),
        filename=uploaded.name,
        status="parsed",
    )

    try:
        service = ImportService()
        result = service.parse_file(uploaded.name, content)
        result = service.analyze(result)
        mapping = service._last_mapping
    except ParseError as exc:
        job.status = "failed"
        job.error = str(exc)
        job.save(update_fields=["status", "error"])
        return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    preview = [
        {
            "index": r.index,
            "raw": r.raw,
            "normalized": {k: _json_safe(v) for k, v in r.normalized.items()},
            "errors": r.errors,
            "valid": r.valid,
        }
        for r in result.rows
    ]

    # Persist a draft snapshot so the client can commit without re-uploading.
    job.mapping = mapping
    job.snapshot = preview
    job.total_rows = result.total
    job.valid_rows = len(result.valid_rows)
    job.save(update_fields=["mapping", "snapshot", "total_rows", "valid_rows"])

    return Response(
        {
            "job_id": str(job.id),
            "headers": result.headers,
            "mapping": mapping,
            "rows": preview,
            "warnings": result.warnings,
            "total": result.total,
            "valid": len(result.valid_rows),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_commit(request, job_id):
    """Re-validate with a (possibly edited) mapping and persist valid rows."""
    try:
        job = ImportJob.objects.get(id=job_id, user=request.user)
    except (ImportJob.DoesNotExist, ValueError):
        return Response({"detail": "Import job not found."}, status=status.HTTP_404_NOT_FOUND)

    mapping = request.data.get("mapping") or job.mapping or {}
    skip_invalid = request.data.get("skip_invalid", True)
    account_id = request.data.get("account_id")

    # Re-apply the supplied mapping to the persisted snapshot.
    from ..services.data_io import ValidationService, ParsedRow

    rows = [
        ParsedRow(
            index=r["index"],
            raw=r["raw"],
            normalized=r.get("normalized", {}),
            errors=list(r.get("errors", [])),
            valid=r.get("valid", True),
            skipped=r.get("skipped", False),
        )
        for r in (job.snapshot or [])
    ]
    for r in rows:
        for std, src in mapping.items():
            r.normalized[std] = r.raw.get(src, "")
        if account_id:
            r.normalized["account_id"] = account_id

    ValidationService().validate(rows, mapping)

    service = ImportService()
    summary = service.commit(
        type("R", (), {"rows": rows, "valid_rows": [x for x in rows if x.valid and not x.skipped], "total": len(rows)})(),
        _transaction_sink(request.user, _project(request)),
        skip_invalid=skip_invalid,
    )

    job.status = "completed"
    job.imported_rows = summary["imported"]
    job.save(update_fields=["status", "imported_rows"])

    # Optionally persist the mapping as a reusable template.
    template_name = request.data.get("save_template_as")
    if template_name:
        MappingTemplate.objects.update_or_create(
            user=request.user,
            project=_project(request),
            name=template_name,
            defaults={"mapping": mapping},
        )

    return Response(
        {
            "imported": summary["imported"],
            "skipped": summary["skipped"],
            "total": summary["total"],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def import_history(request):
    jobs = ImportJob.objects.filter(user=request.user, **project_scope_filter(request)).order_by("-created_at")[:50]
    return Response(
        [
            {
                "id": str(j.id),
                "filename": j.filename,
                "status": j.status,
                "total_rows": j.total_rows,
                "valid_rows": j.valid_rows,
                "imported_rows": j.imported_rows,
                "error": j.error,
                "created_at": j.created_at,
            }
            for j in jobs
        ]
    )


# --------------------------------------------------------------------------- #
# Mapping templates
# --------------------------------------------------------------------------- #
@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def mapping_templates(request, template_id=None):
    if request.method == "GET":
        templates = MappingTemplate.objects.filter(
            user=request.user, **project_scope_filter(request)
        ).order_by("name")
        return Response(
            [{"id": str(t.id), "name": t.name, "mapping": t.mapping} for t in templates]
        )

    if request.method == "POST":
        name = request.data.get("name")
        mapping = request.data.get("mapping", {})
        if not name:
            return Response({"detail": "Template name required."}, status=status.HTTP_400_BAD_REQUEST)
        template, _ = MappingTemplate.objects.update_or_create(
            user=request.user,
            project=_project(request),
            name=name,
            defaults={"mapping": mapping},
        )
        return Response({"id": str(template.id), "name": template.name, "mapping": template.mapping})

    if request.method == "DELETE":
        try:
            template = MappingTemplate.objects.get(
                id=template_id, user=request.user, **project_scope_filter(request)
            )
        except (MappingTemplate.DoesNotExist, ValueError):
            return Response({"detail": "Template not found."}, status=status.HTTP_404_NOT_FOUND)
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- #
# Export
# --------------------------------------------------------------------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def export_data(request):
    """Export transactions (and other datasets) in the requested format."""
    fmt = (request.data.get("format") or "csv").lower()
    dataset = request.data.get("dataset", "transactions")
    filters = request.data.get("filters", {}) or {}
    title = request.data.get("title", f"WealthWise {dataset.title()}")

    queryset = Transaction.objects.filter(
        user=request.user, **project_scope_filter(request)
    ).select_related("category", "account")

    start_date = filters.get("start_date")
    end_date = filters.get("end_date")
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
    if filters.get("type"):
        queryset = queryset.filter(type=filters["type"])
    if filters.get("category"):
        queryset = queryset.filter(category__name=filters["category"])

    columns = ["date", "description", "category", "type", "amount", "status", "account"]
    records = [
        {
            "date": t.date.isoformat(),
            "description": t.description,
            "category": t.category.name if t.category else "",
            "type": t.type,
            "amount": float(t.amount),
            "status": t.status,
            "account": t.account_name or "",
        }
        for t in queryset.order_by("-date")
    ]

    try:
        body, content_type, ext = ExportService.render(fmt, title, columns, records)
    except ParseError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    job = ExportJob.objects.create(
        user=request.user,
        project=_project(request),
        dataset=dataset,
        format=fmt,
        row_count=len(records),
        status="completed",
    )

    response = HttpResponse(body, content_type=content_type)
    response["Content-Disposition"] = f'attachment; filename="{dataset}_{job.id}.{ext}"'
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_history(request):
    jobs = ExportJob.objects.filter(user=request.user, **project_scope_filter(request)).order_by("-created_at")[:50]
    return Response(
        [
            {
                "id": str(j.id),
                "dataset": j.dataset,
                "format": j.format,
                "row_count": j.row_count,
                "status": j.status,
                "created_at": j.created_at,
            }
            for j in jobs
        ]
    )
