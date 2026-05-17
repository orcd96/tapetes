from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from .serializers import PaymentSerializer
from apps.orders.models import ServiceOrder


class OrderPaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(service_order_id=self.kwargs['order_pk'])

    def perform_create(self, serializer):
        order = ServiceOrder.objects.get(pk=self.kwargs['order_pk'])
        serializer.save(service_order=order, received_by=self.request.user)
