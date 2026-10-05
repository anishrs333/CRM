from rest_framework import serializers
from .models import (
    LearningPath, LearningLevel, LearningModule, LearningContent,
    LearningAssessment, StudentLearningProgress, StudentAssessmentResult,
    LiveClass, LiveClassAttendance, JobOpportunity, JobApplication, JobInterview
)
from apps.students.models import Student, Course, HiringCompany
from django.contrib.auth import get_user_model

User = get_user_model()


class LearningContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningContent
        fields = '__all__'


class LearningContentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningContent
        fields = '__all__'


class LearningModuleSerializer(serializers.ModelSerializer):
    contents = LearningContentListSerializer(many=True, read_only=True)

    class Meta:
        model = LearningModule
        fields = '__all__'


class LearningLevelSerializer(serializers.ModelSerializer):
    modules = LearningModuleSerializer(many=True, read_only=True)

    class Meta:
        model = LearningLevel
        fields = '__all__'


class LearningPathSerializer(serializers.ModelSerializer):
    levels = LearningLevelSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = '__all__'


class LearningAssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningAssessment
        fields = '__all__'


class StudentLearningProgressSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    learning_path_title = serializers.CharField(source='learning_path.title', read_only=True)

    class Meta:
        model = StudentLearningProgress
        fields = '__all__'


class StudentAssessmentResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assessment_title = serializers.CharField(source='assessment.title', read_only=True)

    class Meta:
        model = StudentAssessmentResult
        fields = '__all__'


class LiveClassAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = LiveClassAttendance
        fields = '__all__'


class LiveClassSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.title', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    attendances = LiveClassAttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = LiveClass
        fields = '__all__'


class JobOpportunitySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = JobOpportunity
        fields = '__all__'


class JobInterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobInterview
        fields = '__all__'


class JobApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company.name', read_only=True)
    interviews = JobInterviewSerializer(many=True, read_only=True)

    class Meta:
        model = JobApplication
        fields = '__all__'
