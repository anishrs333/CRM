from django.db.models import Q
from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        action_type = self.request.query_params.get('action_type')
        target_model = self.request.query_params.get('target_model')
        search = self.request.query_params.get('search')
        if action_type:
            qs = qs.filter(action_type=action_type)
        if target_model:
            qs = qs.filter(target_model=target_model)
        if search:
            qs = qs.filter(Q(details__icontains=search) | Q(user__username__icontains=search) | Q(action_type__icontains=search))
        return qs
