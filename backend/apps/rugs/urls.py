from django.urls import path
from . import views

urlpatterns = [
    path('washer/', views.WasherRugListView.as_view(), name='washer-rugs'),
    path('<int:pk>/', views.RugDetailView.as_view(), name='rug-detail'),
    path('<int:pk>/status/', views.RugStatusView.as_view(), name='rug-status'),
    path('<int:rug_pk>/photos/', views.RugPhotoUploadView.as_view(), name='rug-photos'),
]
