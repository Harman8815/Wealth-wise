"""
Reports API views for WealthWise.
Handles exports and filtering for reports page.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Transaction
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime
import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_transactions_csv(request):
    """Export transactions as CSV."""
    user = request.user
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    category = request.query_params.get('category')
    trans_type = request.query_params.get('type')

    queryset = Transaction.objects.filter(user=user).select_related('category')

    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)
    if category:
        queryset = queryset.filter(category__name=category)
    if trans_type:
        queryset = queryset.filter(type=trans_type)

    queryset = queryset.order_by('-date', '-created_at')

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['Date', 'Description', 'Category', 'Type', 'Amount', 'Status'])

    for t in queryset:
        writer.writerow([
            t.date,
            t.description,
            t.category.name if t.category else 'Uncategorized',
            t.type,
            float(t.amount),
            t.status,
        ])

    buffer.seek(0)
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_reports_pdf(request):
    """Export reports summary as PDF."""
    user = request.user
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    queryset = Transaction.objects.filter(user=user)

    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    monthly_data = queryset.annotate(
        month=TruncMonth('date')
    ).values('month').annotate(
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

    queryset = Transaction.objects.filter(user=user)

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
