from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationLogListView.as_view(), name='notification-list'),
    path('whatsapp/', views.WhatsAppMessageView.as_view(), name='whatsapp-message'),
]
