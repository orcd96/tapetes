from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer
from apps.orders.serializers import ServiceOrderSerializer
from apps.orders.models import ServiceOrder


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'phone', 'email']

    def get_queryset(self):
        return Client.objects.all()


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]


class ClientOrdersView(generics.ListAPIView):
    serializer_class = ServiceOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ServiceOrder.objects.filter(client_id=self.kwargs['pk'])
