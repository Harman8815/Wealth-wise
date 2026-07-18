from django import template

register = template.Library()


@register.filter
def get_item(dictionary, key):
    if dictionary is None:
        return None
    return dictionary.get(key)


@register.filter
def singularize(label):
    if label and label.endswith('s'):
        return label[:-1]
    return label


@register.filter
def display_value(obj, field):
    """Render a model field value for table display (handles FKs, choices, bools)."""
    value = getattr(obj, field, None)
    if value is None or value == '':
        return '—'
    if isinstance(value, bool):
        return '✓' if value else '—'
    return str(value)
