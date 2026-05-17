from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLES = [
        ('admin', 'Administrador'),
        ('agent', 'Agente de Ventas'),
        ('manager', 'Encargado SPA'),
        ('driver', 'Chofer'),
        ('washer', 'Lavador'),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default='agent')
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_agent(self):
        return self.role == 'agent'

    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_driver(self):
        return self.role == 'driver'

    @property
    def is_washer(self):
        return self.role == 'washer'
