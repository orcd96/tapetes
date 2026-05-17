from rest_framework import serializers
from .models import Rug, RugPhoto


class RugPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RugPhoto
        fields = ['id', 'photo_type', 'file', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['uploaded_at', 'uploaded_by']


class RugSerializer(serializers.ModelSerializer):
    photos = RugPhotoSerializer(many=True, read_only=True)
    area_m2 = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    total = serializers.DecimalField(
        max_digits=10, decimal_places=2, source='get_total', read_only=True
    )
    fiber_type_display = serializers.CharField(source='get_fiber_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_washer_name = serializers.SerializerMethodField()

    def get_assigned_washer_name(self, obj):
        if obj.assigned_washer:
            return obj.assigned_washer.get_full_name() or obj.assigned_washer.username
        return None

    class Meta:
        model = Rug
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'registered_by', 'service_order', 'index']

    def create(self, validated_data):
        validated_data['registered_by'] = self.context['request'].user
        return super().create(validated_data)


class RugStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rug
        fields = ['status', 'assigned_washer']
