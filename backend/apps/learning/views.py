from decimal import Decimal
from django.db.models import Avg, Q, Count
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import (
    LearningPath, LearningLevel, LearningModule, LearningContent,
    LearningAssessment, StudentLearningProgress, StudentAssessmentResult,
    LiveClass, LiveClassAttendance, JobOpportunity, JobApplication, JobInterview
)
from .serializers import (
    LearningPathSerializer, LearningLevelSerializer, LearningModuleSerializer,
    LearningContentListSerializer, LearningAssessmentSerializer,
    StudentLearningProgressSerializer, StudentAssessmentResultSerializer,
    LiveClassSerializer, LiveClassAttendanceSerializer,
    JobOpportunitySerializer, JobApplicationSerializer, JobInterviewSerializer
)
from apps.students.models import Student


class LearningPathViewSet(viewsets.ModelViewSet):
    queryset = LearningPath.objects.all().prefetch_related('levels__modules__contents')
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(code__icontains=search) | Q(category__icontains=search))
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class LearningLevelViewSet(viewsets.ModelViewSet):
    queryset = LearningLevel.objects.all()
    serializer_class = LearningLevelSerializer
    permission_classes = [permissions.IsAuthenticated]


class LearningModuleViewSet(viewsets.ModelViewSet):
    queryset = LearningModule.objects.all()
    serializer_class = LearningModuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class LearningContentViewSet(viewsets.ModelViewSet):
    queryset = LearningContent.objects.all()
    serializer_class = LearningContentListSerializer
    permission_classes = [permissions.IsAuthenticated]


class LearningAssessmentViewSet(viewsets.ModelViewSet):
    queryset = LearningAssessment.objects.all()
    serializer_class = LearningAssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentLearningProgressViewSet(viewsets.ModelViewSet):
    queryset = StudentLearningProgress.objects.all().select_related('student', 'learning_path')
    serializer_class = StudentLearningProgressSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentAssessmentResultViewSet(viewsets.ModelViewSet):
    queryset = StudentAssessmentResult.objects.all().select_related('student', 'assessment')
    serializer_class = StudentAssessmentResultSerializer
    permission_classes = [permissions.IsAuthenticated]


class LiveClassViewSet(viewsets.ModelViewSet):
    queryset = LiveClass.objects.all().select_related('course', 'learning_path', 'faculty').prefetch_related('attendances')
    serializer_class = LiveClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get('date')
        mode = self.request.query_params.get('mode')
        status_param = self.request.query_params.get('status')
        if date_param:
            qs = qs.filter(class_date=date_param)
        if mode:
            qs = qs.filter(mode=mode)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def record_attendance(self, request, pk=None):
        live_class = self.get_object()
        student_id = request.data.get('student_id')
        attendance_status = request.data.get('status', 'present')

        if not student_id:
            return Response({'error': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = LiveClassAttendance.objects.update_or_create(
            live_class=live_class,
            student_id=student_id,
            defaults={'status': attendance_status}
        )
        return Response({'status': 'Attendance recorded successfully.', 'created': created}, status=status.HTTP_200_OK)


class JobOpportunityViewSet(viewsets.ModelViewSet):
    queryset = JobOpportunity.objects.all().select_related('company')
    serializer_class = JobOpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        job_type = self.request.query_params.get('job_type')
        search = self.request.query_params.get('search')
        if job_type:
            qs = qs.filter(job_type=job_type)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(company__name__icontains=search))
        return qs


class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all().select_related('job', 'job__company', 'student').prefetch_related('interviews')
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        student_id = self.request.query_params.get('student_id')
        if status_param:
            qs = qs.filter(status=status_param)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs


class JobInterviewViewSet(viewsets.ModelViewSet):
    queryset = JobInterview.objects.all().select_related('application', 'application__student')
    serializer_class = JobInterviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id=None):
        if student_id:
            students = Student.objects.filter(id=student_id)
        else:
            students = Student.objects.all()

        results = []
        for s in students[:50]:  # Paginated/bounded
            assessments = StudentAssessmentResult.objects.filter(student=s)
            avg_score = assessments.aggregate(Avg('score_obtained'))['score_obtained__avg'] or 0.0
            total_taken = assessments.count()
            passed_count = assessments.filter(is_passed=True).count()

            progress_qs = StudentLearningProgress.objects.filter(student=s)
            avg_progress = progress_qs.aggregate(Avg('progress_percentage'))['progress_percentage__avg'] or 0

            live_att = LiveClassAttendance.objects.filter(student=s)
            total_classes = live_att.count()
            attended_classes = live_att.filter(status__in=['present', 'late']).count()
            att_percentage = int((attended_classes / total_classes * 100)) if total_classes > 0 else 100

            results.append({
                'student_id': s.id,
                'student_name': s.full_name,
                'enrollment_id': s.enrollment_id,
                'course_name': s.enrollment.course.title if hasattr(s, 'enrollment') and s.enrollment else 'N/A',
                'average_assessment_score': round(float(avg_score), 2),
                'assessments_taken': total_taken,
                'assessments_passed': passed_count,
                'learning_path_progress': int(avg_progress),
                'live_class_attendance_rate': att_percentage,
                'status': s.status
            })

        if student_id and results:
            return Response(results[0], status=status.HTTP_200_OK)
        return Response(results, status=status.HTTP_200_OK)
