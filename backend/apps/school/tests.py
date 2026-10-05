from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    AcademicYear, SchoolClass, SchoolSection, SchoolSubject, SchoolStudent,
    SchoolStudentEnrollment, SchoolAdmission, TimetableSlot, SchoolStudentAttendance,
    ExamType, SchoolExam, SchoolFeeStructure, SchoolStudentFeeAssignment
)

User = get_user_model()


class SchoolManagementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='schooladmin', password='Password123', role='admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.academic_year = AcademicYear.objects.create(
            name='2025-2026',
            start_date='2025-06-01',
            end_date='2026-04-30',
            is_current=True
        )
        self.school_class = SchoolClass.objects.create(name='Class 10', code='CL10')
        self.section = SchoolSection.objects.create(school_class=self.school_class, name='Section A', class_teacher=self.user)
        self.subject = SchoolSubject.objects.create(name='Mathematics', code='MATH10', school_class=self.school_class, teacher=self.user)
        self.student = SchoolStudent.objects.create(
            admission_number='ADM-2026-001',
            first_name='Rahul',
            last_name='Sharma',
            gender='male',
            date_of_birth='2010-05-15'
        )
        self.enrollment = SchoolStudentEnrollment.objects.create(
            student=self.student,
            academic_year=self.academic_year,
            school_class=self.school_class,
            section=self.section,
            roll_number='1001'
        )

    def test_student_and_academics_api(self):
        response = self.client.get('/api/school/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) >= 1)

    def test_timetable_conflict_validation(self):
        TimetableSlot.objects.create(
            academic_year=self.academic_year,
            school_class=self.school_class,
            section=self.section,
            subject=self.subject,
            teacher=self.user,
            day_of_week='Monday',
            start_time='09:00:00',
            end_time='10:00:00',
            room_number='Room 101'
        )
        # Attempt conflicting slot
        payload = {
            'academic_year': self.academic_year.id,
            'school_class': self.school_class.id,
            'section': self.section.id,
            'subject': self.subject.id,
            'teacher': self.user.id,
            'day_of_week': 'Monday',
            'start_time': '09:30:00',
            'end_time': '10:30:00',
            'room_number': 'Room 101'
        }
        res = self.client.post('/api/school/timetable/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_attendance_and_fees(self):
        att_res = self.client.post('/api/school/student-attendance/bulk_mark/', {
            'attendances': [{
                'student_id': self.student.id,
                'date': '2026-10-05',
                'status': 'present',
                'academic_year': self.academic_year.id,
                'school_class': self.school_class.id,
                'section': self.section.id
            }]
        }, format='json')
        self.assertEqual(att_res.status_code, status.HTTP_200_OK)

        fee_struct = SchoolFeeStructure.objects.create(
            name='Annual Tuition Class 10',
            academic_year=self.academic_year,
            school_class=self.school_class,
            total_amount=Decimal('25000.00'),
            due_date='2026-12-31'
        )
        fee_assign = SchoolStudentFeeAssignment.objects.create(
            fee_structure=fee_struct,
            student=self.student,
            amount_due=Decimal('25000.00')
        )
        self.assertEqual(fee_assign.balance_due, Decimal('25000.00'))
