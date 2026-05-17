from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import NotificationLog
from .serializers import NotificationLogSerializer
from apps.users.permissions import IsAdmin


class NotificationLogListView(generics.ListAPIView):
    serializer_class = NotificationLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return NotificationLog.objects.select_related('service_order')
