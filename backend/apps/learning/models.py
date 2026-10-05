from datetime import date
from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.students.models import Student, Course, HiringCompany


class LearningPath(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('draft', 'Draft'),
        ('archived', 'Archived'),
    )

    title = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    category = models.CharField(max_length=100, default='Software Engineering')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    prerequisites = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.code})"


class LearningLevel(models.Model):
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='levels')
    level_number = models.IntegerField(default=1)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['learning_path', 'level_number']
        unique_together = ('learning_path', 'level_number')

    def __str__(self):
        return f"Level {self.level_number}: {self.title} ({self.learning_path.code})"


class LearningModule(models.Model):
    level = models.ForeignKey(LearningLevel, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    order = models.IntegerField(default=1)

    class Meta:
        ordering = ['level', 'order']

    def __str__(self):
        return f"Module: {self.title}"


class LearningContent(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('video', 'Video Lecture'),
        ('document', 'Reading Document'),
        ('article', 'Article'),
        ('quiz', 'Quiz / Exercise'),
    )

    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='video')
    resource_url = models.URLField(blank=True, default='')
    duration_minutes = models.IntegerField(default=30)
    order = models.IntegerField(default=1)

    class Meta:
        ordering = ['module', 'order']

    def __str__(self):
        return f"{self.title} ({self.get_content_type_display()})"


class LearningAssessment(models.Model):
    module = models.ForeignKey(LearningModule, on_delete=models.CASCADE, related_name='assessments', null=True, blank=True)
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='assessments', null=True, blank=True)
    title = models.CharField(max_length=200)
    max_score = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('100.00'))
    passing_score = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('60.00'))

    def __str__(self):
        return f"Assessment: {self.title} (Max: {self.max_score})"


class StudentLearningProgress(models.Model):
    STATUS_CHOICES = (
        ('enrolled', 'Enrolled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='learning_progress')
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='student_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    progress_percentage = models.IntegerField(default=0)
    started_at = models.DateField(default=date.today)
    completed_at = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'learning_path')

    def __str__(self):
        return f"{self.student.full_name} - {self.learning_path.title} ({self.progress_percentage}%)"


class StudentAssessmentResult(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assessment_results')
    assessment = models.ForeignKey(LearningAssessment, on_delete=models.CASCADE, related_name='student_results')
    score_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    is_passed = models.BooleanField(default=False)
    taken_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True, default='')

    def save(self, *args, **kwargs):
        if self.score_obtained is not None and self.assessment:
            self.is_passed = self.score_obtained >= self.assessment.passing_score
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.full_name} - {self.assessment.title}: {self.score_obtained}"


class LiveClass(models.Model):
    MODE_CHOICES = (
        ('online', 'Online Video Stream'),
        ('offline', 'In-Person Physical Classroom'),
    )
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Live Now'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='live_classes')
    learning_path = models.ForeignKey(LearningPath, on_delete=models.SET_NULL, null=True, blank=True, related_name='live_classes')
    faculty = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conducted_classes')
    class_date = models.DateField(default=date.today)
    start_time = models.TimeField()
    end_time = models.TimeField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='online')
    meeting_link = models.URLField(blank=True, default='')
    location = models.CharField(max_length=200, blank=True, default='Lab 101 / Online')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, default='')
    recording_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-class_date', 'start_time']

    def __str__(self):
        return f"Live Class: {self.title} on {self.class_date}"


class LiveClassAttendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    )

    live_class = models.ForeignKey(LiveClass, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='live_class_attendances')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('live_class', 'student')

    def __str__(self):
        return f"{self.student.full_name} - {self.live_class.title} ({self.status})"


class JobOpportunity(models.Model):
    JOB_TYPE_CHOICES = (
        ('full_time', 'Full Time Job'),
        ('internship', 'Internship Program'),
    )

    title = models.CharField(max_length=200)
    company = models.ForeignKey(HiringCompany, on_delete=models.CASCADE, related_name='job_opportunities')
    job_type = models.CharField(max_length=30, choices=JOB_TYPE_CHOICES, default='full_time')
    location = models.CharField(max_length=150, default='Chennai / Remote')
    ctc_or_stipend = models.CharField(max_length=100, default='6.0 LPA')
    description = models.TextField(blank=True, default='')
    requirements = models.TextField(blank=True, default='')
    application_deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company.name}"


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview Scheduled'),
        ('selected', 'Selected'),
        ('offer', 'Offer Issued'),
        ('placed', 'Placed'),
        ('rejected', 'Rejected'),
    )

    job = models.ForeignKey(JobOpportunity, on_delete=models.CASCADE, related_name='applications')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='job_applications')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='applied')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('job', 'student')

    def __str__(self):
        return f"{self.student.full_name} applied for {self.job.title} ({self.status})"


class JobInterview(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    application = models.ForeignKey(JobApplication, on_delete=models.CASCADE, related_name='interviews')
    round_name = models.CharField(max_length=100, default='Technical Round 1')
    interview_date = models.DateTimeField()
    interviewer_name = models.CharField(max_length=150, blank=True, default='')
    location_or_link = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    feedback = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-interview_date']

    def __str__(self):
        return f"Interview: {self.round_name} for {self.application.student.full_name}"
