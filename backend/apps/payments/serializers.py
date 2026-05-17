from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.SerializerMethodField()
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name() or obj.received_by.username
        return None

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['paid_at', 'received_by']

    def create(self, validated_data):
        validated_data['received_by'] = self.context['request'].user
        return super().create(validated_data)
