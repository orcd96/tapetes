import random
from django.db import models
from django.utils import timezone


def generate_folio():
    date_str = timezone.now().strftime('%Y%m%d')
    rand = random.randint(1000, 9999)
    return f"SPA-{date_str}-{rand}"


class PriceConfig(models.Model):
    FIBER_TYPES = [
        ('synthetic', 'Sintética'),
        ('natural', 'Natural'),
        ('mixed', 'Mixta'),
    ]
    fiber_type = models.CharField(max_length=20, choices=FIBER_TYPES)
    price_per_m2 = models.DecimalField(max_digits=8, decimal_places=2)
    effective_from = models.DateField(default=timezone.now)
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_from']
        get_latest_by = 'effective_from'
        verbose_name = 'Precio por m²'
        verbose_name_plural = 'Precios por m²'

    def __str__(self):
        return f"{self.get_fiber_type_display()} - ${self.price_per_m2}/m²"


class Treatment(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Tratamiento'
        verbose_name_plural = 'Tratamientos'

    def __str__(self):
        return self.name


class ServiceOrder(models.Model):
    STATUS_CHOICES = [
        ('pickup_scheduled', 'Recolección Agendada'),
        ('picked_up', 'Recolectado'),
        ('received_at_spa', 'Recibido en SPA'),
        ('washing', 'En Lavado'),
        ('ready', 'Listo para Entregar'),
        ('delivery_scheduled', 'Entrega Agendada'),
        ('delivered', 'Entregado'),
    ]
    PAYMENT_STATUS = [
        ('pending', 'Pendiente'),
        ('partial', 'Parcial'),
        ('paid', 'Pagado'),
    ]
    ORIGIN_CHOICES = [
        ('agent_scheduled', 'Agendado por Agente'),
        ('technician_walkin', 'Walk-in de Técnico'),
        ('direct', 'Directo'),
    ]

    folio = models.CharField(max_length=30, unique=True, default=generate_folio)
    client = models.ForeignKey(
        'clients.Client', on_delete=models.PROTECT, related_name='orders'
    )
    created_by = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        blank=True, related_name='created_orders'
    )
    origin = models.CharField(
        max_length=30, choices=ORIGIN_CHOICES, default='agent_scheduled'
    )
    pickup_address = models.TextField()
    delivery_address = models.TextField(blank=True)
    status = models.CharField(
        max_length=30, choices=STATUS_CHOICES, default='pickup_scheduled'
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='pending'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Orden de Servicio'
        verbose_name_plural = 'Órdenes de Servicio'

    def __str__(self):
        return self.folio

    def update_totals(self):
        total = sum(r.get_total() for r in self.rugs.all())
        paid = sum(p.amount for p in self.payments.all())
        self.total_amount = total
        self.amount_paid = paid
        if paid == 0:
            self.payment_status = 'pending'
        elif paid >= total:
            self.payment_status = 'paid'
        else:
            self.payment_status = 'partial'
        self.save(update_fields=['total_amount', 'amount_paid', 'payment_status'])
