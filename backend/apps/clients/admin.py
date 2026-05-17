from django.contrib import admin
from .models import Client, ClientAddress


class ClientAddressInline(admin.TabularInline):
    model = ClientAddress
    extra = 0
    fields = ['label', 'address', 'is_default']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'created_at', 'created_by']
    search_fields = ['name', 'phone', 'email']
    list_filter = ['created_at']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    inlines = [ClientAddressInline]


@admin.register(ClientAddress)
class ClientAddressAdmin(admin.ModelAdmin):
    list_display = ['client', 'label', 'is_default', 'created_at']
    list_filter = ['is_default']
    search_fields = ['client__name', 'address', 'label']
