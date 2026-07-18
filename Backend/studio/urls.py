from django.urls import path
from . import views

app_name = 'studio'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('tables/', views.dashboard, name='tables'),
    path('table/<slug:slug>/', views.table_list, name='table'),
    path('table/<slug:slug>/new/', views.record_create, name='create'),
    path('table/<slug:slug>/<uuid:pk>/edit/', views.record_edit, name='edit'),
    path('table/<slug:slug>/<uuid:pk>/delete/', views.record_delete, name='delete'),
    path('table/<slug:slug>/<uuid:pk>/confirm-delete/', views.record_confirm_delete, name='confirm_delete'),
    path('set-scope/', views.set_scope, name='set_scope'),
    path('quick-add-transaction/', views.quick_add_transaction, name='quick_add'),
]
