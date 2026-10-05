from datetime import date, timedelta
from decimal import Decimal
from django.db import models
from django.utils import timezone


class Course(models.Model):
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    duration_days = models.IntegerField(default=90)
    fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50000.00'))
    category = models.CharField(max_length=100, default='Software Development')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.duration_days} Days)"


class Student(models.Model):
    STATUS_CHOICES = (
        ('enrolled', 'Enrolled'),
        ('in_training', 'Ongoing Trainee'),
        ('completed', 'Course Completed'),
        ('placed', 'Placed'),
        ('dropped', 'Dropped'),
    )

    enrollment_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, default='')
    qualification = models.CharField(max_length=150, blank=True, default='B.Tech Computer Science')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_training')
    enrolled_date = models.DateField(default=date.today)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.enrollment_id} - {self.full_name}"


class StudentEnrollment(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active Training'),
        ('completed', 'Completed'),
        ('placed', 'Placed'),
        ('dropped', 'Dropped'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='enrollment')
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='enrollments')
    start_date = models.DateField(default=date.today)
    duration_days = models.IntegerField(default=90)
    extension_days = models.IntegerField(default=0, help_text='Additional days extended by Institute')
    expected_end_date = models.DateField(blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    total_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('50000.00'))
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_duration_days(self):
        return self.duration_days + self.extension_days

    def save(self, *args, **kwargs):
        if self.start_date:
            self.expected_end_date = self.start_date + timedelta(days=self.total_duration_days)
        super().save(*args, **kwargs)

    @property
    def days_elapsed(self):
        if not self.start_date:
            return 0
        today = date.today()
        if today < self.start_date:
            return 0
        if self.completion_date:
            elapsed = (self.completion_date - self.start_date).days
        else:
            elapsed = (today - self.start_date).days
        return min(elapsed, self.total_duration_days)

    @property
    def days_remaining(self):
        remaining = self.total_duration_days - self.days_elapsed
        return max(remaining, 0)

    @property
    def progress_percentage(self):
        tot = self.total_duration_days
        if not tot or tot <= 0:
            return 100
        pct = int((self.days_elapsed / tot) * 100)
        return min(max(pct, 0), 100)

    @property
    def is_duration_completed(self):
        return self.days_elapsed >= self.total_duration_days

    def __str__(self):
        return f"{self.student.full_name} enrolled in {self.course.title}"


class CourseExtension(models.Model):
    enrollment = models.ForeignKey(StudentEnrollment, on_delete=models.CASCADE, related_name='extensions')
    added_days = models.IntegerField(default=15)
    reason = models.TextField(blank=True, default='Project completion extension')
    extended_on = models.DateField(default=date.today)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Extension +{self.added_days} days for {self.enrollment.student.full_name}"


class StudentPayment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('UPI', 'UPI / GPay / PhonePe'),
        ('Bank Transfer', 'NEFT / RTGS / Bank Transfer'),
        ('Credit/Debit Card', 'Credit / Debit Card'),
        ('Cash', 'Cash'),
        ('Cheque', 'Cheque'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    enrollment = models.ForeignKey(StudentEnrollment, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=date.today)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, default='UPI')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    remarks = models.TextField(blank=True, default='Course Fee Installment')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.receipt_number} - {self.student.full_name} - ₹{self.amount_paid}"


class HiringCompany(models.Model):
    TIER_CHOICES = (
        ('Unicorn', 'Product Unicorn'),
        ('Tier-1', 'Tier-1 IT Giant'),
        ('MNC', 'Global MNC'),
        ('Startup', 'High-Growth Startup'),
    )

    name = models.CharField(max_length=255, unique=True)
    company_tier = models.CharField(max_length=50, choices=TIER_CHOICES, default='MNC')
    website = models.URLField(blank=True, default='')
    location = models.CharField(max_length=150, blank=True, default='Chennai / Bangalore')
    contact_person = models.CharField(max_length=100, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Hiring Companies'

    def __str__(self):
        return f"{self.name} ({self.get_company_tier_display()})"


class PlacementRecord(models.Model):
    STATUS_CHOICES = (
        ('offered', 'Offer Letter Issued'),
        ('placed', 'Placed & Joined'),
        ('accepted', 'Offer Accepted'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='placement')
    company = models.ForeignKey(HiringCompany, on_delete=models.SET_NULL, related_name='placements', null=True, blank=True)
    company_name = models.CharField(max_length=255)
    job_role = models.CharField(max_length=200)
    ctc_package = models.DecimalField(max_digits=10, decimal_places=2, help_text='CTC in Lakhs Per Annum (LPA)')
    offer_date = models.DateField(default=date.today)
    joining_date = models.DateField(blank=True, null=True)
    offer_letter_number = models.CharField(max_length=100, blank=True, default='')
    placement_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='placed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-offer_date']

    def __str__(self):
        return f"{self.student.full_name} placed at {self.company_name} ({self.job_role})"


class Certificate(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active / Issued'),
        ('revoked', 'Revoked'),
    )

    certificate_id = models.CharField(max_length=100, unique=True, db_index=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='certificates')
    enrollment = models.ForeignKey(StudentEnrollment, on_delete=models.SET_NULL, related_name='certificates', null=True, blank=True)
    certificate_title = models.CharField(max_length=255, default='Certificate of Course Completion')
    completion_date = models.DateField(default=date.today)
    issue_date = models.DateField(default=date.today)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    revoked_reason = models.TextField(blank=True, default='')
    institute_name = models.CharField(max_length=255, default='PL Soft Tech EdTech Institute')
    signatory_title = models.CharField(max_length=150, default='Academic Director & Head of Training')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-issue_date', '-created_at']
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.certificate_id} - {self.student.full_name} ({self.course.title})"

