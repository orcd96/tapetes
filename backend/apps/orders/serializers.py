from rest_framework import serializers
from .models import ServiceOrder, PriceConfig, Treatment


class PriceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceConfig
        fields = '__all__'
        read_only_fields = ['created_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = '__all__'


class ServiceOrderSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True)
    rug_count = serializers.IntegerField(source='rugs.count', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(
        source='get_payment_status_display', read_only=True
    )

    class Meta:
        model = ServiceOrder
        fields = '__all__'
        read_only_fields = [
            'folio', 'created_at', 'updated_at', 'created_by',
            'total_amount', 'amount_paid', 'payment_status',
        ]

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class ServiceOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceOrder
        fields = ['status']


class OrderTrackingSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    rug_count = serializers.IntegerField(source='rugs.count', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ServiceOrder
        fields = [
            'folio', 'status', 'status_display', 'client_name',
            'rug_count', 'total_amount', 'payment_status', 'created_at',
        ]
