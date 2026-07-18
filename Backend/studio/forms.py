"""
Generic, Tailwind-styled form generation for the Studio.

We never hand-write 25 ModelForms. Instead `make_model_form` introspects the
registry entry for a model and builds a ModelForm with the right fields and
widget styling. Auto/audit/JSON fields are excluded based on the registry.
"""
from django import forms
from django.db import models
from django.db.models import JSONField, BooleanField, DateField, ForeignKey, CharField

from .registry import get_entry, GLOBAL_FIELD_BLACKLIST, JSON_BLACKLIST


class TailwindModelForm(forms.ModelForm):
    """Base ModelForm that renders every widget with Tailwind classes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            self._style_field(name, field)

    def _style_field(self, name, field):
        base = (
            'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm '
            'text-slate-900 shadow-sm transition focus:border-wealth-500 '
            'focus:outline-none focus:ring-2 focus:ring-wealth-500/30 '
            'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
        )
        widget = field.widget
        if isinstance(widget, (forms.CheckboxInput,)):
            widget.attrs.update({'class': 'h-4 w-4 rounded border-slate-300 text-wealth-600 focus:ring-wealth-500'})
            return
        if isinstance(widget, (forms.Select,)):
            widget.attrs.update({'class': base})
            return
        if isinstance(widget, (forms.Textarea,)):
            widget.attrs.update({'class': base + ' min-h-[80px]', 'rows': 3})
            return
        if isinstance(widget, (forms.DateInput,)):
            widget.attrs.update({'class': base, 'type': 'date'})
            return
        widget.attrs.update({'class': base})


def _editable_fields(model, entry, for_edit=False):
    """Return the list of field names to include in the form."""
    json_blacklist = entry.get('json_blacklist', set())
    readonly = entry.get('readonly', set())
    fields = []
    for field in model._meta.fields:
        fname = field.name
        if fname in GLOBAL_FIELD_BLACKLIST:
            continue
        if isinstance(field, JSONField) and fname in json_blacklist:
            continue
        if model.__name__ in readonly and fname in (
            'id', 'created_at', 'updated_at', 'last_login'
        ):
            continue
        if isinstance(field, models.AutoField):
            continue
        fields.append(fname)
    return fields


def make_model_form(slug, for_edit=False):
    """Return a ModelForm subclass for the model referenced by `slug`."""
    entry = get_entry(slug)
    if entry is None:
        raise ValueError(f"Unknown studio slug: {slug}")
    model = entry['model']
    field_names = _editable_fields(model, entry, for_edit)

    meta_attrs = {
        'model': model,
        'fields': field_names,
        'widgets': {},
    }

    # Nicer widgets: textarea for long text, date picker for dates, select for FK.
    for fname in field_names:
        field = model._meta.get_field(fname)
        if isinstance(field, models.TextField):
            meta_attrs['widgets'][fname] = forms.Textarea()
        elif isinstance(field, DateField):
            meta_attrs['widgets'][fname] = forms.DateInput()
        elif isinstance(field, BooleanField):
            meta_attrs['widgets'][fname] = forms.CheckboxInput()

    form_class = type(
        f"{model.__name__}StudioForm",
        (TailwindModelForm,),
        {'Meta': type('Meta', (), meta_attrs)},
    )
    return form_class


def get_field_choices(model, fname):
    """Return (value, label) choices for a choice/ FK field, for filter widgets."""
    field = model._meta.get_field(fname)
    if field.choices:
        return [('', 'All')] + list(field.choices)
    if isinstance(field, ForeignKey):
        rel = field.related_model
        try:
            objs = rel.objects.all()[:200]
        except Exception:
            objs = []
        return [('', 'All')] + [(str(o.pk), str(o)) for o in objs]
    return [('', 'All')]
