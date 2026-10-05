from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LearningPathViewSet, LearningLevelViewSet, LearningModuleViewSet,
    LearningContentViewSet, LearningAssessmentViewSet, StudentLearningProgressViewSet,
    StudentAssessmentResultViewSet, LiveClassViewSet, JobOpportunityViewSet,
    JobApplicationViewSet, JobInterviewViewSet, StudentPerformanceView
)

router = DefaultRouter()
router.register('paths', LearningPathViewSet, basename='learning-paths')
router.register('levels', LearningLevelViewSet, basename='learning-levels')
router.register('modules', LearningModuleViewSet, basename='learning-modules')
router.register('contents', LearningContentViewSet, basename='learning-contents')
router.register('assessments', LearningAssessmentViewSet, basename='learning-assessments')
router.register('progress', StudentLearningProgressViewSet, basename='student-learning-progress')
router.register('assessment-results', StudentAssessmentResultViewSet, basename='student-assessment-results')
router.register('live-classes', LiveClassViewSet, basename='live-classes')
router.register('jobs', JobOpportunityViewSet, basename='job-opportunities')
router.register('applications', JobApplicationViewSet, basename='job-applications')
router.register('interviews', JobInterviewViewSet, basename='job-interviews')

urlpatterns = [
    path('performance/', StudentPerformanceView.as_view(), name='student-performance-list'),
    path('performance/<int:student_id>/', StudentPerformanceView.as_view(), name='student-performance-detail'),
    path('', include(router.urls)),
]
