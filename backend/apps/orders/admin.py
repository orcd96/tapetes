from django.contrib import admin
from .models import ServiceOrder, PriceConfig, Treatment


@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    list_display = ['folio', 'client', 'status', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'origin', 'created_at']
    search_fields = ['folio', 'client__name', 'client__phone']
    readonly_fields = ['folio', 'created_at', 'updated_at', 'total_amount', 'amount_paid', 'payment_status']
    ordering = ['-created_at']


@admin.register(PriceConfig)
class PriceConfigAdmin(admin.ModelAdmin):
    list_display = ['fiber_type', 'price_per_m2', 'effective_from', 'created_at']
    list_filter = ['fiber_type']
    ordering = ['-effective_from']


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price', 'is_active']
    list_filter = ['is_active']
    prepopulated_fields = {'slug': ('name',)}
