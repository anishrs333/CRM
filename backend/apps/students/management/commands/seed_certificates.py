import uuid
from datetime import date
from django.core.management.base import BaseCommand
from apps.students.models import Student, Certificate, Course


class Command(BaseCommand):
    help = 'Seed Certificates file-wise for completed students'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Certificates File-Wise...'))

        completed_students = Student.objects.filter(status__in=['completed', 'placed'])
        if not completed_students.exists():
            self.stdout.write(self.style.WARNING('No completed or placed students found to issue certificates.'))
            return

        created_count = 0
        for student in completed_students:
            enrollment = getattr(student, 'enrollment', None)
            course = enrollment.course if enrollment and enrollment.course else Course.objects.first()
            if not course:
                continue

            existing = Certificate.objects.filter(student=student, course=course).first()
            if not existing:
                clean_enr = student.enrollment_id.replace('STD-', '')
                cert_code = f"CERT-2026-{clean_enr}-{uuid.uuid4().hex[:6].upper()}"

                comp_date = (enrollment.completion_date if enrollment and enrollment.completion_date else date.today())

                Certificate.objects.create(
                    certificate_id=cert_code,
                    student=student,
                    course=course,
                    enrollment=enrollment,
                    certificate_title=f"Certificate of Completion in {course.title}",
                    completion_date=comp_date,
                    issue_date=date.today(),
                    status='active'
                )
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} certificates (Total: {Certificate.objects.count()}).'))
