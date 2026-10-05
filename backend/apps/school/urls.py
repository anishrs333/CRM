from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, SchoolClassViewSet, SchoolSectionViewSet, SchoolSubjectViewSet,
    SchoolStudentViewSet, SchoolStudentEnrollmentViewSet, SchoolAdmissionViewSet,
    SchoolParentViewSet, SchoolParentStudentLinkViewSet, TimetableSlotViewSet,
    SchoolStudentAttendanceViewSet, SchoolTeacherAttendanceViewSet, SchoolAssignmentViewSet,
    SchoolAssignmentSubmissionViewSet, ExamTypeViewSet, SchoolExamViewSet,
    SchoolExamScheduleViewSet, SchoolExamResultViewSet, SchoolFeeStructureViewSet,
    SchoolStudentFeeAssignmentViewSet, SchoolFeePaymentViewSet
)

router = DefaultRouter()
router.register('academic-years', AcademicYearViewSet, basename='school-academic-years')
router.register('classes', SchoolClassViewSet, basename='school-classes')
router.register('sections', SchoolSectionViewSet, basename='school-sections')
router.register('subjects', SchoolSubjectViewSet, basename='school-subjects')
router.register('students', SchoolStudentViewSet, basename='school-students')
router.register('enrollments', SchoolStudentEnrollmentViewSet, basename='school-enrollments')
router.register('admissions', SchoolAdmissionViewSet, basename='school-admissions')
router.register('parents', SchoolParentViewSet, basename='school-parents')
router.register('parent-links', SchoolParentStudentLinkViewSet, basename='school-parent-links')
router.register('timetable', TimetableSlotViewSet, basename='school-timetable')
router.register('student-attendance', SchoolStudentAttendanceViewSet, basename='school-student-attendance')
router.register('teacher-attendance', SchoolTeacherAttendanceViewSet, basename='school-teacher-attendance')
router.register('assignments', SchoolAssignmentViewSet, basename='school-assignments')
router.register('assignment-submissions', SchoolAssignmentSubmissionViewSet, basename='school-assignment-submissions')
router.register('exam-types', ExamTypeViewSet, basename='school-exam-types')
router.register('exams', SchoolExamViewSet, basename='school-exams')
router.register('exam-schedules', SchoolExamScheduleViewSet, basename='school-exam-schedules')
router.register('exam-results', SchoolExamResultViewSet, basename='school-exam-results')
router.register('fee-structures', SchoolFeeStructureViewSet, basename='school-fee-structures')
router.register('fee-assignments', SchoolStudentFeeAssignmentViewSet, basename='school-fee-assignments')
router.register('fee-payments', SchoolFeePaymentViewSet, basename='school-fee-payments')

urlpatterns = [
    path('', include(router.urls)),
]
