from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = '__all__'
