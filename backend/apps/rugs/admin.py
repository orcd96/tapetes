from django.contrib import admin
from .models import Rug, RugPhoto


class RugPhotoInline(admin.TabularInline):
    model = RugPhoto
    extra = 0
    readonly_fields = ['uploaded_at', 'uploaded_by']


@admin.register(Rug)
class RugAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'fiber_type', 'status', 'area_m2', 'assigned_washer', 'created_at']
    list_filter = ['fiber_type', 'status']
    search_fields = ['service_order__folio', 'service_order__client__name']
    readonly_fields = ['created_at', 'updated_at', 'registered_by', 'area_m2']
    inlines = [RugPhotoInline]


@admin.register(RugPhoto)
class RugPhotoAdmin(admin.ModelAdmin):
    list_display = ['rug', 'photo_type', 'uploaded_by', 'uploaded_at']
    list_filter = ['photo_type']
    readonly_fields = ['uploaded_at']
