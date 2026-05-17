from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import ServiceOrder, PriceConfig, Treatment
from .serializers import (
    ServiceOrderSerializer, ServiceOrderStatusSerializer,
    PriceConfigSerializer, TreatmentSerializer, OrderTrackingSerializer,
)
from apps.users.permissions import IsAdmin, IsAdminOrAgentOrManager


class ServiceOrderListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAdminOrAgentOrManager]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['folio', 'client__name', 'client__phone']
    filterset_fields = ['status', 'payment_status', 'origin']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        qs = ServiceOrder.objects.select_related('client', 'created_by').prefetch_related('rugs')
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(created_at__date=date)
        return qs


class ServiceOrderDetailView(generics.RetrieveUpdateAPIView):
    queryset = ServiceOrder.objects.select_related('client').prefetch_related('rugs', 'payments')
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAuthenticated]


class ServiceOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = ServiceOrder.objects.get(pk=pk)
        except ServiceOrder.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceOrderStatusSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            try:
                from apps.notifications.tasks import send_status_notification
                send_status_notification.delay(order.id, order.status)
            except Exception:
                pass
            return Response(
                ServiceOrderSerializer(order, context={'request': request}).data
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderTrackingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        phone = request.query_params.get('phone', '').strip()
        name = request.query_params.get('name', '').strip()
        if not phone or not name:
            return Response(
                {'error': 'Se requieren nombre y teléfono'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        normalized_phone = phone.replace(' ', '').replace('-', '')
        first_name = name.split()[0] if name else name
        orders = ServiceOrder.objects.filter(
            client__phone__icontains=normalized_phone,
            client__name__icontains=first_name,
        ).select_related('client').prefetch_related('rugs')
        return Response(OrderTrackingSerializer(orders, many=True).data)


class PriceConfigListCreateView(generics.ListCreateAPIView):
    queryset = PriceConfig.objects.all()
    serializer_class = PriceConfigSerializer
    permission_classes = [IsAdmin]


class PriceConfigCurrentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        prices = {}
        for fiber_type, _ in PriceConfig.FIBER_TYPES:
            config = PriceConfig.objects.filter(
                fiber_type=fiber_type, effective_from__lte=today
            ).first()
            prices[fiber_type] = PriceConfigSerializer(config).data if config else None
        return Response(prices)


class TreatmentListView(generics.ListCreateAPIView):
    queryset = Treatment.objects.filter(is_active=True)
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]
