from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import AuditLog, log_action

User = get_user_model()


class AuditLoggingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='auditadmin', password='Password123', role='admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_log_action_and_api(self):
        log_action(
            user=self.user,
            action_type='CREATE_STUDENT',
            target_model='SchoolStudent',
            target_id='101',
            details='Created Rahul Sharma'
        )

        response = self.client.get('/api/audit/logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) >= 1)
        self.assertEqual(response.data['results'][0]['action_type'], 'CREATE_STUDENT')
