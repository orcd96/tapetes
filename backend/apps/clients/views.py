from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client, ClientAddress
from .serializers import ClientSerializer, ClientAddressSerializer
from apps.orders.serializers import ServiceOrderSerializer
from apps.orders.models import ServiceOrder


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'phone', 'email']

    def get_queryset(self):
        return Client.objects.prefetch_related('addresses').all()


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.prefetch_related('addresses').all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]


class ClientOrdersView(generics.ListAPIView):
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ServiceOrder.objects.filter(client_id=self.kwargs['pk'])


class ClientAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ClientAddress.objects.filter(client_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(client_id=self.kwargs['pk'])


class ClientAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientAddressSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'addr_pk'

    def get_queryset(self):
        return ClientAddress.objects.filter(client_id=self.kwargs['pk'])
