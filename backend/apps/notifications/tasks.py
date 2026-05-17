from celery import shared_task
import requests
from decouple import config
import logging

logger = logging.getLogger(__name__)

EVENT_MESSAGES = {
    'pickup_scheduled': 'Tu recolección de tapetes ha sido agendada.',
    'picked_up': 'Tus tapetes están en camino al RugSpa.',
    'received_at_spa': 'Hemos recibido tus tapetes en el RugSpa.',
    'ready': '¡Tus tapetes están listos para entrega!',
    'delivered': 'Entrega completada. ¡Gracias por preferirnos!',
}


@shared_task(bind=True, max_retries=3)
def send_status_notification(self, order_id, event_type):
    if event_type not in EVENT_MESSAGES:
        return

    from apps.orders.models import ServiceOrder
    from apps.notifications.models import NotificationLog

    try:
        order = ServiceOrder.objects.select_related('client').get(pk=order_id)
    except ServiceOrder.DoesNotExist:
        return

    ghl_webhook_url = config('GHL_WEBHOOK_URL', default='')
    if not ghl_webhook_url:
        logger.warning('GHL_WEBHOOK_URL not configured, skipping WhatsApp notification')
        return

    payload = {
        'contact_phone': order.client.phone,
        'event': event_type,
        'order_folio': order.folio,
        'client_name': order.client.name,
        'message': EVENT_MESSAGES[event_type],
    }

    log = NotificationLog(
        service_order=order,
        event_type=event_type,
        message_preview=EVENT_MESSAGES[event_type],
    )

    try:
        response = requests.post(ghl_webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        log.status = 'sent'
        log.save()
    except Exception as exc:
        log.status = 'failed'
        log.error_message = str(exc)
        log.save()
        raise self.retry(exc=exc, countdown=60)
