from django.db import models


class Client(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(blank=True)
    default_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_clients',
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return f"{self.name} ({self.phone})"
