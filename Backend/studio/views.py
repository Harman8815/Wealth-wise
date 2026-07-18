"""
Studio views — a modern, staff-only management UI over the existing ORM models.

Everything here is server-rendered with Django templates + HTMX. It reads and
writes models directly (no DRF coupling). All views are staff-gated.
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.decorators import login_required
from django.db.models import Q, Sum, Count
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST

from .registry import REGISTRY, grouped_registry, get_entry
from .forms import make_model_form, get_field_choices
from api.models import Project, Transaction, Category, Account


def _require_staff(view):
    """Decorator: login required + is_staff required."""
    return login_required(staff_member_required(view, login_url='admin:login'))


def _resolve_scope(request):
    """Read the active project scope from the session ('' => all projects)."""
    pid = request.session.get('studio_project', '')
    if pid:
        return Project.objects.filter(id=pid).first()
    return None


def _apply_scope(request, qs):
    """Filter a queryset by the active project scope when the model has `project`."""
    project = _resolve_scope(request)
    if project is None:
        return qs
    if 'project' in [f.name for f in qs.model._meta.fields]:
        return qs.filter(project=project)
    return qs


def _build_filters(request, entry):
    """Build Q-objects + exact filters from request.GET using the registry."""
    model = entry['model']
    search = request.GET.get('q', '').strip()
    filters = Q()
    exact = {}

    if search and entry['search_fields']:
        q = Q()
        for f in entry['search_fields']:
            q |= Q(**{f'{f}__icontains': search})
        filters &= q

    for fname, widget in entry['filter_fields'].items():
        val = request.GET.get(fname, '').strip()
        if not val:
            continue
        field = model._meta.get_field(fname)
        if widget == 'fk':
            exact[fname] = val
        elif widget == 'boolean':
            exact[fname] = (val == 'true')
        elif widget == 'choice':
            exact[fname] = val
        else:
            exact[fname] = val

    return filters, exact, search


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@_require_staff
def dashboard(request):
    project = _resolve_scope(request)
    scope_qs = lambda m: _apply_scope(request, m.objects.all())

    total_accounts = scope_qs(Account).count()
    total_transactions = scope_qs(Transaction).count()

    sums = scope_qs(Transaction).aggregate(
        income=Sum('amount', filter=Q(type='income')),
        expense=Sum('amount', filter=Q(type='expense')),
    )
    income = float(sums['income'] or 0)
    expense = float(sums['expense'] or 0)

    active_goals = scope_qs(_registry_model('goals')).filter(status='active').count()
    open_alerts = scope_qs(_registry_model('alerts')).filter(read=False).count()

    # Last 6 months income vs expense (global-ish, scoped to project).
    from django.db.models.functions import TruncMonth
    monthly = list(
        scope_qs(Transaction)
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(income=Sum('amount', filter=Q(type='income')),
                  expense=Sum('amount', filter=Q(type='expense')))
        .order_by('month')
    )
    monthly = monthly[-6:]

    max_val = max(
        [float(m['income'] or 0) for m in monthly] +
        [float(m['expense'] or 0) for m in monthly] + [1]
    )
    SCALE = 160.0
    for m in monthly:
        m['income_h'] = int((float(m['income'] or 0) / max_val) * SCALE) or 1
        m['expense_h'] = int((float(m['expense'] or 0) / max_val) * SCALE) or 1

    top_categories = list(
        scope_qs(Transaction).filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')[:6]
    )

    kpis = [
        ('Total Accounts', total_accounts, 'wallet'),
        ('Transactions', total_transactions, 'receipt'),
        ('Income', f"₹{income:,.0f}", 'trending-up'),
        ('Expense', f"₹{expense:,.0f}", 'trending-down'),
        ('Active Goals', active_goals, 'target'),
        ('Open Alerts', open_alerts, 'bell'),
    ]

    context = {
        'kpis': kpis,
        'monthly': monthly,
        'monthly_max': max_val,
        'top_categories': top_categories,
        'groups': grouped_registry(),
        'active_project': project,
        'projects': Project.objects.all().order_by('name'),
        'quick_add': True,
    }
    return render(request, 'studio/dashboard.html', context)


def _count_all(model):
    return model.objects.count()


def _registry_model(slug):
    return get_entry(slug)['model']


# ---------------------------------------------------------------------------
# Table list + CRUD
# ---------------------------------------------------------------------------
@_require_staff
def table_list(request, slug):
    entry = get_entry(slug)
    if entry is None:
        return HttpResponse('Unknown table', status=404)

    model = entry['model']
    filters, exact, search = _build_filters(request, entry)
    qs = _apply_scope(request, model.objects.all())
    if filters:
        qs = qs.filter(filters)
    if exact:
        qs = qs.filter(**exact)

    # Order by a sensible column if present.
    order_field = None
    for cand in ('created_at', 'date', 'timestamp', 'scheduled_date', 'name', 'title', 'email'):
        if cand in [f.name for f in model._meta.fields]:
            order_field = cand
            break
    if order_field:
        qs = qs.order_by(f'-{order_field}' if order_field in ('created_at', 'date', 'timestamp', 'scheduled_date') else order_field)

    paginator = Paginator(qs, 25)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # Build active filter choices for the filter bar.
    filter_choices = {
        fname: get_field_choices(model, fname)
        for fname in entry['filter_fields']
    }

    context = {
        'entry': entry,
        'slug': slug,
        'model': model,
        'page_obj': page_obj,
        'search': search,
        'filter_choices': filter_choices,
        'active_filters': {k: v for k, v in request.GET.items() if k in entry['filter_fields'] and v},
        'groups': grouped_registry(),
        'active_project': _resolve_scope(request),
        'projects': Project.objects.all().order_by('name'),
    }

    if request.headers.get('HX-Request'):
        return render(request, 'studio/partials/_table.html', context)
    return render(request, 'studio/list.html', context)


@_require_staff
def record_create(request, slug):
    entry = get_entry(slug)
    if entry is None:
        return HttpResponse('Unknown table', status=404)
    FormClass = make_model_form(slug)
    if request.method == 'POST':
        form = FormClass(request.POST)
        if form.is_valid():
            obj = form.save()
            if request.headers.get('HX-Request'):
                return HttpResponse(
                    f'<script>window.location.href="{reverse("studio:table", args=[slug])}";</script>'
                )
            return redirect('studio:table', slug=slug)
    else:
        form = FormClass()
    context = {'form': form, 'slug': slug, 'entry': entry, 'mode': 'create',
               'title': f'New {entry["label"].rstrip("s")}'}
    if request.headers.get('HX-Request'):
        return render(request, 'studio/partials/_form.html', context)
    return render(request, 'studio/form.html', context)


@_require_staff
def record_edit(request, slug, pk):
    entry = get_entry(slug)
    if entry is None:
        return HttpResponse('Unknown table', status=404)
    model = entry['model']
    obj = get_object_or_404(model, pk=pk)
    FormClass = make_model_form(slug, for_edit=True)
    if request.method == 'POST':
        form = FormClass(request.POST, instance=obj)
        if form.is_valid():
            form.save()
            if request.headers.get('HX-Request'):
                return HttpResponse(
                    f'<script>window.location.href="{reverse("studio:table", args=[slug])}";</script>'
                )
            return redirect('studio:table', slug=slug)
    else:
        form = FormClass(instance=obj)
    context = {'form': form, 'slug': slug, 'entry': entry, 'mode': 'edit',
               'title': f'Edit {entry["label"].rstrip("s")}', 'object': obj}
    if request.headers.get('HX-Request'):
        return render(request, 'studio/partials/_form.html', context)
    return render(request, 'studio/form.html', context)


@_require_staff
@require_POST
def record_delete(request, slug, pk):
    entry = get_entry(slug)
    if entry is None:
        return HttpResponse('Unknown table', status=404)
    model = entry['model']
    obj = get_object_or_404(model, pk=pk)
    obj.delete()
    if request.headers.get('HX-Request'):
        # Re-render the table after deletion.
        return table_list(request, slug)
    return redirect('studio:table', slug=slug)


@_require_staff
def record_confirm_delete(request, slug, pk):
    entry = get_entry(slug)
    if entry is None:
        return HttpResponse('Unknown table', status=404)
    model = entry['model']
    obj = get_object_or_404(model, pk=pk)
    context = {'slug': slug, 'pk': pk, 'entry': entry, 'object': obj}
    return render(request, 'studio/partials/_confirm_delete.html', context)


# ---------------------------------------------------------------------------
# Project scope selector
# ---------------------------------------------------------------------------
@_require_staff
@require_POST
def set_scope(request):
    pid = request.POST.get('project', '')
    if pid:
        request.session['studio_project'] = pid
    else:
        request.session['studio_project'] = ''
    next_url = request.POST.get('next') or reverse('studio:dashboard')
    return redirect(next_url)


# ---------------------------------------------------------------------------
# Quick add transaction
# ---------------------------------------------------------------------------
@_require_staff
def quick_add_transaction(request):
    project = _resolve_scope(request)
    if request.method == 'POST':
        data = request.POST.copy()
        # Resolve category by name if provided.
        cat_name = data.get('category_name', '').strip()
        if cat_name:
            cat = Category.objects.filter(name__iexact=cat_name).first()
            if cat:
                data['category'] = cat.pk
        if project:
            data['project'] = project.pk
        # user is required on Transaction; default to the requesting staff user.
        data['user'] = request.user.pk
        FormClass = make_model_form('transactions')
        form = FormClass(data)
        if form.is_valid():
            form.save()
            if request.headers.get('HX-Request'):
                return JsonResponse({'ok': True})
            return redirect('studio:dashboard')
        if request.headers.get('HX-Request'):
            return JsonResponse({'ok': False, 'errors': form.errors}, status=400)
    else:
        FormClass = make_model_form('transactions')
        form = FormClass()
    context = {
        'form': form,
        'categories': Category.objects.all().order_by('name'),
        'accounts': Account.objects.all().order_by('name'),
        'groups': grouped_registry(),
        'active_project': project,
        'projects': Project.objects.all().order_by('name'),
    }
    if request.headers.get('HX-Request'):
        return render(request, 'studio/partials/_quick_add.html', context)
    return render(request, 'studio/quick_add.html', context)
