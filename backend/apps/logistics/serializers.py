from rest_framework import serializers
from .models import Pickup, Delivery


class PickupSerializer(serializers.ModelSerializer):
    order_folio = serializers.CharField(source='service_order.folio', read_only=True)
    client_name = serializers.CharField(source='service_order.client.name', read_only=True)
    client_phone = serializers.CharField(source='service_order.client.phone', read_only=True)
    pickup_address = serializers.CharField(source='service_order.pickup_address', read_only=True)

    class Meta:
        model = Pickup
        fields = '__all__'


class DeliverySerializer(serializers.ModelSerializer):
    order_folio = serializers.CharField(source='service_order.folio', read_only=True)
    client_name = serializers.CharField(source='service_order.client.name', read_only=True)
    client_phone = serializers.CharField(source='service_order.client.phone', read_only=True)
    delivery_address = serializers.CharField(
        source='service_order.delivery_address', read_only=True
    )
    rug_count = serializers.IntegerField(source='service_order.rugs.count', read_only=True)

    class Meta:
        model = Delivery
        fields = '__all__'
