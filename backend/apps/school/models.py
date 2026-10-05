from datetime import date
from decimal import Decimal
from django.conf import settings
from django.db import models


class AcademicYear(models.Model):
    name = models.CharField(max_length=50, unique=True, help_text='e.g. 2025-2026')
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} {'(Current)' if self.is_current else ''}"


class SchoolClass(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text='e.g. Class 10, Grade 1')
    code = models.CharField(max_length=30, unique=True, help_text='e.g. CL10')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SchoolSection(models.Model):
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=50, help_text='e.g. Section A, Section B')
    class_teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_sections')

    class Meta:
        ordering = ['school_class', 'name']
        unique_together = ('school_class', 'name')

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"


class SchoolSubject(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='subjects')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_subjects')

    class Meta:
        ordering = ['school_class', 'name']
        unique_together = ('school_class', 'code')

    def __str__(self):
        return f"{self.name} ({self.school_class.name})"


class SchoolStudent(models.Model):
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('transferred', 'Transferred'),
        ('graduated', 'Graduated'),
        ('archived', 'Archived'),
    )

    admission_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='school_student_profile')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='male')
    date_of_birth = models.DateField(default=date.today)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    admission_date = models.DateField(default=date.today)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    photo_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-admission_date', 'last_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.admission_number} - {self.full_name}"


class SchoolStudentEnrollment(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('promoted', 'Promoted'),
        ('withdrawn', 'Withdrawn'),
    )

    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.PROTECT, related_name='student_enrollments')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.PROTECT, related_name='student_enrollments')
    section = models.ForeignKey(SchoolSection, on_delete=models.PROTECT, related_name='student_enrollments')
    roll_number = models.CharField(max_length=30, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'academic_year')
        ordering = ['academic_year', 'school_class', 'section', 'roll_number']

    def __str__(self):
        return f"{self.student.full_name} - {self.school_class.name} {self.section.name} ({self.academic_year.name})"


class SchoolAdmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('enrolled', 'Enrolled'),
    )

    application_number = models.CharField(max_length=50, unique=True)
    applicant_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, default='male')
    parent_name = models.CharField(max_length=200)
    parent_phone = models.CharField(max_length=20)
    parent_email = models.EmailField(blank=True, default='')
    target_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='admissions')
    target_academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='admissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application_number} - {self.applicant_name} ({self.status})"


class SchoolParent(models.Model):
    RELATION_CHOICES = (
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Legal Guardian'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='school_parent_profile')
    full_name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=20, choices=RELATION_CHOICES, default='father')
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, default='')
    occupation = models.CharField(max_length=100, blank=True, default='')
    address = models.TextField(blank=True, default='')
    emergency_contact = models.CharField(max_length=20, blank=True, default='')

    def __str__(self):
        return f"{self.full_name} ({self.get_relationship_display()})"


class SchoolParentStudentLink(models.Model):
    parent = models.ForeignKey(SchoolParent, on_delete=models.CASCADE, related_name='student_links')
    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='parent_links')
    relationship_type = models.CharField(max_length=50, default='Parent')

    class Meta:
        unique_together = ('parent', 'student')

    def __str__(self):
        return f"{self.parent.full_name} -> {self.student.full_name}"


class TimetableSlot(models.Model):
    DAY_CHOICES = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
    )

    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='timetable_slots')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='timetable_slots')
    section = models.ForeignKey(SchoolSection, on_delete=models.CASCADE, related_name='timetable_slots')
    subject = models.ForeignKey(SchoolSubject, on_delete=models.CASCADE, related_name='timetable_slots')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='timetable_slots')
    day_of_week = models.CharField(max_length=15, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=50, blank=True, default='Room 101')

    class Meta:
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.school_class.name} {self.section.name} - {self.subject.name} ({self.day_of_week} {self.start_time}-{self.end_time})"


class SchoolStudentAttendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('half_day', 'Half Day'),
        ('excused', 'Excused'),
    )

    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='attendances')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='student_attendances')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='student_attendances')
    section = models.ForeignKey(SchoolSection, on_delete=models.CASCADE, related_name='student_attendances')
    date = models.DateField(default=date.today)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    remarks = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_student_attendances')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.full_name} - {self.date}: {self.status}"


class SchoolTeacherAttendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('leave', 'On Leave'),
    )

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teacher_attendances')
    date = models.DateField(default=date.today)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('teacher', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Teacher {self.teacher.get_full_name()} - {self.date}: {self.status}"


class SchoolAssignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='assignments')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='assignments')
    section = models.ForeignKey(SchoolSection, on_delete=models.CASCADE, related_name='assignments')
    subject = models.ForeignKey(SchoolSubject, on_delete=models.CASCADE, related_name='assignments')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_assignments')
    due_date = models.DateField()
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('100.00'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.school_class.name} - {self.subject.name})"


class SchoolAssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
        ('late', 'Late Submission'),
    )

    assignment = models.ForeignKey(SchoolAssignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='assignment_submissions')
    submission_date = models.DateTimeField(auto_now_add=True)
    text_submission = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['-submission_date']

    def __str__(self):
        return f"Submission by {self.student.full_name} for {self.assignment.title}"


class ExamType(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text='e.g. Midterm, Final Exam, Unit Test 1')

    def __str__(self):
        return self.name


class SchoolExam(models.Model):
    title = models.CharField(max_length=200)
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name='exams')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='exams')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='exams')
    start_date = models.DateField()
    end_date = models.DateField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.title} ({self.school_class.name} - {self.academic_year.name})"


class SchoolExamSchedule(models.Model):
    exam = models.ForeignKey(SchoolExam, on_delete=models.CASCADE, related_name='schedules')
    subject = models.ForeignKey(SchoolSubject, on_delete=models.CASCADE, related_name='exam_schedules')
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('100.00'))
    passing_marks = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('40.00'))

    class Meta:
        unique_together = ('exam', 'subject')
        ordering = ['exam_date', 'start_time']

    def __str__(self):
        return f"{self.exam.title} - {self.subject.name} on {self.exam_date}"


class SchoolExamResult(models.Model):
    exam_schedule = models.ForeignKey(SchoolExamSchedule, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='exam_results')
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=10, blank=True, default='A')
    remarks = models.TextField(blank=True, default='')
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluated_exam_results')

    class Meta:
        unique_together = ('exam_schedule', 'student')

    def __str__(self):
        return f"{self.student.full_name} - {self.exam_schedule.subject.name}: {self.marks_obtained}"


class SchoolFeeStructure(models.Model):
    name = models.CharField(max_length=200, help_text='e.g. Annual Tuition Fee Grade 10')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='fee_structures')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='fee_structures')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.total_amount}"


class SchoolStudentFeeAssignment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Fully Paid'),
        ('overdue', 'Overdue'),
    )

    fee_structure = models.ForeignKey(SchoolFeeStructure, on_delete=models.CASCADE, related_name='student_assignments')
    student = models.ForeignKey(SchoolStudent, on_delete=models.CASCADE, related_name='fee_assignments')
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fee_structure', 'student')

    @property
    def balance_due(self):
        return max(Decimal('0.00'), self.amount_due - self.amount_paid)

    def __str__(self):
        return f"{self.student.full_name} - {self.fee_structure.name} (Paid: ₹{self.amount_paid} / ₹{self.amount_due})"


class SchoolFeePayment(models.Model):
    fee_assignment = models.ForeignKey(SchoolStudentFeeAssignment, on_delete=models.CASCADE, related_name='payments')
    receipt_number = models.CharField(max_length=50, unique=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(default=date.today)
    payment_method = models.CharField(max_length=50, default='UPI')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate amount_paid on fee assignment
        assignment = self.fee_assignment
        total = assignment.payments.aggregate(models.Sum('amount_paid'))['amount_paid__sum'] or Decimal('0.00')
        assignment.amount_paid = total
        if assignment.amount_paid >= assignment.amount_due:
            assignment.status = 'paid'
        elif assignment.amount_paid > Decimal('0.00'):
            assignment.status = 'partial'
        assignment.save()

    def __str__(self):
        return f"Receipt #{self.receipt_number} - ₹{self.amount_paid}"
