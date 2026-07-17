"""
Reports API views for WealthWise.
Handles exports and filtering for reports page.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import ScheduledReport
from ..serializers import ScheduledReportSerializer
from ..base import project_scope_filter
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_reports_pdf(request):
    """Export reports summary as PDF."""
    user = request.user
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    queryset = Transaction.objects.filter(user=user, **project_scope_filter(request))

    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    monthly_data = queryset.annotate(
        income=Sum('amount', filter=Q(type='income')),
        expense=Sum('amount', filter=Q(type='expense'))
    ).order_by('month')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("WealthWise Reports", styles['Title']))
    elements.append(Paragraph(f"Generated on {timezone.now().strftime('%Y-%m-%d')}", styles['Normal']))
    elements.append(Paragraph("<br/>", styles['Normal']))

    data = [['Month', 'Income', 'Expense', 'Net']]
    for item in monthly_data:
        month_str = item['month'].strftime('%Y-%m') if item['month'] else 'N/A'
        income = float(item['income'] or 0)
        expense = float(item['expense'] or 0)
        data.append([
            month_str,
            f"₹{income:,.2f}",
            f"₹{expense:,.2f}",
            f"₹{income - expense:,.2f}",
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))

    elements.append(table)
    doc.build(elements)
    buffer.seek(0)

    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="reports.pdf"'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def filter_reports(request):
    """Filter reports data based on criteria."""
    user = request.user
    data = request.data
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    categories = data.get('categories', [])
    time_view = data.get('time_view', 'monthly')

    queryset = Transaction.objects.filter(user=user, **project_scope_filter(request))

    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
    if categories:
        queryset = queryset.filter(category__name__in=categories)

    monthly_stats = queryset.annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
        income=Sum('amount', filter=Q(type='income')),
        expense=Sum('amount', filter=Q(type='expense'))
    ).order_by('month')

    by_category = queryset.filter(type='expense').values('category__name').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')

    summary = queryset.aggregate(
        total_income=Sum('amount', filter=Q(type='income')),
        total_expense=Sum('amount', filter=Q(type='expense')),
    )

    return Response({
        'monthly_stats': list(monthly_stats),
        'by_category': list(by_category),
        'summary': {
            'income': float(summary['total_income'] or 0),
            'expense': float(summary['total_expense'] or 0),
            'net': float((summary['total_income'] or 0) - (summary['total_expense'] or 0)),
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def scheduled_reports(request):
    """List or create scheduled reports for the authenticated user."""
    if request.method == 'GET':
        reports = ScheduledReport.objects.filter(user=request.user, **project_scope_filter(request)).order_by('-created_at')
        serializer = ScheduledReportSerializer(reports, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = ScheduledReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, project=getattr(request, 'active_project', None))
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def scheduled_report_detail(request, id):
    """Retrieve, update, or delete a scheduled report."""
    try:
        report = ScheduledReport.objects.get(id=id, user=request.user, **project_scope_filter(request))
    except ScheduledReport.DoesNotExist:
        return Response({'detail': 'Scheduled report not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ScheduledReportSerializer(report)
        return Response(serializer.data)

    if request.method == 'PATCH':
        serializer = ScheduledReportSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    if request.method == 'DELETE':
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_scheduled_report(request, id):
    """Trigger a scheduled report generation and return the PDF."""
    try:
        report = ScheduledReport.objects.get(id=id, user=request.user, **project_scope_filter(request))
    except ScheduledReport.DoesNotExist:
        return Response({'detail': 'Scheduled report not found.'}, status=status.HTTP_404_NOT_FOUND)

    from ..models import generate_report_pdf
    pdf_bytes = generate_report_pdf(request.user, report.report_type, project=getattr(request, 'active_project', None))
    report.last_run = timezone.now()
    report.next_run = timezone.now() + timedelta(days=1)
    report.save(update_fields=['last_run', 'next_run'])

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{report.name.replace(" ", "_")}.pdf"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_pdf_report(request):
    """Generate a PDF report by type query parameter."""
    report_type = request.query_params.get('type', 'complete')
    user = request.user

    from ..models import generate_report_pdf
    pdf_bytes = generate_report_pdf(user, report_type, project=getattr(request, 'active_project', None))

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="report_{report_type}.pdf"'
    return response
