from rest_framework import serializers
from .models import Client, ClientAddress


class ClientAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientAddress
        fields = ['id', 'label', 'address', 'is_default', 'created_at']
        read_only_fields = ['created_at']


class ClientSerializer(serializers.ModelSerializer):
    addresses = ClientAddressSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
