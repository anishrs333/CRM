from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import LoginView
from apps.reports.views import GlobalSearchView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth endpoints (supports both /login/ and standard SimpleJWT /token/)
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_alt'),

    # Search endpoint
    path('api/search/', GlobalSearchView.as_view(), name='root-global-search'),

    # Apps
    path('api/users/', include('apps.users.urls')),
    path('api/leads/', include('apps.leads.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/opportunities/', include('apps.opportunities.urls')),
    path('api/quotations/', include('apps.quotations.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/learning/', include('apps.learning.urls')),
    path('api/school/', include('apps.school.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/', include('apps.students.urls')),
]