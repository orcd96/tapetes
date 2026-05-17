from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NotificationLog
from .serializers import NotificationLogSerializer
from apps.users.permissions import IsAdmin

WHATSAPP_TEMPLATES = {
    'pickup_scheduled': (
        "Hola {client_name} 👋\n\n"
        "Te confirmamos que tu recolección de tapetes ha sido agendada.\n"
        "📋 Folio: *{folio}*\n\n"
        "Pronto te enviamos la hora exacta de llegada.\n\n"
        "¡Gracias por confiar en *Rug Spa*! 🏠✨"
    ),
    'picked_up': (
        "Hola {client_name} 👋\n\n"
        "¡Tus tapetes ya están en camino a nuestro Rug Spa!\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes: *{rug_count}*\n\n"
        "Te avisamos en cuanto los recibamos. 🚚"
    ),
    'received_at_spa': (
        "Hola {client_name} ✅\n\n"
        "Recibimos tus tapetes en el Rug Spa.\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes recibidos: *{rug_count}*\n\n"
        "Comenzaremos el proceso de lavado muy pronto. Te mantenemos al tanto 😊"
    ),
    'washing': (
        "Hola {client_name} 🧼\n\n"
        "¡Tus tapetes ya están en proceso de lavado!\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes: *{rug_count}*\n\n"
        "Te avisamos cuando estén listos para entrega. ⏳"
    ),
    'ready': (
        "Hola {client_name} 🎉\n\n"
        "¡Tus tapetes están *listos*!\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes: *{rug_count}*\n"
        "💰 Total: *{total}*\n\n"
        "¿Cuándo prefieres que te los entreguemos? 🚚"
    ),
    'delivery_scheduled': (
        "Hola {client_name} 🚚\n\n"
        "Tu entrega ha sido agendada.\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes: *{rug_count}*\n\n"
        "Nuestro chofer estará contigo pronto. ¡Prepárate! 😊"
    ),
    'delivered': (
        "Hola {client_name} 🌟\n\n"
        "¡Entrega completada exitosamente!\n"
        "📋 Folio: *{folio}*\n"
        "🧺 Tapetes entregados: *{rug_count}*\n\n"
        "Gracias por confiar en *Rug Spa*. ¡Hasta la próxima! 🏠✨"
    ),
}


class NotificationLogListView(generics.ListAPIView):
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return NotificationLog.objects.select_related('service_order')


class WhatsAppMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        order_id = request.query_params.get('order_id')
        event = request.query_params.get('event')

        if not order_id or not event:
            return Response(
                {'error': 'Se requieren order_id y event'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event not in WHATSAPP_TEMPLATES:
            return Response(
                {'error': f'Evento desconocido: {event}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.orders.models import ServiceOrder
        try:
            order = ServiceOrder.objects.select_related('client').prefetch_related('rugs').get(pk=order_id)
        except ServiceOrder.DoesNotExist:
            return Response({'error': 'Orden no encontrada'}, status=status.HTTP_404_NOT_FOUND)

        rug_count = order.rugs.count()
        total_fmt = f"${order.total_amount:,.2f}" if order.total_amount else "$0.00"

        message = WHATSAPP_TEMPLATES[event].format(
            client_name=order.client.name.split()[0],
            folio=order.folio,
            rug_count=rug_count,
            total=total_fmt,
        )

        return Response({
            'message': message,
            'event': event,
            'folio': order.folio,
            'client_phone': order.client.phone,
        })
