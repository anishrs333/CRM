from django.core.management.base import BaseCommand
from apps.students.models import HiringCompany


class Command(BaseCommand):
    help = 'Seed Corporate Hiring Partners data file-wise'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding Hiring Companies File-Wise...'))

        companies_data = [
            {
                'name': 'Zoho Corporation',
                'company_tier': 'Unicorn',
                'website': 'https://www.zoho.com',
                'location': 'Chennai, Tamil Nadu',
                'contact_person': 'Sridhar Vembu (HR Team)',
                'contact_email': 'careers@zohocorp.com',
                'contact_phone': '+91 44 67447070'
            },
            {
                'name': 'Amazon Web Services (AWS)',
                'company_tier': 'MNC',
                'website': 'https://aws.amazon.com',
                'location': 'Bangalore, Karnataka',
                'contact_person': 'Cloud Talent Acquisition',
                'contact_email': 'aws-hiring@amazon.com',
                'contact_phone': '+91 80 40001000'
            },
            {
                'name': 'Tata Consultancy Services (TCS)',
                'company_tier': 'Tier-1',
                'website': 'https://www.tcs.com',
                'location': 'Chennai / Hyderabad',
                'contact_person': 'TCS NQT Campus Placement',
                'contact_email': 'campus@tcs.com',
                'contact_phone': '+91 44 66162000'
            },
            {
                'name': 'Infosys Limited',
                'company_tier': 'MNC',
                'website': 'https://www.infosys.com',
                'location': 'Bangalore / Mysore',
                'contact_person': 'Early Career Recruitment',
                'contact_email': 'infy-hiring@infosys.com',
                'contact_phone': '+91 80 28520261'
            },
            {
                'name': 'Freshworks Inc.',
                'company_tier': 'Product MNC',
                'website': 'https://www.freshworks.com',
                'location': 'Chennai, Tamil Nadu',
                'contact_person': 'SaaS Talent Team',
                'contact_email': 'jobs@freshworks.com',
                'contact_phone': '+91 44 66007000'
            },
            {
                'name': 'Accenture Tech',
                'company_tier': 'Fortune 500',
                'website': 'https://www.accenture.com',
                'location': 'Hyderabad / Chennai',
                'contact_person': 'Campus Hiring Lead',
                'contact_email': 'accenture-jobs@accenture.com',
                'contact_phone': '+91 40 40003000'
            }
        ]

        created_count = 0
        for item in companies_data:
            company, created = HiringCompany.objects.get_or_create(
                name=item['name'],
                defaults=item
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {created_count} hiring companies (Total: {HiringCompany.objects.count()}).'))
