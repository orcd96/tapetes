from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClientListCreateView.as_view(), name='client-list'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client-detail'),
    path('<int:pk>/orders/', views.ClientOrdersView.as_view(), name='client-orders'),
    path('<int:pk>/addresses/', views.ClientAddressListCreateView.as_view(), name='client-address-list'),
    path('<int:pk>/addresses/<int:addr_pk>/', views.ClientAddressDetailView.as_view(), name='client-address-detail'),
]
