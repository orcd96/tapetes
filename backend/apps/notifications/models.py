from django.db import models


class NotificationLog(models.Model):
    service_order = models.ForeignKey(
        'orders.ServiceOrder', on_delete=models.CASCADE, related_name='notifications'
    )
    event_type = models.CharField(max_length=50)
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='sent')
    message_preview = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-sent_at']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'

    def __str__(self):
        return f"{self.event_type} - {self.service_order.folio} ({self.status})"
