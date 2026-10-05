from datetime import date, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.students.models import Course, Student, StudentEnrollment, StudentPayment, PlacementRecord, HiringCompany, Certificate

User = get_user_model()


class EdTechInstituteModelTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin_test', password='password123', is_staff=True, role='admin')
        self.client.force_authenticate(user=self.user)

        self.course = Course.objects.create(
            title='MERN Full Stack Development',
            code='MERN-90-TEST',
            duration_days=90,
            fee_amount=Decimal('50000.00'),
            category='Software Engineering'
        )

        self.student = Student.objects.create(
            enrollment_id='STD-TEST-001',
            first_name='Arun',
            last_name='Kumar',
            email='arun.test@gmail.com',
            phone='+91 98765 43210',
            qualification='B.Tech IT',
            status='in_training'
        )

        self.enrollment = StudentEnrollment.objects.create(
            student=self.student,
            course=self.course,
            start_date=date.today(),
            duration_days=90,
            total_fee=self.course.fee_amount
        )

        self.company = HiringCompany.objects.create(
            name='Zoho Test Corp',
            company_tier='Unicorn',
            location='Chennai'
        )

    def test_student_enrollment_duration_calculations(self):
        self.assertEqual(self.enrollment.total_duration_days, 90)
        self.assertFalse(self.enrollment.is_duration_completed)
        self.assertEqual(self.enrollment.days_elapsed, 0)
        self.assertEqual(self.enrollment.days_remaining, 90)
        self.assertEqual(self.enrollment.progress_percentage, 0)

    def test_extension_days(self):
        self.enrollment.extension_days = 15
        self.enrollment.save()
        self.assertEqual(self.enrollment.total_duration_days, 105)

    def test_payment_and_placement_creation(self):
        payment = StudentPayment.objects.create(
            student=self.student,
            enrollment=self.enrollment,
            receipt_number='RCPT-TEST-001',
            amount_paid=Decimal('25000.00'),
            payment_method='UPI'
        )
        self.assertEqual(payment.amount_paid, Decimal('25000.00'))

        placement = PlacementRecord.objects.create(
            student=self.student,
            company=self.company,
            company_name=self.company.name,
            job_role='Software Engineer',
            ctc_package=Decimal('7.50'),
            offer_letter_number='OFFER-TEST-99'
        )
        self.assertEqual(placement.company_name, 'Zoho Test Corp')
        self.assertEqual(placement.student.full_name, 'Arun Kumar')

    def test_student_api_creation_with_duration(self):
        data = {
            'first_name': 'Karthik',
            'last_name': 'Raja',
            'email': 'karthik.test@gmail.com',
            'phone': '+91 91234 56789',
            'qualification': 'B.E CSE',
            'course_id': self.course.id,
            'duration_days': 120
        }
        res = self.client.post('/api/students/', data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['enrollment']['total_duration_days'], 120)

    def test_extend_course_api(self):
        res = self.client.post(f'/api/students/{self.student.id}/extend_course/', {'added_days': 20, 'reason': 'Exam Revision'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['new_total_duration'], 110)

    def test_pdf_invoice_download_api(self):
        res = self.client.get(f'/api/students/{self.student.id}/pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_dashboard_stats_api(self):
        res = self.client.get('/api/students/dashboard_stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', res.data)
        self.assertIn('ongoing_count', res.data)
        self.assertIn('finishing_soon_count', res.data)

    # ==================== CERTIFICATE TESTS ====================
    def test_certificate_eligibility_and_generation(self):
        # Ineligible student (in_training) should fail certificate generation
        res_ineligible = self.client.post('/api/certificates/generate/', {'student_id': self.student.id}, format='json')
        self.assertEqual(res_ineligible.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not eligible', res_ineligible.data['error'])

        # Mark student as completed -> now eligible!
        self.student.status = 'completed'
        self.student.save()
        self.enrollment.status = 'completed'
        self.enrollment.completion_date = date.today()
        self.enrollment.save()

        res_eligible = self.client.post('/api/certificates/generate/', {'student_id': self.student.id}, format='json')
        self.assertEqual(res_eligible.status_code, status.HTTP_201_CREATED)
        cert_data = res_eligible.data['certificate']
        self.assertTrue(cert_data['certificate_id'].startswith('CERT-2026-'))
        self.assertEqual(cert_data['status'], 'active')

        # Test Duplicate generation -> Returns existing certificate
        res_dup = self.client.post('/api/certificates/generate/', {'student_id': self.student.id}, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_200_OK)
        self.assertEqual(res_dup.data['certificate']['certificate_id'], cert_data['certificate_id'])

    def test_certificate_pdf_download_api(self):
        cert = Certificate.objects.create(
            certificate_id='CERT-2026-TEST-100',
            student=self.student,
            course=self.course,
            enrollment=self.enrollment,
            status='active'
        )
        res = self.client.get(f'/api/certificates/{cert.id}/pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_certificate_revocation_and_verification(self):
        cert = Certificate.objects.create(
            certificate_id='CERT-2026-TEST-200',
            student=self.student,
            course=self.course,
            enrollment=self.enrollment,
            status='active'
        )

        # Public verification -> Active
        self.client.force_authenticate(user=None)
        res_verify_active = self.client.get('/api/certificates/verify/', {'certificate_id': 'CERT-2026-TEST-200'})
        self.assertEqual(res_verify_active.status_code, status.HTTP_200_OK)
        self.assertTrue(res_verify_active.data['valid'])
        self.assertEqual(res_verify_active.data['student_name'], 'Arun Kumar')

        # Admin revokes certificate
        self.client.force_authenticate(user=self.user)
        res_revoke = self.client.post(f'/api/certificates/{cert.id}/revoke/', {'reason': 'Misconduct'}, format='json')
        self.assertEqual(res_revoke.status_code, status.HTTP_200_OK)
        self.assertEqual(res_revoke.data['certificate']['status'], 'revoked')

        # Public verification -> Revoked
        self.client.force_authenticate(user=None)
        res_verify_revoked = self.client.get('/api/certificates/verify/', {'certificate_id': 'CERT-2026-TEST-200'})
        self.assertEqual(res_verify_revoked.status_code, status.HTTP_200_OK)
        self.assertFalse(res_verify_revoked.data['valid'])
        self.assertEqual(res_verify_revoked.data['status'], 'Revoked')

        # Public verification -> Invalid ID
        res_verify_invalid = self.client.get('/api/certificates/verify/', {'certificate_id': 'INVALID-ID-999'})
        self.assertEqual(res_verify_invalid.status_code, status.HTTP_200_OK)
        self.assertFalse(res_verify_invalid.data['valid'])
        self.assertEqual(res_verify_invalid.data['status'], 'Not Found')
