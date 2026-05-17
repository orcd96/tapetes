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


class ClientAddress(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=100, blank=True, help_text='Ej: Casa, Oficina, Bodega')
    address = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', 'label']
        verbose_name = 'Domicilio'
        verbose_name_plural = 'Domicilios'

    def save(self, *args, **kwargs):
        if self.is_default:
            ClientAddress.objects.filter(
                client=self.client, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        label = self.label or 'Domicilio'
        return f"{label} — {self.client.name}"
