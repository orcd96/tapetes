from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Pickup, Delivery
from .serializers import PickupSerializer, DeliverySerializer
from apps.orders.models import ServiceOrder
from apps.users.permissions import IsDriver


class DriverRouteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        pickups = Pickup.objects.filter(
            driver=request.user,
            scheduled_at__date=today,
            status__in=['pending', 'in_progress'],
        ).select_related('service_order__client')
        deliveries = Delivery.objects.filter(
            driver=request.user,
            scheduled_at__date=today,
            status__in=['pending', 'in_progress'],
        ).select_related('service_order__client')
        return Response({
            'pickups': PickupSerializer(pickups, many=True).data,
            'deliveries': DeliverySerializer(deliveries, many=True).data,
        })


class PickupUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            pickup = Pickup.objects.get(pk=pk, driver=request.user)
        except Pickup.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status in ('in_progress', 'completed', 'failed'):
            pickup.status = new_status
            if new_status == 'completed':
                pickup.actual_at = timezone.now()
                pickup.service_order.status = 'picked_up'
                pickup.service_order.save(update_fields=['status'])
            elif new_status == 'failed':
                pickup.failure_reason = request.data.get('failure_reason', '')
            pickup.save()
        return Response(PickupSerializer(pickup).data)


class DeliveryUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            delivery = Delivery.objects.get(pk=pk, driver=request.user)
        except Delivery.DoesNotExist:
            return Response({'error': 'No encontrado'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status in ('in_progress', 'completed', 'failed'):
            delivery.status = new_status
            if new_status == 'completed':
                delivery.actual_at = timezone.now()
                delivery.service_order.status = 'delivered'
                delivery.service_order.save(update_fields=['status'])
            delivery.save()
        return Response(DeliverySerializer(delivery).data)


class PickupListCreateView(generics.ListCreateAPIView):
    serializer_class = PickupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pickup.objects.select_related('service_order__client', 'driver')


class DeliveryListCreateView(generics.ListCreateAPIView):
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Delivery.objects.select_related('service_order__client', 'driver')
