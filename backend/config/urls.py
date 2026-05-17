"""
URL configuration for the Rug Spa management system.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # JWT authentication
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App API routes
    path('api/users/', include('apps.users.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/rugs/', include('apps.rugs.urls')),
    path('api/logistics/', include('apps.logistics.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
