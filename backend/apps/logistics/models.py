from django.db import models


class Pickup(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Camino'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    service_order = models.OneToOneField(
        'orders.ServiceOrder', on_delete=models.CASCADE, related_name='pickup'
    )
    scheduled_at = models.DateTimeField()
    driver = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pickups'
    )
    actual_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Recolección'
        verbose_name_plural = 'Recolecciones'

    def __str__(self):
        return f"Pickup {self.service_order.folio}"


class Delivery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Camino'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    service_order = models.OneToOneField(
        'orders.ServiceOrder', on_delete=models.CASCADE, related_name='delivery'
    )
    scheduled_at = models.DateTimeField()
    driver = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='deliveries'
    )
    actual_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Entrega'
        verbose_name_plural = 'Entregas'

    def __str__(self):
        return f"Delivery {self.service_order.folio}"
