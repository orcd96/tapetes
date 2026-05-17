from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count
from apps.orders.models import ServiceOrder
from apps.rugs.models import Rug
from apps.payments.models import Payment
from apps.users.permissions import IsAdmin


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)

        orders_today = ServiceOrder.objects.filter(created_at__date=today)
        orders_month = ServiceOrder.objects.filter(created_at__date__gte=month_start)

        rugs_in_process = Rug.objects.filter(status__in=['received', 'washing'])
        rugs_ready = Rug.objects.filter(status='ready')

        income_today = (
            Payment.objects.filter(paid_at__date=today)
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        income_month = (
            Payment.objects.filter(paid_at__date__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        pending_payment = ServiceOrder.objects.filter(
            payment_status__in=['pending', 'partial']
        ).aggregate(total=Sum('total_amount'), paid=Sum('amount_paid'))

        orders_by_status = dict(
            ServiceOrder.objects.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        return Response({
            'orders_today': orders_today.count(),
            'orders_month': orders_month.count(),
            'rugs_in_process': rugs_in_process.count(),
            'rugs_ready': rugs_ready.count(),
            'income_today': float(income_today),
            'income_month': float(income_month),
            'pending_payment_total': float(
                (pending_payment['total'] or 0) - (pending_payment['paid'] or 0)
            ),
            'orders_by_status': orders_by_status,
        })


class ReportsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')

        qs = Payment.objects.all()
        if from_date:
            qs = qs.filter(paid_at__date__gte=from_date)
        if to_date:
            qs = qs.filter(paid_at__date__lte=to_date)

        total = qs.aggregate(total=Sum('amount'))['total'] or 0
        by_method = dict(
            qs.values('method').annotate(total=Sum('amount')).values_list('method', 'total')
        )

        return Response({
            'total_income': float(total),
            'by_method': {k: float(v) for k, v in by_method.items()},
        })
