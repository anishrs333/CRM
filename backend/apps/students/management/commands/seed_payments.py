from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.students.models import Student, StudentPayment


class Command(BaseCommand):
    help = 'Seed Student Fee Payments & Receipt Transactions file-wise'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Fee Payments File-Wise...'))

        today = date.today()

        # Map student enrollment IDs to payment installment records
        payments_data = [
            # STD-2026-001 (Karthik Raja - MERN 65k) -> Partial Paid 45k
            {
                'student_id': 'STD-2026-001',
                'payments': [
                    {'amount': Decimal('25000.00'), 'method': 'UPI', 'days_ago': 80, 'tx': 'UPI/2026/882191'},
                    {'amount': Decimal('20000.00'), 'method': 'Bank Transfer', 'days_ago': 40, 'tx': 'NEFT/2026/441029'}
                ]
            },
            # STD-2026-002 (Priya Dharshini - DSAI 75k) -> Fully Paid 75k
            {
                'student_id': 'STD-2026-002',
                'payments': [
                    {'amount': Decimal('35000.00'), 'method': 'UPI', 'days_ago': 45, 'tx': 'UPI/2026/771092'},
                    {'amount': Decimal('40000.00'), 'method': 'Credit/Debit Card', 'days_ago': 15, 'tx': 'CARD/2026/993812'}
                ]
            },
            # STD-2026-003 (Suresh Ramanan - DevOps 60k) -> Partial Paid 35k
            {
                'student_id': 'STD-2026-003',
                'payments': [
                    {'amount': Decimal('35000.00'), 'method': 'UPI', 'days_ago': 90, 'tx': 'UPI/2026/110293'}
                ]
            },
            # STD-2026-004 (Meena Kumari - UI/UX 45k) -> Fully Paid 45k
            {
                'student_id': 'STD-2026-004',
                'payments': [
                    {'amount': Decimal('45000.00'), 'method': 'UPI', 'days_ago': 25, 'tx': 'UPI/2026/339102'}
                ]
            },
            # STD-2026-005 (Vignesh Kumar - MERN 65k) -> Fully Paid 65k
            {
                'student_id': 'STD-2026-005',
                'payments': [
                    {'amount': Decimal('30000.00'), 'method': 'UPI', 'days_ago': 95, 'tx': 'UPI/2026/554433'},
                    {'amount': Decimal('35000.00'), 'method': 'Bank Transfer', 'days_ago': 50, 'tx': 'RTGS/2026/991023'}
                ]
            },
            # STD-2026-006 (Deepak Chakravarthy - Java 70k) -> Fully Paid 70k
            {
                'student_id': 'STD-2026-006',
                'payments': [
                    {'amount': Decimal('40000.00'), 'method': 'UPI', 'days_ago': 120, 'tx': 'UPI/2026/440192'},
                    {'amount': Decimal('30000.00'), 'method': 'UPI', 'days_ago': 60, 'tx': 'UPI/2026/884102'}
                ]
            },
            # STD-2026-007 (Ananya Sundaram - DSAI 75k) -> Fully Paid 75k
            {
                'student_id': 'STD-2026-007',
                'payments': [
                    {'amount': Decimal('40000.00'), 'method': 'UPI', 'days_ago': 110, 'tx': 'UPI/2026/993182'},
                    {'amount': Decimal('35000.00'), 'method': 'Bank Transfer', 'days_ago': 70, 'tx': 'NEFT/2026/663819'}
                ]
            },
            # STD-2026-008 (Rahul Dravid - MERN 65k) -> Fully Paid 65k
            {
                'student_id': 'STD-2026-008',
                'payments': [
                    {'amount': Decimal('65000.00'), 'method': 'UPI', 'days_ago': 130, 'tx': 'UPI/2026/123987'}
                ]
            }
        ]

        created_count = 0
        for entry in payments_data:
            student = Student.objects.filter(enrollment_id=entry['student_id']).first()
            if not student:
                continue

            enrollment = getattr(student, 'enrollment', None)

            for idx, p in enumerate(entry['payments'], start=1):
                receipt_no = f"RCPT-{student.enrollment_id}-{idx}"
                payment, created = StudentPayment.objects.get_or_create(
                    receipt_number=receipt_no,
                    defaults={
                        'student': student,
                        'enrollment': enrollment,
                        'amount_paid': p['amount'],
                        'payment_date': today - timedelta(days=p['days_ago']),
                        'payment_method': p['method'],
                        'transaction_id': p['tx'],
                        'remarks': f"Course Fee Installment #{idx}"
                    }
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} fee payment receipts (Total: {StudentPayment.objects.count()}).'))
