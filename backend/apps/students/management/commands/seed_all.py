from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Master command to execute all file-wise seeders sequentially'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('=================================================='))
        self.stdout.write(self.style.WARNING('STARTING FILE-WISE SEEDING FOR EDTECH INSTITUTE CRM'))
        self.stdout.write(self.style.WARNING('=================================================='))

        # 1. Seed Courses File
        call_command('seed_courses')

        # 2. Seed Corporate Companies File
        call_command('seed_companies')

        # 3. Seed Students & Enrollments File
        call_command('seed_students')

        # 4. Seed Payments & Receipts File
        call_command('seed_payments')

        # 5. Seed Placement Records File
        call_command('seed_placements')

        self.stdout.write(self.style.SUCCESS('=================================================='))
        self.stdout.write(self.style.SUCCESS('ALL FILE-WISE SEEDERS COMPLETED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('=================================================='))
