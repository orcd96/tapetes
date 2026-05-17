from django.db import models


class Payment(models.Model):
    METHOD_CHOICES = [
        ('cash', 'Efectivo'),
        ('transfer', 'Transferencia'),
        ('card', 'Tarjeta'),
    ]
    STAGE_CHOICES = [
        ('at_scheduling', 'Al Agendar'),
        ('at_pickup', 'En Recolección'),
        ('at_spa', 'En el SPA'),
        ('at_delivery', 'En Entrega'),
    ]

    service_order = models.ForeignKey(
        'orders.ServiceOrder', on_delete=models.CASCADE, related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    paid_at = models.DateTimeField(auto_now_add=True)
    received_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-paid_at']
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'

    def __str__(self):
        return f"Pago ${self.amount} - {self.service_order.folio}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.service_order.update_totals()
