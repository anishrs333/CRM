from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, StudentViewSet, StudentPaymentViewSet, PlacementRecordViewSet,
    HiringCompanyViewSet, CertificateViewSet, CertificateVerificationView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'companies', HiringCompanyViewSet, basename='company')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'payments', StudentPaymentViewSet, basename='payment')
router.register(r'placements', PlacementRecordViewSet, basename='placement')
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    path('certificates/verify/', CertificateVerificationView.as_view(), name='certificate-verify'),
    path('', include(router.urls)),
]
