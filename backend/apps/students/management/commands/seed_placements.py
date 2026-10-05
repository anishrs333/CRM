from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.students.models import Student, PlacementRecord, HiringCompany


class Command(BaseCommand):
    help = 'Seed Student Corporate Placement Records file-wise'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Placement Records File-Wise...'))

        today = date.today()

        placements_data = [
            # STD-2026-007 (Ananya Sundaram - Placed at Zoho 7.5 LPA)
            {
                'student_id': 'STD-2026-007',
                'company_name': 'Zoho Corporation',
                'job_role': 'Associate Data Scientist & AI Engineer',
                'ctc': Decimal('7.50'),
                'offer_days_ago': 15,
                'joining_days_ahead': 10,
                'offer_ref': 'OFF-ZOHO-8821'
            },
            # STD-2026-008 (Rahul Dravid - Placed at Freshworks 9.2 LPA)
            {
                'student_id': 'STD-2026-008',
                'company_name': 'Freshworks Inc.',
                'job_role': 'Frontend React & Full Stack Developer',
                'ctc': Decimal('9.20'),
                'offer_days_ago': 20,
                'joining_days_ahead': 5,
                'offer_ref': 'OFF-FW-2026-90'
            },
            # STD-2026-005 (Vignesh Kumar - Placed at AWS 12.0 LPA)
            {
                'student_id': 'STD-2026-005',
                'company_name': 'Amazon Web Services (AWS)',
                'job_role': 'Cloud Solutions Engineer',
                'ctc': Decimal('12.00'),
                'offer_days_ago': 5,
                'joining_days_ahead': 25,
                'offer_ref': 'AWS-OFFER-4401'
            },
            # STD-2026-006 (Deepak Chakravarthy - Placed at TCS 6.8 LPA)
            {
                'student_id': 'STD-2026-006',
                'company_name': 'Tata Consultancy Services (TCS)',
                'job_role': 'System Engineer (Digital Track)',
                'ctc': Decimal('6.80'),
                'offer_days_ago': 8,
                'joining_days_ahead': 14,
                'offer_ref': 'TCS-DIG-88401'
            }
        ]

        created_count = 0
        for p in placements_data:
            student = Student.objects.filter(enrollment_id=p['student_id']).first()
            if not student:
                continue

            company = HiringCompany.objects.filter(name=p['company_name']).first()
            company_obj = company

            placement, created = PlacementRecord.objects.get_or_create(
                student=student,
                defaults={
                    'company': company_obj,
                    'company_name': p['company_name'],
                    'job_role': p['job_role'],
                    'ctc_package': p['ctc'],
                    'offer_date': today - timedelta(days=p['offer_days_ago']),
                    'joining_date': today + timedelta(days=p['joining_days_ahead']),
                    'offer_letter_number': p['offer_ref'],
                    'placement_status': 'placed'
                }
            )

            if created:
                created_count += 1
                # Sync student status to placed
                if student.status != 'placed':
                    student.status = 'placed'
                    student.save(update_fields=['status'])
                if hasattr(student, 'enrollment') and student.enrollment:
                    student.enrollment.status = 'placed'
                    student.enrollment.save(update_fields=['status'])

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} placement records (Total: {PlacementRecord.objects.count()}).'))
