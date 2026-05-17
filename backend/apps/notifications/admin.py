from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ['service_order', 'event_type', 'status', 'sent_at']
    list_filter = ['status', 'event_type', 'sent_at']
    search_fields = ['service_order__folio']
    readonly_fields = ['sent_at']
