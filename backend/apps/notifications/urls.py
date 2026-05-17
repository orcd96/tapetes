from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationLogListView.as_view(), name='notification-list'),
]
