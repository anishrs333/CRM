from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.students.models import Student, Course, HiringCompany
from .models import (
    LearningPath, LearningLevel, LearningModule, LearningContent,
    LearningAssessment, StudentAssessmentResult, LiveClass, JobOpportunity, JobApplication
)

User = get_user_model()


class LearningPlatformTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='teacher1', password='Password123', role='admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(title='Full Stack Development', code='FSD-101', duration_days=90)
        self.student = Student.objects.create(
            enrollment_id='STD-TEST-001',
            first_name='Anish',
            last_name='Kumar',
            email='anish.test@example.com',
            phone='9876543210',
            status='in_training'
        )
        self.company = HiringCompany.objects.create(name='TechCorp Solutions', company_tier='Tier-1')

    def test_learning_path_creation_and_api(self):
        path_obj = LearningPath.objects.create(
            title='Python Full Stack Path',
            code='PY-FS-01',
            category='Backend Development'
        )
        level = LearningLevel.objects.create(learning_path=path_obj, level_number=1, title='Basics')
        module = LearningModule.objects.create(level=level, title='Django Fundamentals', order=1)
        LearningContent.objects.create(module=module, title='Intro to Django ORM', content_type='video', duration_minutes=45)

        response = self.client.get('/api/learning/paths/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) >= 1)

    def test_student_performance_aggregation(self):
        assessment = LearningAssessment.objects.create(title='Django Quiz 1', max_score=Decimal('100.00'), passing_score=Decimal('60.00'))
        StudentAssessmentResult.objects.create(
            student=self.student,
            assessment=assessment,
            score_obtained=Decimal('85.00')
        )

        response = self.client.get(f'/api/learning/performance/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['average_assessment_score'], 85.0)

    def test_live_classes_and_jobs(self):
        live_class = LiveClass.objects.create(
            title='Django Architecture Workshop',
            course=self.course,
            faculty=self.user,
            class_date='2026-10-10',
            start_time='10:00:00',
            end_time='12:00:00',
            mode='online'
        )
        res_class = self.client.get('/api/learning/live-classes/')
        self.assertEqual(res_class.status_code, status.HTTP_200_OK)

        job = JobOpportunity.objects.create(title='Software Engineer Trainee', company=self.company, ctc_or_stipend='6 LPA')
        app = JobApplication.objects.create(job=job, student=self.student, status='applied')
        res_app = self.client.get('/api/learning/applications/')
        self.assertEqual(res_app.status_code, status.HTTP_200_OK)
