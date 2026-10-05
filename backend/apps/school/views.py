from django.db.models import Q
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import (
    AcademicYear, SchoolClass, SchoolSection, SchoolSubject, SchoolStudent,
    SchoolStudentEnrollment, SchoolAdmission, SchoolParent, SchoolParentStudentLink,
    TimetableSlot, SchoolStudentAttendance, SchoolTeacherAttendance, SchoolAssignment,
    SchoolAssignmentSubmission, ExamType, SchoolExam, SchoolExamSchedule,
    SchoolExamResult, SchoolFeeStructure, SchoolStudentFeeAssignment, SchoolFeePayment
)
from .serializers import (
    AcademicYearSerializer, SchoolClassSerializer, SchoolSectionSerializer,
    SchoolSubjectSerializer, SchoolStudentSerializer, SchoolStudentEnrollmentSerializer,
    SchoolAdmissionSerializer, SchoolParentSerializer, SchoolParentStudentLinkSerializer,
    TimetableSlotSerializer, SchoolStudentAttendanceSerializer, SchoolTeacherAttendanceSerializer,
    SchoolAssignmentSerializer, SchoolAssignmentSubmissionSerializer, ExamTypeSerializer,
    SchoolExamSerializer, SchoolExamScheduleSerializer, SchoolExamResultSerializer,
    SchoolFeeStructureSerializer, SchoolStudentFeeAssignmentSerializer, SchoolFeePaymentSerializer
)


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all().prefetch_related('sections', 'subjects')
    serializer_class = SchoolClassSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolSectionViewSet(viewsets.ModelViewSet):
    queryset = SchoolSection.objects.all().select_related('school_class', 'class_teacher')
    serializer_class = SchoolSectionSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolSubjectViewSet(viewsets.ModelViewSet):
    queryset = SchoolSubject.objects.all().select_related('school_class', 'teacher')
    serializer_class = SchoolSubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolStudentViewSet(viewsets.ModelViewSet):
    queryset = SchoolStudent.objects.all().prefetch_related('enrollments', 'enrollments__school_class', 'enrollments__section')
    serializer_class = SchoolStudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        status_param = self.request.query_params.get('status')
        class_id = self.request.query_params.get('school_class')
        section_id = self.request.query_params.get('section')

        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(admission_number__icontains=search) |
                Q(email__icontains=search)
            )
        if status_param:
            qs = qs.filter(status=status_param)
        if class_id:
            qs = qs.filter(enrollments__school_class_id=class_id, enrollments__status='active')
        if section_id:
            qs = qs.filter(enrollments__section_id=section_id, enrollments__status='active')

        return qs.distinct()


class SchoolStudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = SchoolStudentEnrollment.objects.all().select_related('student', 'academic_year', 'school_class', 'section')
    serializer_class = SchoolStudentEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolAdmissionViewSet(viewsets.ModelViewSet):
    queryset = SchoolAdmission.objects.all().select_related('target_class', 'target_academic_year')
    serializer_class = SchoolAdmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if status_param:
            qs = qs.filter(status=status_param)
        if search:
            qs = qs.filter(Q(applicant_name__icontains=search) | Q(application_number__icontains=search))
        return qs


class SchoolParentViewSet(viewsets.ModelViewSet):
    queryset = SchoolParent.objects.all().prefetch_related('student_links', 'student_links__student')
    serializer_class = SchoolParentSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolParentStudentLinkViewSet(viewsets.ModelViewSet):
    queryset = SchoolParentStudentLink.objects.all().select_related('parent', 'student')
    serializer_class = SchoolParentStudentLinkSerializer
    permission_classes = [permissions.IsAuthenticated]


