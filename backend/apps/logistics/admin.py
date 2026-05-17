from django.contrib import admin
from .models import Pickup, Delivery


@admin.register(Pickup)
class PickupAdmin(admin.ModelAdmin):
    list_display = ['service_order', 'driver', 'scheduled_at', 'status', 'actual_at']
    list_filter = ['status', 'scheduled_at']
    search_fields = ['service_order__folio', 'driver__username']
    readonly_fields = ['actual_at']


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['service_order', 'driver', 'scheduled_at', 'status', 'actual_at']
    list_filter = ['status', 'scheduled_at']
    search_fields = ['service_order__folio', 'driver__username']
    readonly_fields = ['actual_at']
