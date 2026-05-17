from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['service_order', 'amount', 'method', 'stage', 'received_by', 'paid_at']
    list_filter = ['method', 'stage', 'paid_at']
    search_fields = ['service_order__folio', 'service_order__client__name']
    readonly_fields = ['paid_at']
