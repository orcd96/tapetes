import os
from decimal import Decimal
from django.db import models


class Rug(models.Model):
    FIBER_TYPES = [
        ('synthetic', 'Sintética'),
        ('natural', 'Natural'),
        ('mixed', 'Mixta'),
    ]
    STATUS_CHOICES = [
        ('received', 'Recibido'),
        ('washing', 'En Lavado'),
        ('ready', 'Listo'),
        ('delivered', 'Entregado'),
    ]

    service_order = models.ForeignKey(
        'orders.ServiceOrder', on_delete=models.CASCADE, related_name='rugs'
    )
    index = models.PositiveIntegerField(default=1)

    width_cm = models.DecimalField(max_digits=7, decimal_places=1)
    height_cm = models.DecimalField(max_digits=7, decimal_places=1)

    fiber_type = models.CharField(max_length=20, choices=FIBER_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    assigned_washer = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_rugs'
    )

    price_per_m2 = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    odor_treatment = models.BooleanField(default=False)
    odor_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    stain_protector = models.BooleanField(default=False)
    stain_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    condition_notes = models.TextField(blank=True)

    registered_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='registered_rugs'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service_order', 'index']
        verbose_name = 'Tapete'
        verbose_name_plural = 'Tapetes'

    @property
    def area_m2(self):
        return (self.width_cm * self.height_cm / Decimal('10000')).quantize(Decimal('0.01'))

    def get_total(self):
        base = self.area_m2 * self.price_per_m2
        return base + self.odor_price + self.stain_price

    def __str__(self):
        total = self.service_order.rugs.count()
        return f"Tapete {self.index}/{total} - {self.service_order.folio}"


def rug_photo_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    return f"rugs/{instance.rug.service_order.folio}/{instance.rug.id}/{instance.photo_type}{ext}"


class RugPhoto(models.Model):
    PHOTO_TYPES = [
        ('before', 'Antes'),
        ('after', 'Después'),
        ('damage', 'Daño'),
    ]
    rug = models.ForeignKey(Rug, on_delete=models.CASCADE, related_name='photos')
    photo_type = models.CharField(max_length=10, choices=PHOTO_TYPES)
    file = models.ImageField(upload_to=rug_photo_upload_path)
    uploaded_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']
        verbose_name = 'Foto de Tapete'
        verbose_name_plural = 'Fotos de Tapetes'