class TimetableSlotViewSet(viewsets.ModelViewSet):
    queryset = TimetableSlot.objects.all().select_related('academic_year', 'school_class', 'section', 'subject', 'teacher')
    serializer_class = TimetableSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        class_id = self.request.query_params.get('school_class')
        section_id = self.request.query_params.get('section')
        day = self.request.query_params.get('day')
        if class_id:
            qs = qs.filter(school_class_id=class_id)
        if section_id:
            qs = qs.filter(section_id=section_id)
        if day:
            qs = qs.filter(day_of_week=day)
        return qs

    def perform_create(self, serializer):
        # Conflict validation: same teacher, same class/section, or same room at overlapping time
        validated_data = serializer.validated_data
        teacher = validated_data.get('teacher')
        day = validated_data.get('day_of_week')
        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        room = validated_data.get('room_number')
        school_class = validated_data.get('school_class')
        section = validated_data.get('section')

        conflicts = TimetableSlot.objects.filter(
            day_of_week=day,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).filter(
            Q(teacher=teacher) |
            Q(school_class=school_class, section=section) |
            Q(room_number=room)
        )
        if conflicts.exists():
            raise serializers.ValidationError('Timetable conflict detected: Teacher, Class/Section, or Room is already scheduled during this slot.')

        serializer.save()


class SchoolStudentAttendanceViewSet(viewsets.ModelViewSet):
    queryset = SchoolStudentAttendance.objects.all().select_related('student', 'academic_year', 'school_class', 'section', 'recorded_by')
    serializer_class = SchoolStudentAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get('date')
        class_id = self.request.query_params.get('school_class')
        section_id = self.request.query_params.get('section')
        if date_param:
            qs = qs.filter(date=date_param)
        if class_id:
            qs = qs.filter(school_class_id=class_id)
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        attendances_data = request.data.get('attendances', [])
        recorded_by = request.user
        created_count = 0
        updated_count = 0

        for item in attendances_data:
            student_id = item.get('student_id')
            att_date = item.get('date')
            att_status = item.get('status', 'present')
            class_id = item.get('school_class')
            section_id = item.get('section')
            year_id = item.get('academic_year')

            if not student_id or not att_date:
                continue

            obj, created = SchoolStudentAttendance.objects.update_or_create(
                student_id=student_id,
                date=att_date,
                defaults={
                    'status': att_status,
                    'academic_year_id': year_id,
                    'school_class_id': class_id,
                    'section_id': section_id,
                    'recorded_by': recorded_by
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({'status': 'Bulk attendance updated.', 'created': created_count, 'updated': updated_count}, status=status.HTTP_200_OK)


class SchoolTeacherAttendanceViewSet(viewsets.ModelViewSet):
    queryset = SchoolTeacherAttendance.objects.all().select_related('teacher')
    serializer_class = SchoolTeacherAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolAssignmentViewSet(viewsets.ModelViewSet):
    queryset = SchoolAssignment.objects.all().select_related('academic_year', 'school_class', 'section', 'subject', 'teacher').prefetch_related('submissions')
    serializer_class = SchoolAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolAssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = SchoolAssignmentSubmission.objects.all().select_related('assignment', 'student')
    serializer_class = SchoolAssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExamTypeViewSet(viewsets.ModelViewSet):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolExamViewSet(viewsets.ModelViewSet):
    queryset = SchoolExam.objects.all().select_related('exam_type', 'academic_year', 'school_class').prefetch_related('schedules')
    serializer_class = SchoolExamSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = SchoolExamSchedule.objects.all().select_related('exam', 'subject')
    serializer_class = SchoolExamScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolExamResultViewSet(viewsets.ModelViewSet):
    queryset = SchoolExamResult.objects.all().select_related('exam_schedule', 'student', 'evaluated_by')
    serializer_class = SchoolExamResultSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolFeeStructureViewSet(viewsets.ModelViewSet):
    queryset = SchoolFeeStructure.objects.all().select_related('academic_year', 'school_class')
    serializer_class = SchoolFeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolStudentFeeAssignmentViewSet(viewsets.ModelViewSet):
    queryset = SchoolStudentFeeAssignment.objects.all().select_related('fee_structure', 'student').prefetch_related('payments')
    serializer_class = SchoolStudentFeeAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolFeePaymentViewSet(viewsets.ModelViewSet):
    queryset = SchoolFeePayment.objects.all().select_related('fee_assignment', 'fee_assignment__student')
    serializer_class = SchoolFeePaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
