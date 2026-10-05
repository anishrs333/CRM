from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from apps.users.models import User
from apps.products.models import Product
from apps.customers.models import Customer, CustomerContact
from apps.leads.models import Lead, LeadNote
from apps.opportunities.models import Opportunity
from apps.quotations.models import Quotation, QuotationItem
from apps.tasks.models import Task
from apps.notifications.models import Notification


class Command(BaseCommand):
    help = 'Seed comprehensive test data across all CRM phases into the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting CRM Database Seeding Process...'))

        # ----------------------------------------------------
        # PHASE 1: Users & Roles
        # ----------------------------------------------------
        admin_user, created = User.objects.get_or_create(
            username='anish',
            defaults={
                'email': 'admin@plsofttech.com',
                'first_name': 'Anish',
                'last_name': 'Kumar',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        crm_admin_user, _ = User.objects.get_or_create(
            username='crm_admin',
            defaults={
                'email': 'crm_admin@plsofttech.com',
                'first_name': 'CRM',
                'last_name': 'Admin',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        crm_admin_user.set_password('admin123')
        crm_admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            username='alex_manager',
            defaults={
                'email': 'alex.manager@plsofttech.com',
                'first_name': 'Alex',
                'last_name': 'Rivera',
                'role': 'sales_manager',
            }
        )
        manager_user.set_password('admin123')
        manager_user.save()

        crm_manager_user, _ = User.objects.get_or_create(
            username='manager_crm',
            defaults={
                'email': 'manager_crm@plsofttech.com',
                'first_name': 'CRM',
                'last_name': 'Manager',
                'role': 'sales_manager',
            }
        )
        crm_manager_user.set_password('admin123')
        crm_manager_user.save()

        rep_user, _ = User.objects.get_or_create(
            username='jessica_sales',
            defaults={
                'email': 'jessica.sales@plsofttech.com',
                'first_name': 'Jessica',
                'last_name': 'Chen',
                'role': 'sales_rep',
            }
        )
        rep_user.set_password('admin123')
        rep_user.save()

        self.stdout.write(self.style.SUCCESS('[OK] Phase 1 Users seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 2: Products & Customers
        # ----------------------------------------------------
        prod1, _ = Product.objects.get_or_create(
            sku='PRD-CRM-ENT',
            defaults={
                'name': 'PL CRM Enterprise Software Suite',
                'description': 'Complete CRM suite with Lead Management, Sales Pipeline, and Quotation Engine.',
                'category': 'Software License',
                'unit_price': Decimal('75000.00'),
                'tax_percentage': Decimal('18.00'),
                'is_active': True,
            }
        )

        prod2, _ = Product.objects.get_or_create(
            sku='PRD-CLOUD-SETUP',
            defaults={
                'name': 'Cloud Infrastructure & Database Setup',
                'description': 'Deployment of MySQL database, SSL security, and API backend load balancers.',
                'category': 'Professional Services',
                'unit_price': Decimal('35000.00'),
                'tax_percentage': Decimal('18.00'),
                'is_active': True,
            }
        )

        prod3, _ = Product.objects.get_or_create(
            sku='PRD-API-INT',
            defaults={
                'name': 'Custom ERP & Payment Gateway Integration',
                'description': 'REST API integration between CRM, SAP ERP, and Razorpay/Stripe gateways.',
                'category': 'Development',
                'unit_price': Decimal('45000.00'),
                'tax_percentage': Decimal('18.00'),
                'is_active': True,
            }
        )

        cust1, _ = Customer.objects.get_or_create(
            name='Apex Global Tech Solutions',
            defaults={
                'customer_type': 'company',
                'email': 'info@apextech.io',
                'phone': '+91 9876543210',
                'website': 'https://apextech.io',
                'address': 'Plot 42, Cyber City, Phase III',
                'city': 'Bengaluru',
                'state': 'Karnataka',
                'country': 'India',
                'postal_code': '560100',
                'gst_number': '29ABCDE1234F1Z5',
                'account_manager': manager_user,
            }
        )

        CustomerContact.objects.get_or_create(
            customer=cust1,
            email='sarah.connor@apextech.io',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Connor',
                'designation': 'CTO',
                'phone': '+91 9876543211',
                'is_primary': True,
            }
        )

        cust2, _ = Customer.objects.get_or_create(
            name='Starlight Logistics Ltd',
            defaults={
                'customer_type': 'company',
                'email': 'contact@starlightlogistics.com',
                'phone': '+91 9812345678',
                'website': 'https://starlightlogistics.com',
                'address': 'Logistics Hub 8, Sector 12',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'country': 'India',
                'postal_code': '600001',
                'gst_number': '33ABCDE5678G2Z9',
                'account_manager': rep_user,
            }
        )

        self.stdout.write(self.style.SUCCESS('[OK] Phase 2 Products & Customers seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 3: Leads & Notes
        # ----------------------------------------------------
        lead1, _ = Lead.objects.get_or_create(
            email='robert@starlightlogistics.com',
            defaults={
                'first_name': 'Robert',
                'last_name': 'Downey',
                'company_name': 'Starlight Logistics Ltd',
                'phone': '+91 9765432109',
                'status': Lead.Status.QUALIFIED,
                'source': Lead.Source.WEBSITE,
                'priority': Lead.Priority.HOT,
                'estimated_budget': Decimal('150000.00'),
                'follow_up_date': timezone.now() + timedelta(days=2),
                'assigned_to': rep_user,
                'created_by': admin_user,
            }
        )

        LeadNote.objects.get_or_create(
            lead=lead1,
            note='Initial discovery call completed. Client requires multi-tenant RBAC and PDF Quote generator.',
            defaults={'author': rep_user}
        )

        lead2, _ = Lead.objects.get_or_create(
            email='marcus@novaretail.in',
            defaults={
                'first_name': 'Marcus',
                'last_name': 'Vance',
                'company_name': 'Nova Retail Chain',
                'phone': '+91 9654321098',
                'status': Lead.Status.NEW,
                'source': Lead.Source.REFERRAL,
                'priority': Lead.Priority.HOT,
                'estimated_budget': Decimal('95000.00'),
                'follow_up_date': timezone.now() + timedelta(days=1),
                'assigned_to': manager_user,
                'created_by': admin_user,
            }
        )

        self.stdout.write(self.style.SUCCESS('[OK] Phase 3 Leads & Notes seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 4: Opportunities & Pipeline
        # ----------------------------------------------------
        opp1, _ = Opportunity.objects.get_or_create(
            title='Apex Global CRM Software Contract',
            defaults={
                'customer': cust1,
                'stage': Opportunity.Stage.PROPOSAL,
                'amount': Decimal('155000.00'),
                'probability': 75,
                'expected_close_date': timezone.now().date() + timedelta(days=15),
                'assigned_to': manager_user,
                'created_by': admin_user,
            }
        )

        opp2, _ = Opportunity.objects.get_or_create(
            title='Starlight Logistics Cloud Upgrade',
            defaults={
                'customer': cust2,
                'stage': Opportunity.Stage.NEGOTIATION,
                'amount': Decimal('80000.00'),
                'probability': 90,
                'expected_close_date': timezone.now().date() + timedelta(days=7),
                'assigned_to': rep_user,
                'created_by': admin_user,
            }
        )

        self.stdout.write(self.style.SUCCESS('[OK] Phase 4 Opportunities seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 5: Commercial Quotations & Items
        # ----------------------------------------------------
        quot1, created_quot = Quotation.objects.get_or_create(
            quote_number='QT-2026-0001',
            defaults={
                'customer': cust1,
                'opportunity': opp1,
                'status': Quotation.Status.SENT,
                'valid_until': timezone.now().date() + timedelta(days=30),
                'terms_and_conditions': '1. Quotation valid for 30 days.\n2. Payment terms: 50% advance, 50% upon delivery.\n3. Taxes as per GST 18% rules.',
                'notes': 'Commercial proposal for Apex Global CRM implementation project.',
                'created_by': admin_user,
            }
        )

        if created_quot:
            QuotationItem.objects.create(
                quotation=quot1,
                product=prod1,
                description='PL CRM Enterprise Software Suite - License (10 Users)',
                quantity=1,
                unit_price=Decimal('75000.00'),
                tax_percentage=Decimal('18.00'),
            )
            QuotationItem.objects.create(
                quotation=quot1,
                product=prod2,
                description='Cloud Server Setup, Database Tuning & Security Hardening',
                quantity=1,
                unit_price=Decimal('35000.00'),
                tax_percentage=Decimal('18.00'),
            )
            QuotationItem.objects.create(
                quotation=quot1,
                product=prod3,
                description='Custom ERP Data Pipeline Integration',
                quantity=1,
                unit_price=Decimal('45000.00'),
                tax_percentage=Decimal('18.00'),
            )
            quot1.recalculate_totals()

        self.stdout.write(self.style.SUCCESS('[OK] Phase 5 Quotations & Items seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 6: Tasks & Activity Log
        # ----------------------------------------------------
        Task.objects.get_or_create(
            title='Follow up on Apex Global Quotation QT-2026-0001',
            defaults={
                'description': 'Call Sarah Connor (CTO) to review commercial proposal and answer technical questions.',
                'priority': 'high',
                'status': 'pending',
                'due_date': timezone.now() + timedelta(days=1),
                'assigned_to': manager_user,
                'customer': cust1,
                'lead': lead1,
            }
        )

        Task.objects.get_or_create(
            title='Product Demo with Starlight Logistics',
            defaults={
                'description': 'Conduct live demonstration of lead conversion workflow and PDF quotation printing.',
                'priority': 'high',
                'status': 'in_progress',
                'due_date': timezone.now() + timedelta(days=2),
                'assigned_to': rep_user,
                'customer': cust2,
                'lead': lead2,
            }
        )

        self.stdout.write(self.style.SUCCESS('[OK] Phase 6 Tasks seeded successfully.'))

        # ----------------------------------------------------
        # PHASE 7: Notifications System
        # ----------------------------------------------------
        Notification.objects.get_or_create(
            recipient=admin_user,
            title='System Alert: Seeding Completed',
            defaults={
                'message': 'Database seeding completed for all 17 CRM deliverables.',
                'notification_type': Notification.NotificationType.SYSTEM,
                'is_read': False,
            }
        )
        Notification.objects.get_or_create(
            recipient=manager_user,
            title='New Lead Assigned: Marcus Vance',
            defaults={
                'message': 'You have been assigned to new lead Marcus Vance from Nova Retail Chain.',
                'notification_type': Notification.NotificationType.LEAD,
                'is_read': False,
                'link_url': f'/leads/{lead2.id}',
            }
        )
        self.stdout.write(self.style.SUCCESS('[OK] Phase 7 Notifications seeded successfully.'))
        self.stdout.write(self.style.SUCCESS('[SUCCESS] ALL PHASES SEEDED SUCCESSFULLY IN MYSQL!'))

