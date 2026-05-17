from django.urls import path
from . import views

urlpatterns = [
    path('driver/route/', views.DriverRouteView.as_view(), name='driver-route'),
    path('driver/pickups/<int:pk>/', views.PickupUpdateView.as_view(), name='pickup-update'),
    path('driver/deliveries/<int:pk>/', views.DeliveryUpdateView.as_view(), name='delivery-update'),
    path('pickups/', views.PickupListCreateView.as_view(), name='pickup-list'),
    path('deliveries/', views.DeliveryListCreateView.as_view(), name='delivery-list'),
]
