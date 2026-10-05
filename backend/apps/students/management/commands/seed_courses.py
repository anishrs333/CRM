from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.students.models import Course


class Command(BaseCommand):
    help = 'Seed Courses Catalog data file-wise'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Courses File-Wise...'))

        courses_data = [
            {
                'code': 'CRS-FSWD-90',
                'title': 'Full Stack MERN Web Development',
                'description': 'Comprehensive 90-day bootcamp covering React, Node.js, Express, MongoDB, MySQL & System Architecture.',
                'duration_days': 90,
                'fee_amount': Decimal('65000.00'),
                'category': 'Software Engineering',
            },
            {
                'code': 'CRS-DSAI-90',
                'title': 'Data Science & AI Engineering',
                'description': 'Advanced 90-day program in Python, Machine Learning, Deep Learning, SQL & PowerBI.',
                'duration_days': 90,
                'fee_amount': Decimal('75000.00'),
                'category': 'Data & AI',
            },
            {
                'code': 'CRS-DEVOPS-90',
                'title': 'Cloud DevOps & AWS Architecture',
                'description': 'Hands-on 90-day training in Docker, Kubernetes, AWS, Terraform, CI/CD pipelines & Linux.',
                'duration_days': 90,
                'fee_amount': Decimal('60000.00'),
                'category': 'Cloud & Infrastructure',
            },
            {
                'code': 'CRS-JAVA-120',
                'title': 'Java Full Stack & Spring Boot Master',
                'description': '120-day intensive Java 21, Spring Boot, Microservices, Hibernate & Angular specialization.',
                'duration_days': 120,
                'fee_amount': Decimal('70000.00'),
                'category': 'Software Engineering',
            },
            {
                'code': 'CRS-UIUX-60',
                'title': 'UI/UX Design & Product Prototyping',
                'description': '60-day practical design course covering Figma, Wireframing, User Research & Design Systems.',
                'duration_days': 60,
                'fee_amount': Decimal('45000.00'),
                'category': 'Design & Product',
            },
            {
                'code': 'CRS-CYBER-180',
                'title': 'Cyber Security & Ethical Hacking Master',
                'description': '180-day specialization in Penetration Testing, Network Security, SIEM & CEH Preparation.',
                'duration_days': 180,
                'fee_amount': Decimal('90000.00'),
                'category': 'Cyber Security',
            }
        ]

        created_count = 0
        for item in courses_data:
            course, created = Course.objects.get_or_create(
                code=item['code'],
                defaults=item
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} courses (Total: {Course.objects.count()}).'))
