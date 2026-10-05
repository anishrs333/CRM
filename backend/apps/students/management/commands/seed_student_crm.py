from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Clear and re-seed EdTech Student CRM database using file-wise commands'

    def handle(self, *args, **options):
        # 1. Delete existing data
        call_command('clear_database')

        # 2. Run file-wise seeders
        call_command('seed_all')
