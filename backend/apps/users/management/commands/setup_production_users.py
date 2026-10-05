from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.products.models import Product
from apps.customers.models import Customer, CustomerContact
from apps.leads.models import Lead, LeadNote
from apps.opportunities.models import Opportunity
from apps.quotations.models import Quotation, QuotationItem
from apps.tasks.models import Task
from apps.notifications.models import Notification


class Command(BaseCommand):
    help = 'Clean database and create 2 clean production Super User accounts (Admin & Manager)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Cleaning out all sample seed data...'))

        # Clear sample transactional and operational data
        Notification.objects.all().delete()
        Task.objects.all().delete()
        QuotationItem.objects.all().delete()
        Quotation.objects.all().delete()
        Opportunity.objects.all().delete()
        LeadNote.objects.all().delete()
        Lead.objects.all().delete()
        CustomerContact.objects.all().delete()
        Customer.objects.all().delete()
        Product.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('[OK] Sample data cleared completely.'))

        # Create 2 Production Super Users
        admin_user = User.objects.create(
            username='crm_admin',
            email='admin@plsofttech.com',
            first_name='CRM',
            last_name='Admin',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        admin_user.set_password('admin123')
        admin_user.save()

        manager_user = User.objects.create(
            username='manager_crm',
            email='manager@plsofttech.com',
            first_name='CRM',
            last_name='Manager',
            role='sales_manager',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        manager_user.set_password('admin123')
        manager_user.save()

        # Also create aliases 'admin' and 'manager' for user convenience
        admin_alias = User.objects.create(
            username='admin',
            email='admin_alias@plsofttech.com',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        admin_alias.set_password('admin123')
        admin_alias.save()

        manager_alias = User.objects.create(
            username='manager',
            email='manager_alias@plsofttech.com',
            first_name='Manager',
            last_name='User',
            role='sales_manager',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        manager_alias.set_password('admin123')
        manager_alias.save()

        self.stdout.write(self.style.SUCCESS('[SUCCESS] 2 Super User accounts created successfully!'))
        self.stdout.write(self.style.SUCCESS(' - Admin Super User: crm_admin / admin (password: admin123)'))
        self.stdout.write(self.style.SUCCESS(' - Manager Super User: manager_crm / manager (password: admin123)'))
