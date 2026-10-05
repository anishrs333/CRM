from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.students.models import Course, Student, StudentEnrollment, CourseExtension, StudentPayment, PlacementRecord, HiringCompany
from apps.leads.models import Lead
from apps.customers.models import Customer
from apps.opportunities.models import Opportunity
from apps.quotations.models import Quotation
from apps.products.models import Product
from apps.tasks.models import Task
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Wipe all operational data from the database EXCEPT Admin and Manager accounts.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Wiping all database data (EXCEPT Admin & Manager users)...'))

        # 1. Delete dependent student operational tables
        placements_count, _ = PlacementRecord.objects.all().delete()
        payments_count, _ = StudentPayment.objects.all().delete()
        extensions_count, _ = CourseExtension.objects.all().delete()
        enrollments_count, _ = StudentEnrollment.objects.all().delete()
        students_count, _ = Student.objects.all().delete()
        companies_count, _ = HiringCompany.objects.all().delete()
        courses_count, _ = Course.objects.all().delete()

        # 2. Delete legacy CRM records
        Quotation.objects.all().delete()
        Opportunity.objects.all().delete()
        Customer.objects.all().delete()
        Lead.objects.all().delete()
        Product.objects.all().delete()
        Task.objects.all().delete()
        Notification.objects.all().delete()

        # 3. Delete non-admin and non-manager user accounts
        non_admin_users = User.objects.exclude(
            role__in=['admin', 'manager', 'sales_manager']
        ).exclude(
            is_superuser=True
        ).exclude(
            is_staff=True
        )
        deleted_users_count, _ = non_admin_users.delete()

        # 4. Ensure Admin account exists
        admin_user = User.objects.filter(username='crm_admin').first() or User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                username='crm_admin',
                email='admin@plsofttech.com',
                password='admin123',
                first_name='Institute',
                last_name='Administrator',
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS('Created default Admin user: crm_admin / admin123'))
        else:
            admin_user.set_password('admin123')
            admin_user.save()

        # 5. Ensure Manager account exists
        manager_user = User.objects.filter(username='manager_crm').first() or User.objects.filter(role__in=['manager', 'sales_manager']).exclude(id=admin_user.id).first()
        if not manager_user:
            manager_user = User.objects.create_user(
                username='manager_crm',
                email='manager@plsofttech.com',
                password='manager123',
                first_name='Academic',
                last_name='Manager',
                role='sales_manager',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS('Created default Manager user: manager_crm / manager123'))
        else:
            manager_user.set_password('manager123')
            manager_user.save()

        # Output Summary
        active_users = list(User.objects.all().values_list('username', 'role'))

        self.stdout.write(self.style.SUCCESS(
            f'==================================================\n'
            f'DATABASE WIPED SUCCESSFULLY (PRESERVED ADMIN & MANAGER)\n'
            f'==================================================\n'
            f'Deleted Records Summary:\n'
            f' - Students & Enrollments: {students_count}\n'
            f' - Fee Payments: {payments_count}\n'
            f' - Placement Records: {placements_count}\n'
            f' - Course Extensions: {extensions_count}\n'
            f' - Courses: {courses_count}\n'
            f' - Hiring Companies: {companies_count}\n'
            f' - Deleted Non-Admin Users: {deleted_users_count}\n\n'
            f'Preserved User Accounts in Database:\n'
            f' {active_users}\n'
            f'=================================================='
        ))
