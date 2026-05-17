from django.urls import path
from . import views
from apps.rugs.views import OrderRugListCreateView
from apps.payments.views import OrderPaymentListCreateView

urlpatterns = [
    path('', views.ServiceOrderListCreateView.as_view(), name='order-list'),
    path('track/', views.OrderTrackingView.as_view(), name='order-track'),
    path('prices/', views.PriceConfigListCreateView.as_view(), name='price-list'),
    path('prices/current/', views.PriceConfigCurrentView.as_view(), name='price-current'),
    path('treatments/', views.TreatmentListView.as_view(), name='treatment-list'),
    path('<int:pk>/', views.ServiceOrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', views.ServiceOrderStatusView.as_view(), name='order-status'),
    path('<int:order_pk>/rugs/', OrderRugListCreateView.as_view(), name='order-rugs'),
    path('<int:order_pk>/payments/', OrderPaymentListCreateView.as_view(), name='order-payments'),
]
